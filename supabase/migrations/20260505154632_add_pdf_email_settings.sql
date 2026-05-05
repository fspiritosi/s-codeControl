-- ================================================================
-- COD-574 — Email "from" configurable por tipo de PDF
-- ================================================================
-- Permite que cada empresa configure un email "from" distinto por
-- cada tipo de PDF que se envía. Si no hay override, el sender
-- usa company.contact_email.
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "pdf_email_settings" (
  "company_id" uuid NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "pdf_key"    text NOT NULL,
  "from_email" text NOT NULL,
  "from_name"  text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("company_id", "pdf_key")
);

CREATE INDEX IF NOT EXISTS "pdf_email_settings_company_idx"
  ON "pdf_email_settings" ("company_id");

COMMIT;
