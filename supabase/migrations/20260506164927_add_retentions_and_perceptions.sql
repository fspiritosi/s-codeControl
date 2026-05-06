-- ================================================================
-- RETENCIONES Y PERCEPCIONES (Fase 1 — schema)
-- ================================================================
-- Modelo de datos:
--
-- tax_types: catálogo configurable por empresa de tipos de impuesto
--   (RETENTION o PERCEPTION). Define alícuota default, base de cálculo
--   y mínimo no imponible. Ejemplos:
--     - RET_GANANCIAS, RET_IVA, RET_IIBB_NEU, RET_SUSS
--     - PERC_IVA, PERC_IIBB_NEU
--
-- purchase_invoice_perceptions: líneas de percepciones cargadas en
--   cada factura de compra (lo que el proveedor cobra).
--
-- payment_order_retentions: líneas de retenciones aplicadas al pagar
--   (lo que el comprador retiene). Guardan certificate_number para el
--   comprobante.
--
-- retention_certificate_sequences: numeración secuencial de
--   comprobantes por (company, tax_type) para emitir certificados.
--
-- payment_orders gana retentions_total y net_to_pay (derivados pero
--   persistidos para queries simples y cuadre).
-- ================================================================

BEGIN;

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "tax_kind" AS ENUM ('RETENTION', 'PERCEPTION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "tax_scope" AS ENUM ('NATIONAL', 'PROVINCIAL', 'MUNICIPAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "tax_calculation_base" AS ENUM ('NET', 'TOTAL', 'VAT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- CATÁLOGO: TAX_TYPES
-- ============================================================
-- code: identificador estable por empresa (ej. 'RET_IIBB_NEU').
-- jurisdiction: provincia/municipio cuando aplica (NULL para nacionales).
-- default_rate: alícuota % a aplicar por defecto (editable en cada uso).
-- min_taxable_amount: NULL = sin mínimo. Si se setea, no se retiene/percibe
--   cuando la base está por debajo (la app valida; la DB solo guarda).
-- calculation_base: sobre qué se calcula (neto, total, IVA).

CREATE TABLE IF NOT EXISTS "tax_types" (
  "id"                 uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "company_id"         uuid NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "code"               text NOT NULL,
  "name"               text NOT NULL,
  "kind"               "tax_kind" NOT NULL,
  "scope"              "tax_scope" NOT NULL DEFAULT 'NATIONAL',
  "jurisdiction"       text,
  "calculation_base"   "tax_calculation_base" NOT NULL DEFAULT 'NET',
  "default_rate"       numeric(8, 4) NOT NULL DEFAULT 0,
  "min_taxable_amount" numeric(15, 2),
  "is_active"          boolean NOT NULL DEFAULT true,
  "notes"              text,
  "created_at"         timestamptz NOT NULL DEFAULT now(),
  "updated_at"         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "tax_types_company_code_unique" UNIQUE ("company_id", "code")
);

CREATE INDEX IF NOT EXISTS "tax_types_company_kind_idx"
  ON "tax_types" ("company_id", "kind") WHERE "is_active" = true;

-- ============================================================
-- PERCEPCIONES EN FACTURAS DE COMPRA
-- ============================================================
-- Línea por percepción aplicada en una factura recibida. El total de
-- la factura debe igualar subtotal + vat_amount + sum(perceptions.amount).
-- Se cachea el agregado en purchase_invoices.other_taxes.

CREATE TABLE IF NOT EXISTS "purchase_invoice_perceptions" (
  "id"          uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "invoice_id"  uuid NOT NULL REFERENCES "purchase_invoices"("id") ON DELETE CASCADE,
  "tax_type_id" uuid NOT NULL REFERENCES "tax_types"("id") ON DELETE RESTRICT,
  "base_amount" numeric(15, 2) NOT NULL,
  "rate"        numeric(8, 4) NOT NULL,
  "amount"      numeric(15, 2) NOT NULL,
  "notes"       text,
  "created_at"  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "purchase_invoice_perceptions_invoice_idx"
  ON "purchase_invoice_perceptions" ("invoice_id");
CREATE INDEX IF NOT EXISTS "purchase_invoice_perceptions_tax_type_idx"
  ON "purchase_invoice_perceptions" ("tax_type_id");

-- ============================================================
-- RETENCIONES EN ÓRDENES DE PAGO
-- ============================================================
-- Línea por retención aplicada al pagar. certificate_number se asigna
-- al confirmar la OP (Fase 5) usando retention_certificate_sequences.

CREATE TABLE IF NOT EXISTS "payment_order_retentions" (
  "id"                 uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "payment_order_id"   uuid NOT NULL REFERENCES "payment_orders"("id") ON DELETE CASCADE,
  "tax_type_id"        uuid NOT NULL REFERENCES "tax_types"("id") ON DELETE RESTRICT,
  "base_amount"        numeric(15, 2) NOT NULL,
  "rate"               numeric(8, 4) NOT NULL,
  "amount"             numeric(15, 2) NOT NULL,
  "certificate_number" text,
  "certificate_url"    text,
  "notes"              text,
  "created_at"         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "payment_order_retentions_order_idx"
  ON "payment_order_retentions" ("payment_order_id");
CREATE INDEX IF NOT EXISTS "payment_order_retentions_tax_type_idx"
  ON "payment_order_retentions" ("tax_type_id");

-- ============================================================
-- NUMERACIÓN DE COMPROBANTES DE RETENCIÓN
-- ============================================================
-- Una secuencia por (company, tax_type). Al confirmar la OP se hace
-- UPDATE ... RETURNING last_number + 1 para evitar race conditions.

CREATE TABLE IF NOT EXISTS "retention_certificate_sequences" (
  "company_id"  uuid NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "tax_type_id" uuid NOT NULL REFERENCES "tax_types"("id") ON DELETE CASCADE,
  "last_number" integer NOT NULL DEFAULT 0,
  "updated_at"  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("company_id", "tax_type_id")
);

-- ============================================================
-- EXTENSIÓN DE payment_orders
-- ============================================================
-- retentions_total: suma de payment_order_retentions.amount (cache).
-- net_to_pay: total_amount - retentions_total (lo que sale efectivamente
--   de caja/banco al proveedor). Se recalcula al guardar.
-- La cuenta corriente del proveedor sigue cancelándose por total_amount.

ALTER TABLE "payment_orders"
  ADD COLUMN IF NOT EXISTS "retentions_total" numeric(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "net_to_pay"       numeric(15, 2);

-- Backfill: las OPs existentes no tienen retenciones, net_to_pay = total_amount.
UPDATE "payment_orders"
SET "net_to_pay" = "total_amount"
WHERE "net_to_pay" IS NULL;

COMMIT;
