-- ================================================================
-- ROLES, PERMISOS Y NOTIFICACIONES (Fase 1: schema)
-- ================================================================
-- Implementa el modelo de datos para:
--   - Roles configurables por empresa con permisos granulares por código
--   - Asignación de múltiples roles por usuario
--   - Catálogo de tipos de notificación enrutados por permiso
--   - Destinatarios por notificación con estado de lectura
--
-- No se borran columnas existentes en esta migración para permitir
-- coexistencia: share_company_users.role sigue siendo fuente de
-- verdad legacy hasta que el código consuma user_roles.
-- ================================================================

BEGIN;

-- ============================================================
-- EXTENSIONES A LA TABLA roles
-- ============================================================

ALTER TABLE "roles"
  ADD COLUMN IF NOT EXISTS "is_system"   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "description" text,
  ADD COLUMN IF NOT EXISTS "company_id"  uuid REFERENCES "company"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "updated_at"  timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS "roles_company_id_idx" ON "roles" ("company_id");

-- ============================================================
-- PERMISOS
-- ============================================================
-- code: "modulo.accion" (ej. "purchase_orders.approve").
-- module: opcional, agrupa permisos en la UI por módulo del sistema.
-- action: verbo libre (view, create, update, delete, approve, etc.).
-- is_system: true para permisos provistos por la app; impiden borrado.

CREATE TABLE IF NOT EXISTS "permissions" (
  "id"          bigserial PRIMARY KEY,
  "code"        text NOT NULL UNIQUE,
  "module"      text,
  "action"      text NOT NULL,
  "description" text,
  "is_system"   boolean NOT NULL DEFAULT true,
  "created_at"  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "permissions_module_idx" ON "permissions" ("module");

-- ============================================================
-- ROLE_PERMISSIONS (N:M entre roles y permissions)
-- ============================================================

CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role_id"       bigint NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permission_id" bigint NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("role_id", "permission_id")
);

CREATE INDEX IF NOT EXISTS "role_permissions_permission_id_idx" ON "role_permissions" ("permission_id");

-- ============================================================
-- USER_ROLES (asignación de roles a usuarios por empresa)
-- ============================================================
-- Reemplaza conceptualmente a share_company_users.role permitiendo
-- que un usuario tenga múltiples roles en la misma empresa.
-- La pertenencia usuario-empresa sigue viviendo en share_company_users.

CREATE TABLE IF NOT EXISTS "user_roles" (
  "profile_id" uuid   NOT NULL REFERENCES "profile"("id") ON DELETE CASCADE,
  "company_id" uuid   NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "role_id"    bigint NOT NULL REFERENCES "roles"("id")   ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "created_by" uuid REFERENCES "profile"("id") ON DELETE SET NULL,
  PRIMARY KEY ("profile_id", "company_id", "role_id")
);

CREATE INDEX IF NOT EXISTS "user_roles_company_id_idx" ON "user_roles" ("company_id");
CREATE INDEX IF NOT EXISTS "user_roles_role_id_idx"    ON "user_roles" ("role_id");

-- ============================================================
-- NOTIFICATION_TYPES (catálogo)
-- ============================================================
-- code: identificador estable (ej. "documents.expiring_soon").
-- required_permission_code: define quién recibe esta notificación;
--   NULL = nadie por defecto (creación manual con destinatarios explícitos).
-- title_template / description_template: placeholders {{var}} resueltos
--   con notifications.metadata al renderizar.
-- link_template: ruta destino con placeholders.

CREATE TABLE IF NOT EXISTS "notification_types" (
  "code"                     text PRIMARY KEY,
  "title_template"           text NOT NULL,
  "description_template"     text,
  "category"                 "notification_categories",
  "required_permission_code" text REFERENCES "permissions"("code") ON DELETE SET NULL,
  "link_template"            text,
  "is_active"                boolean NOT NULL DEFAULT true,
  "is_system"                boolean NOT NULL DEFAULT true,
  "created_at"               timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- EXTENSIONES A notifications
-- ============================================================

ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "notification_type_code" text REFERENCES "notification_types"("code") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "metadata"               jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "dedupe_key"             text,
  ADD COLUMN IF NOT EXISTS "link"                   text;

-- dedupe_key único por empresa cuando está presente
-- (cron diario produce el mismo key y no duplica).
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_company_dedupe_key_uniq"
  ON "notifications" ("company_id", "dedupe_key")
  WHERE "dedupe_key" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "notifications_company_created_idx"
  ON "notifications" ("company_id", "created_at" DESC);

-- ============================================================
-- NOTIFICATION_RECIPIENTS (fan-out por usuario)
-- ============================================================

CREATE TABLE IF NOT EXISTS "notification_recipients" (
  "notification_id" uuid NOT NULL REFERENCES "notifications"("id") ON DELETE CASCADE,
  "profile_id"      uuid NOT NULL REFERENCES "profile"("id")        ON DELETE CASCADE,
  "read_at"         timestamptz,
  "dismissed_at"    timestamptz,
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("notification_id", "profile_id")
);

CREATE INDEX IF NOT EXISTS "notification_recipients_profile_unread_idx"
  ON "notification_recipients" ("profile_id")
  WHERE "read_at" IS NULL AND "dismissed_at" IS NULL;

COMMIT;
