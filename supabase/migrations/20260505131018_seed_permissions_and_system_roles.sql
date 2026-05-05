-- ================================================================
-- SEED: PERMISOS DE SISTEMA + ROLES DE SISTEMA + BACKFILL user_roles
-- ================================================================
-- Idempotente: usa ON CONFLICT DO NOTHING / UPDATE en todas las
-- inserciones para que pueda re-ejecutarse sin efectos.
-- ================================================================

BEGIN;

-- ============================================================
-- 1) PERMISOS DE SISTEMA
-- ============================================================
-- Set inicial conservador: CRUD básico por módulo + acciones
-- especiales en compras y tesorería. La UI de roles puede crear
-- permisos custom (is_system=false) más adelante si hace falta.

INSERT INTO "permissions" ("code", "module", "action", "description", "is_system") VALUES
  -- Empresa
  ('empresa.view',          'empresa',       'view',   'Ver datos de la empresa',                 true),
  ('empresa.update',        'empresa',       'update', 'Editar datos de la empresa',              true),

  -- Empleados
  ('empleados.view',        'empleados',     'view',   'Ver empleados',                            true),
  ('empleados.create',      'empleados',     'create', 'Crear empleados',                          true),
  ('empleados.update',      'empleados',     'update', 'Editar empleados',                         true),
  ('empleados.delete',      'empleados',     'delete', 'Eliminar empleados',                       true),

  -- Equipos
  ('equipos.view',          'equipos',       'view',   'Ver equipos',                              true),
  ('equipos.create',        'equipos',       'create', 'Crear equipos',                            true),
  ('equipos.update',        'equipos',       'update', 'Editar equipos',                           true),
  ('equipos.delete',        'equipos',       'delete', 'Eliminar equipos',                         true),

  -- Documentación
  ('documentacion.view',    'documentacion', 'view',   'Ver documentos',                           true),
  ('documentacion.create',  'documentacion', 'create', 'Subir documentos',                         true),
  ('documentacion.update',  'documentacion', 'update', 'Editar documentos',                        true),
  ('documentacion.delete',  'documentacion', 'delete', 'Eliminar documentos',                      true),

  -- Mantenimiento
  ('mantenimiento.view',    'mantenimiento', 'view',   'Ver mantenimiento',                        true),
  ('mantenimiento.create',  'mantenimiento', 'create', 'Crear mantenimiento',                      true),
  ('mantenimiento.update',  'mantenimiento', 'update', 'Editar mantenimiento',                     true),
  ('mantenimiento.delete',  'mantenimiento', 'delete', 'Eliminar mantenimiento',                   true),

  -- Dashboard
  ('dashboard.view',        'dashboard',     'view',   'Ver dashboard',                            true),

  -- Ayuda
  ('ayuda.view',            'ayuda',         'view',   'Ver ayuda',                                true),

  -- Operaciones (partes diarios)
  ('operaciones.view',      'operaciones',   'view',   'Ver operaciones',                          true),
  ('operaciones.create',    'operaciones',   'create', 'Crear operaciones',                        true),
  ('operaciones.update',    'operaciones',   'update', 'Editar operaciones',                       true),
  ('operaciones.delete',    'operaciones',   'delete', 'Eliminar operaciones',                     true),

  -- Formularios
  ('formularios.view',      'formularios',   'view',   'Ver formularios',                          true),
  ('formularios.create',    'formularios',   'create', 'Crear formularios',                        true),
  ('formularios.update',    'formularios',   'update', 'Editar formularios',                       true),
  ('formularios.delete',    'formularios',   'delete', 'Eliminar formularios',                     true),

  -- Proveedores
  ('proveedores.view',      'proveedores',   'view',   'Ver proveedores',                          true),
  ('proveedores.create',    'proveedores',   'create', 'Crear proveedores',                        true),
  ('proveedores.update',    'proveedores',   'update', 'Editar proveedores',                       true),
  ('proveedores.delete',    'proveedores',   'delete', 'Eliminar proveedores',                     true),

  -- Almacenes
  ('almacenes.view',        'almacenes',     'view',   'Ver almacenes',                            true),
  ('almacenes.create',      'almacenes',     'create', 'Crear almacenes',                          true),
  ('almacenes.update',      'almacenes',     'update', 'Editar almacenes',                         true),
  ('almacenes.delete',      'almacenes',     'delete', 'Eliminar almacenes',                       true),

  -- Compras (incluye órdenes de compra)
  ('compras.view',          'compras',       'view',   'Ver compras y órdenes de compra',          true),
  ('compras.create',        'compras',       'create', 'Crear órdenes de compra',                  true),
  ('compras.update',        'compras',       'update', 'Editar órdenes de compra',                 true),
  ('compras.delete',        'compras',       'delete', 'Eliminar órdenes de compra',               true),
  ('compras.approve',       'compras',       'approve','Aprobar órdenes de compra',                true),

  -- Tesorería (incluye órdenes de pago)
  ('tesoreria.view',        'tesoreria',     'view',   'Ver tesorería',                            true),
  ('tesoreria.create',      'tesoreria',     'create', 'Crear movimientos y órdenes de pago',      true),
  ('tesoreria.update',      'tesoreria',     'update', 'Editar movimientos y órdenes de pago',     true),
  ('tesoreria.delete',      'tesoreria',     'delete', 'Eliminar/anular movimientos y OP',         true),
  ('tesoreria.approve',     'tesoreria',     'approve','Aprobar órdenes de pago',                  true),
  ('tesoreria.confirm',     'tesoreria',     'confirm','Confirmar órdenes de pago',                true),
  ('tesoreria.pay',         'tesoreria',     'pay',    'Marcar órdenes de pago como pagadas',      true),

  -- Configuración (gestión de roles y notificaciones)
  ('roles.view',            'configuracion', 'view',   'Ver roles y permisos',                     true),
  ('roles.create',          'configuracion', 'create', 'Crear roles',                              true),
  ('roles.update',          'configuracion', 'update', 'Editar roles',                             true),
  ('roles.delete',          'configuracion', 'delete', 'Eliminar roles',                           true),
  ('roles.assign',          'configuracion', 'assign', 'Asignar roles a usuarios',                 true),
  ('notifications.view',    'configuracion', 'view',   'Ver configuración de notificaciones',      true)
