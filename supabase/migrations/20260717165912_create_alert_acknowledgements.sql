-- tsk-436: Confirmación de lectura de alertas ("Revisada por X el DD/MM").
-- Migración aditiva (solo-ADD). No altera ni borra datos existentes.
--
-- Cada fila registra que un usuario marcó como revisada una alerta concreta del
-- panel de alertas críticas del dashboard. La alerta se identifica por una clave
-- estable (alert_key), p. ej. "doc_emp:{uuid}" o "doc_eq:{uuid}". Se conserva un
-- único ack por (company_id, alert_key): al volver a marcar se actualiza quién y
-- cuándo (upsert), manteniendo el último responsable.

CREATE TABLE IF NOT EXISTS "public"."alert_acknowledgements" (
  "id"          uuid NOT NULL DEFAULT gen_random_uuid(),
  "company_id"  uuid NOT NULL,
  "alert_key"   text NOT NULL,
  "alert_type"  text NOT NULL,
  "label"       text,
  "reviewed_by" uuid NOT NULL,
  "reviewed_at" timestamptz NOT NULL DEFAULT now(),
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "alert_acknowledgements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "alert_acknowledgements_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE CASCADE,
  CONSTRAINT "alert_acknowledgements_reviewed_by_fkey"
    FOREIGN KEY ("reviewed_by") REFERENCES "public"."profile"("id"),
  CONSTRAINT "alert_acknowledgements_company_alert_key_unique"
    UNIQUE ("company_id", "alert_key")
);

CREATE INDEX IF NOT EXISTS "alert_acknowledgements_company_id_idx"
  ON "public"."alert_acknowledgements" ("company_id");
