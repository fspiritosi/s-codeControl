-- Tablas auxiliares de cálculo (tsk-519):
--   exchange_rates: tipo de cambio por empresa (USD -> ARS por defecto), con fuente manual.
--   indices + index_values: catálogo de índices y su % de variación mensual.

-- Tipo de cambio por empresa
CREATE TABLE "exchange_rates" (
  "id"             uuid          NOT NULL DEFAULT gen_random_uuid(),
  "company_id"     uuid          NOT NULL,
  "moneda_origen"  text          NOT NULL DEFAULT 'USD',
  "moneda_destino" text          NOT NULL DEFAULT 'ARS',
  "valor"          numeric(15,4) NOT NULL,
  "fecha"          date          NOT NULL,
  "fuente"         text,
  "created_at"     timestamptz   NOT NULL DEFAULT now(),
  "updated_at"     timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exchange_rates_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "company"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX "exchange_rates_company_idx" ON "exchange_rates"("company_id");
CREATE INDEX "exchange_rates_company_pair_fecha_idx"
  ON "exchange_rates"("company_id", "moneda_origen", "moneda_destino", "fecha");

-- Catálogo de índices (solo nombres)
CREATE TABLE "indices" (
  "id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
  "company_id" uuid        NOT NULL,
  "nombre"     text        NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "indices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "indices_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "company"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "indices_company_nombre_key" UNIQUE ("company_id", "nombre")
);
CREATE INDEX "indices_company_idx" ON "indices"("company_id");

-- Valores mensuales de cada índice (% de variación por mes/año)
CREATE TABLE "index_values" (
  "id"         uuid         NOT NULL DEFAULT gen_random_uuid(),
  "indice_id"  uuid         NOT NULL,
  "mes"        integer      NOT NULL,
  "anio"       integer      NOT NULL,
  "variacion"  numeric(8,4) NOT NULL,
  "created_at" timestamptz  NOT NULL DEFAULT now(),
  "updated_at" timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT "index_values_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "index_values_indice_id_fkey"
    FOREIGN KEY ("indice_id") REFERENCES "indices"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "index_values_indice_anio_mes_key" UNIQUE ("indice_id", "anio", "mes")
);
CREATE INDEX "index_values_indice_idx" ON "index_values"("indice_id");