ON CONFLICT ("code") DO UPDATE SET
  "module"      = EXCLUDED."module",
  "action"      = EXCLUDED."action",
  "description" = EXCLUDED."description",
  "is_system"   = EXCLUDED."is_system";

-- ============================================================
-- 2) ROLES DE SISTEMA
-- ============================================================
-- Existentes en DB: CodeControlClient, Admin, Usuario, Invitado, Auditor, Propietario.
-- Marcar todos esos como is_system=true.
-- Crear DEV (no existe) y mantener Propietario como OWNER lógico.

INSERT INTO "roles" ("name", "is_active", "intern", "is_system", "description") VALUES
  ('DEV', true, true, true, 'Desarrolladores: acceso total al sistema (no editable)')
ON CONFLICT ("name") DO UPDATE SET
  "is_system"   = true,
  "description" = COALESCE("roles"."description", EXCLUDED."description");

UPDATE "roles" SET "is_system" = true
WHERE "name" IN ('CodeControlClient', 'Admin', 'Usuario', 'Invitado', 'Auditor', 'Propietario');

UPDATE "roles" SET
  "description" = COALESCE("description", 'Propietario de la empresa: acceso total')
WHERE "name" = 'Propietario';

UPDATE "roles" SET
  "description" = COALESCE("description", 'Cliente CodeControl: acceso administrativo a la empresa')
WHERE "name" = 'CodeControlClient';

UPDATE "roles" SET
  "description" = COALESCE("description", 'Administrador de la empresa')
WHERE "name" = 'Admin';

UPDATE "roles" SET
  "description" = COALESCE("description", 'Usuario estándar: CRUD básico sin acciones de aprobación')
WHERE "name" = 'Usuario';

