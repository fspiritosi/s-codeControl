-- tkt-424: Calendario de vencimientos de VTV
-- Migración aditiva (solo-ADD). No altera ni borra datos existentes.

-- 1. Flag para identificar el/los document_types que representan la VTV.
ALTER TABLE "public"."document_types"
  ADD COLUMN IF NOT EXISTS "is_vtv" boolean DEFAULT false;

-- 2. Ciclo de vida del turno/orden de VTV.
DO $$ BEGIN
  CREATE TYPE "public"."vtv_appointment_status" AS ENUM (
    'pendiente', 'orden_solicitada', 'realizada', 'cancelada'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Turno de VTV (entidad nueva). appointment_date = fecha del TURNO (propia),
--    separada del validity real del documento. Mover/cancelar afecta solo esta fila.
CREATE TABLE IF NOT EXISTS "public"."vtv_appointments" (
  "id"                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id"            uuid NOT NULL REFERENCES "public"."company"("id") ON DELETE CASCADE,
  "vehicle_id"            uuid NOT NULL REFERENCES "public"."vehicles"("id") ON DELETE CASCADE,
  "document_equipment_id" uuid REFERENCES "public"."documents_equipment"("id") ON DELETE SET NULL,
  "appointment_date"      date NOT NULL,
  "status"                "public"."vtv_appointment_status" NOT NULL DEFAULT 'pendiente',
  "notes"                 text,
  "created_by"            text,
  "is_active"             boolean NOT NULL DEFAULT true,
  "created_at"            timestamptz NOT NULL DEFAULT now(),
  "updated_at"            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_vtv_appointments_company_id" ON "public"."vtv_appointments"("company_id");
CREATE INDEX IF NOT EXISTS "idx_vtv_appointments_vehicle_id" ON "public"."vtv_appointments"("vehicle_id");
CREATE INDEX IF NOT EXISTS "idx_vtv_appointments_doc_eq_id"  ON "public"."vtv_appointments"("document_equipment_id");
CREATE INDEX IF NOT EXISTS "idx_vtv_appointments_status"     ON "public"."vtv_appointments"("status");
CREATE INDEX IF NOT EXISTS "idx_vtv_appointments_date"       ON "public"."vtv_appointments"("appointment_date");

-- Un solo turno "activo" (pendiente u orden_solicitada) por documento de VTV.
-- Los históricos (realizada/cancelada) quedan libres → un turno por vencimiento anual.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_vtv_active_per_doc"
  ON "public"."vtv_appointments"("document_equipment_id")
  WHERE "status" IN ('pendiente', 'orden_solicitada') AND "is_active" = true;

-- 4. notification_type para la urgencia de VTV (in-app). Idempotente.
INSERT INTO "public"."notification_types"
  ("code", "title_template", "description_template", "category", "required_permission_code", "link_template", "is_active")
VALUES
  (
    'vtv.expiring_soon',
    'VTV por vencer',
    'Tenés {{count}} VTV que vence(n) en los próximos {{days}} días.',
    'vencimiento',
    'equipos.view',
    '/dashboard/vtv',
    true
  )
ON CONFLICT ("code") DO NOTHING;
