-- Módulo de Ventas: facturas de venta + recibos de cobro (tsk-479)
-- Migración ADD-only: crea tipos, tablas, columnas fiscales en customers y permisos ventas.*
-- Los recibos NO impactan en tesorería (sin FK a cash_registers/bank_accounts).

-- ============================================================
-- 1) ENUMS
-- ============================================================
CREATE TYPE "customer_tax_condition" AS ENUM ('RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'EXENTO', 'CONSUMIDOR_FINAL', 'NO_RESPONSABLE');
CREATE TYPE "sales_invoice_status" AS ENUM ('DRAFT', 'CONFIRMED', 'PARTIAL_PAID', 'PAID', 'CANCELLED');
CREATE TYPE "receipt_status" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');
CREATE TYPE "sales_payment_method" AS ENUM ('CASH', 'CHECK', 'ECHEQ', 'TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'OTHER');
CREATE TYPE "withholding_tax_type" AS ENUM ('IVA', 'GANANCIAS', 'IIBB', 'SUSS', 'OTHER');

-- ============================================================
-- 2) customers: datos fiscales para facturación
-- ============================================================
ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "tax_condition"   "customer_tax_condition",
  ADD COLUMN IF NOT EXISTS "document_type"   text DEFAULT 'CUIT',
  ADD COLUMN IF NOT EXISTS "tax_id"          text,
  ADD COLUMN IF NOT EXISTS "fiscal_address"  text,
  ADD COLUMN IF NOT EXISTS "fiscal_city"     text,
  ADD COLUMN IF NOT EXISTS "fiscal_province" text,
  ADD COLUMN IF NOT EXISTS "fiscal_zip_code" text;

-- ============================================================
-- 3) Puntos de venta + secuencias de numeración
-- ============================================================
CREATE TABLE "sales_points_of_sale" (
  "id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
  "company_id" uuid        NOT NULL,
  "number"     integer     NOT NULL,
  "name"       text        NOT NULL,
  "is_active"  boolean     NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "sales_points_of_sale_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sales_points_of_sale_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "sales_points_of_sale_company_id_number_key" ON "sales_points_of_sale"("company_id", "number");

CREATE TABLE "sales_number_sequences" (
  "id"               uuid         NOT NULL DEFAULT gen_random_uuid(),
  "point_of_sale_id" uuid         NOT NULL,
  "voucher_type"     "voucher_type" NOT NULL,
  "next_number"      integer      NOT NULL DEFAULT 1,
  "updated_at"       timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT "sales_number_sequences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sales_number_sequences_point_of_sale_id_fkey" FOREIGN KEY ("point_of_sale_id") REFERENCES "sales_points_of_sale"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX "sales_number_sequences_pos_voucher_key" ON "sales_number_sequences"("point_of_sale_id", "voucher_type");

-- ============================================================
-- 4) Facturas de venta
-- ============================================================
CREATE TABLE "sales_invoices" (
  "id"                    uuid           NOT NULL DEFAULT gen_random_uuid(),
  "company_id"            uuid           NOT NULL,
  "customer_id"           uuid           NOT NULL,
  "point_of_sale_id"      uuid,
  "voucher_type"          "voucher_type" NOT NULL,
  "number"                integer,
  "full_number"           text,
  "issue_date"            timestamptz    NOT NULL,
  "due_date"              timestamptz,
  "cae"                   text,
  "cae_expiry_date"       timestamptz,
  "currency"              text           NOT NULL DEFAULT 'ARS',
  "exchange_rate"         numeric(12,4)  NOT NULL DEFAULT 1,
  "subtotal"              numeric(12,2)  NOT NULL DEFAULT 0,
  "vat_amount"            numeric(12,2)  NOT NULL DEFAULT 0,
  "other_taxes"           numeric(12,2)  NOT NULL DEFAULT 0,
  "other_charges"         numeric(12,2)  NOT NULL DEFAULT 0,
  "discount_amount"       numeric(12,2)  NOT NULL DEFAULT 0,
  "total"                 numeric(12,2)  NOT NULL DEFAULT 0,
  "global_discount_type"  "discount_type",
  "global_discount_value" numeric(12,2),
  "notes"                 text,
  "status"                "sales_invoice_status" NOT NULL DEFAULT 'DRAFT',
  "document_url"          text,
  "document_key"          text,
  "original_invoice_id"   uuid,
  "created_by"            text,
  "confirmed_by"          text,
  "confirmed_at"          timestamptz,
  "created_at"            timestamptz    NOT NULL DEFAULT now(),
  "updated_at"            timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT "sales_invoices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sales_invoices_company_id_fkey"     FOREIGN KEY ("company_id")          REFERENCES "company"("id")              ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "sales_invoices_customer_id_fkey"    FOREIGN KEY ("customer_id")         REFERENCES "customers"("id")            ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "sales_invoices_point_of_sale_fkey"  FOREIGN KEY ("point_of_sale_id")    REFERENCES "sales_points_of_sale"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "sales_invoices_original_invoice_fkey" FOREIGN KEY ("original_invoice_id") REFERENCES "sales_invoices"("id")      ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE UNIQUE INDEX "sales_invoices_pos_voucher_number_key" ON "sales_invoices"("point_of_sale_id", "voucher_type", "number");
CREATE INDEX "sales_invoices_company_status_idx" ON "sales_invoices"("company_id", "status");
CREATE INDEX "sales_invoices_customer_idx" ON "sales_invoices"("customer_id");
CREATE INDEX "sales_invoices_original_invoice_idx" ON "sales_invoices"("original_invoice_id");

CREATE TABLE "sales_invoice_lines" (
  "id"              uuid          NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id"      uuid          NOT NULL,
  "product_id"      uuid,
  "description"     text          NOT NULL,
  "quantity"        numeric(12,3) NOT NULL,
  "unit_price"      numeric(12,3) NOT NULL,
  "vat_rate"        numeric(5,2)  NOT NULL,
  "vat_amount"      numeric(12,3) NOT NULL,
  "subtotal"        numeric(12,3) NOT NULL,
  "total"           numeric(12,3) NOT NULL,
  "discount_type"   "discount_type",
  "discount_value"  numeric(12,3),
  "discount_amount" numeric(12,3) NOT NULL DEFAULT 0,
  CONSTRAINT "sales_invoice_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sales_invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "sales_invoices"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "sales_invoice_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id")       ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX "sales_invoice_lines_invoice_idx" ON "sales_invoice_lines"("invoice_id");

CREATE TABLE "sales_invoice_perceptions" (
  "id"          uuid          NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id"  uuid          NOT NULL,
  "tax_type_id" uuid          NOT NULL,
  "base_amount" numeric(15,3) NOT NULL,
  "rate"        numeric(8,4)  NOT NULL,
  "amount"      numeric(15,3) NOT NULL,
  "notes"       text,
  "created_at"  timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT "sales_invoice_perceptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sales_invoice_perceptions_invoice_id_fkey"  FOREIGN KEY ("invoice_id")  REFERENCES "sales_invoices"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "sales_invoice_perceptions_tax_type_id_fkey" FOREIGN KEY ("tax_type_id") REFERENCES "tax_types"("id")      ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX "sales_invoice_perceptions_invoice_idx"  ON "sales_invoice_perceptions"("invoice_id");
CREATE INDEX "sales_invoice_perceptions_tax_type_idx" ON "sales_invoice_perceptions"("tax_type_id");

CREATE TABLE "sales_invoice_other_charges" (
  "id"          uuid          NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id"  uuid          NOT NULL,
  "description" text          NOT NULL,
  "amount"      numeric(12,3) NOT NULL,
  "created_at"  timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT "sales_invoice_other_charges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sales_invoice_other_charges_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "sales_invoices"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX "sales_invoice_other_charges_invoice_idx" ON "sales_invoice_other_charges"("invoice_id");

-- ============================================================
-- 5) Recibos de cobro (sin tesorería)
-- ============================================================
CREATE TABLE "receipts" (
  "id"           uuid           NOT NULL DEFAULT gen_random_uuid(),
  "company_id"   uuid           NOT NULL,
  "customer_id"  uuid           NOT NULL,
  "number"       integer        NOT NULL,
  "full_number"  text           NOT NULL,
  "date"         timestamptz    NOT NULL,
  "total_amount" numeric(15,2)  NOT NULL DEFAULT 0,
  "notes"        text,
  "status"       "receipt_status" NOT NULL DEFAULT 'DRAFT',
  "document_url" text,
  "document_key" text,
  "created_by"   text,
  "confirmed_by" text,
  "confirmed_at" timestamptz,
  "created_at"   timestamptz    NOT NULL DEFAULT now(),
  "updated_at"   timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT "receipts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "receipts_company_id_fkey"  FOREIGN KEY ("company_id")  REFERENCES "company"("id")   ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "receipts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "receipts_company_id_number_key" ON "receipts"("company_id", "number");
CREATE INDEX "receipts_company_status_idx" ON "receipts"("company_id", "status");
CREATE INDEX "receipts_customer_idx" ON "receipts"("customer_id");

CREATE TABLE "receipt_items" (
  "id"         uuid          NOT NULL DEFAULT gen_random_uuid(),
  "receipt_id" uuid          NOT NULL,
  "invoice_id" uuid          NOT NULL,
  "amount"     numeric(15,2) NOT NULL,
  CONSTRAINT "receipt_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "receipt_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id")       ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "receipt_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "sales_invoices"("id") ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX "receipt_items_receipt_idx" ON "receipt_items"("receipt_id");
CREATE INDEX "receipt_items_invoice_idx" ON "receipt_items"("invoice_id");

CREATE TABLE "receipt_payments" (
  "id"             uuid           NOT NULL DEFAULT gen_random_uuid(),
  "receipt_id"     uuid           NOT NULL,
  "payment_method" "sales_payment_method" NOT NULL,
  "amount"         numeric(15,2)  NOT NULL,
  "reference"      text,
  "check_number"   text,
  "check_bank"     text,
  "check_due_date" timestamptz,
  "notes"          text,
  "created_at"     timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT "receipt_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "receipt_payments_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX "receipt_payments_receipt_idx" ON "receipt_payments"("receipt_id");

CREATE TABLE "receipt_withholdings" (
  "id"                 uuid           NOT NULL DEFAULT gen_random_uuid(),
  "receipt_id"         uuid           NOT NULL,
  "tax_type"           "withholding_tax_type" NOT NULL,
  "rate"               numeric(8,4),
  "amount"             numeric(15,2)  NOT NULL,
  "certificate_number" text,
  "created_at"         timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT "receipt_withholdings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "receipt_withholdings_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX "receipt_withholdings_receipt_idx" ON "receipt_withholdings"("receipt_id");

-- ============================================================
-- 6) Permisos ventas.* + asignación a roles del sistema
-- ============================================================
INSERT INTO "permissions" ("code", "module", "action", "description", "is_system") VALUES
  ('ventas.view',    'ventas', 'view',    'Ver ventas, facturas y recibos',   true),
  ('ventas.create',  'ventas', 'create',  'Crear facturas y recibos de venta', true),
  ('ventas.update',  'ventas', 'update',  'Editar facturas y recibos de venta', true),
  ('ventas.delete',  'ventas', 'delete',  'Eliminar facturas y recibos de venta', true),
  ('ventas.confirm', 'ventas', 'confirm', 'Confirmar facturas y recibos de venta', true)
ON CONFLICT ("code") DO NOTHING;

-- Propietario, DEV, CodeControlClient y Admin: todos los permisos de ventas
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" IN ('Propietario', 'DEV', 'CodeControlClient', 'Admin')
  AND p."module" = 'ventas'
ON CONFLICT DO NOTHING;

-- Usuario: CRUD básico, sin confirm
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'Usuario'
  AND p."module" = 'ventas'
  AND p."action" NOT IN ('confirm')
ON CONFLICT DO NOTHING;

-- Auditor: solo view
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'Auditor'
  AND p."code" = 'ventas.view'
ON CONFLICT DO NOTHING;