UPDATE "roles" SET
  "description" = COALESCE("description", 'Invitado: acceso de solo lectura a documentos, empleados y equipos')
WHERE "name" = 'Invitado';

UPDATE "roles" SET
  "description" = COALESCE("description", 'Auditor: acceso de solo lectura a todo el sistema')
WHERE "name" = 'Auditor';

-- ============================================================
-- 3) ROLE_PERMISSIONS (asignación de permisos por rol)
-- ============================================================

-- 3.1) OWNER (Propietario) y DEV: TODOS los permisos
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" IN ('Propietario', 'DEV')
ON CONFLICT DO NOTHING;

-- 3.2) CodeControlClient y Admin: TODOS los permisos
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" IN ('CodeControlClient', 'Admin')
ON CONFLICT DO NOTHING;

-- 3.3) Usuario: CRUD básico, SIN approve/confirm/pay, SIN roles.*
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'Usuario'
  AND p."action" NOT IN ('approve', 'confirm', 'pay')
  AND p."module" <> 'configuracion'
ON CONFLICT DO NOTHING;

-- 3.4) Invitado: solo VIEW en documentación, empleados, equipos + dashboard + ayuda
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'Invitado'
  AND p."code" IN (
    'dashboard.view',
    'ayuda.view',
    'documentacion.view',
    'empleados.view',
    'equipos.view'
  )
ON CONFLICT DO NOTHING;

-- 3.5) Auditor: VIEW en todos los módulos
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'Auditor'
  AND p."action" = 'view'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4) BACKFILL user_roles desde share_company_users
-- ============================================================
-- Por cada relación usuario-empresa con rol asignado, crear la
-- entrada equivalente en user_roles.

INSERT INTO "user_roles" ("profile_id", "company_id", "role_id")
SELECT DISTINCT scu."profile_id", scu."company_id", r."id"
FROM "share_company_users" scu
JOIN "roles" r ON r."name" = scu."role"
WHERE scu."profile_id" IS NOT NULL
  AND scu."company_id" IS NOT NULL
  AND scu."role"       IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5) NOTIFICATION_TYPES (catálogo inicial)
-- ============================================================

INSERT INTO "notification_types" ("code", "title_template", "description_template", "category", "required_permission_code", "link_template", "is_active") VALUES
  (
    'documents.expiring_soon',
    'Documentos por vencer',
    'Tenés {{count}} documento(s) que vencen en los próximos 5 días.',
    'vencimiento',
    'documentacion.view',
    '/dashboard/document?status=expiring',
    true
  ),
  (
    'documents.expired',
    'Documentos vencidos',
    'Tenés {{count}} documento(s) vencido(s).',
    'vencimiento',
    'documentacion.view',
    '/dashboard/document?status=expired',
    true
  ),
  (
    'purchase_orders.pending_approval',
    'Orden de compra pendiente de aprobación',
    'La OC {{number}} de {{supplier}} está pendiente de aprobación.',
    'advertencia',
    'compras.approve',
    '/dashboard/purchasing/purchase-orders/{{purchaseOrderId}}',
    true
  ),
  (
    'payment_orders.pending_approval',
    'Orden de pago pendiente de aprobación',
    'La OP {{number}} está pendiente de aprobación.',
    'advertencia',
    'tesoreria.approve',
    '/dashboard/treasury/payment-orders/{{paymentOrderId}}',
    true
  ),
  (
    'payment_orders.pending_confirmation',
    'Orden de pago pendiente de confirmación',
    'La OP {{number}} está pendiente de confirmación.',
    'advertencia',
    'tesoreria.confirm',
    '/dashboard/treasury/payment-orders/{{paymentOrderId}}',
    true
  )
ON CONFLICT ("code") DO UPDATE SET
  "title_template"           = EXCLUDED."title_template",
  "description_template"     = EXCLUDED."description_template",
  "category"                 = EXCLUDED."category",
  "required_permission_code" = EXCLUDED."required_permission_code",
  "link_template"            = EXCLUDED."link_template",
  "is_active"                = EXCLUDED."is_active";

COMMIT;
