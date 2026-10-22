-- Tabla de grupos de empresas. Las empresas en el mismo grupo comparten almacenes,
-- productos y stock (lectura). Cada empresa puede pertenecer a un solo grupo o a ninguno.

CREATE TABLE company_groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE company
  ADD COLUMN company_group_id UUID NULL REFERENCES company_groups(id) ON DELETE SET NULL;

CREATE INDEX idx_company_company_group_id ON company(company_group_id);
