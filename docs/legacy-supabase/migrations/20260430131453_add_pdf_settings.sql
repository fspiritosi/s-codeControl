-- Configuración de PDF por empresa: encabezado, pie de página y firma.

CREATE TABLE pdf_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL UNIQUE REFERENCES company(id) ON DELETE CASCADE,
  header_text         TEXT,
  footer_text         TEXT,
  signature_image_url TEXT,
  signed_pdf_keys     TEXT[] NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pdf_settings_company_id ON pdf_settings(company_id);
