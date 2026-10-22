-- ================================================================
-- MÓDULO DE TESORERÍA (Fase 1 + Payment Orders)
-- ================================================================
-- Migra desde baxer-n/src/modules/commercial/features/treasury/.
--
-- Alcance: 7 sub-features (cash-registers, sessions, cash-movements,
-- bank-accounts, bank-movements, checks, payment-orders).
--
-- Omite intencionalmente:
--   - FKs a Account/JournalEntry (no existe plan de cuentas todavía)
--   - FKs a sales_invoices/expenses (no existen todavía)
--   - Tablas de receipts/withholdings/cashflow-projections (Fase 2)
-- ================================================================

BEGIN;

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "cash_register_status" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "session_status" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "cash_movement_type" AS ENUM ('OPENING', 'CLOSING', 'INCOME', 'EXPENSE', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "bank_account_type" AS ENUM ('CHECKING', 'SAVINGS', 'CREDIT', 'CASH', 'VIRTUAL_WALLET');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "bank_account_status" AS ENUM ('ACTIVE', 'INACTIVE', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "bank_movement_type" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'CHECK', 'DEBIT', 'FEE', 'INTEREST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "payment_method" AS ENUM ('CASH', 'CHECK', 'TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'ACCOUNT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "payment_order_status" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "check_type" AS ENUM ('OWN', 'THIRD_PARTY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "check_status" AS ENUM ('PORTFOLIO', 'DEPOSITED', 'CLEARED', 'REJECTED', 'ENDORSED', 'DELIVERED', 'CASHED', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- CASH REGISTERS (cajas físicas)
-- ============================================================

CREATE TABLE IF NOT EXISTS "cash_registers" (
  "id"         uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "company_id" uuid NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "code"       text NOT NULL,
  "name"       text NOT NULL,
  "location"   text,
  "status"     "cash_register_status" NOT NULL DEFAULT 'ACTIVE',
  "is_default" boolean NOT NULL DEFAULT false,
  "created_by" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "cash_registers_company_code_unique" UNIQUE ("company_id", "code")
);

CREATE INDEX IF NOT EXISTS "cash_registers_company_status_idx" ON "cash_registers" ("company_id", "status");

-- ============================================================
-- CASH REGISTER SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS "cash_register_sessions" (
  "id"                uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "cash_register_id"  uuid NOT NULL REFERENCES "cash_registers"("id") ON DELETE CASCADE,
  "company_id"        uuid NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "session_number"    integer NOT NULL,
  "status"            "session_status" NOT NULL DEFAULT 'OPEN',
  "opening_balance"   decimal(15,2) NOT NULL DEFAULT 0,
  "expected_balance"  decimal(15,2) NOT NULL DEFAULT 0,
  "actual_balance"    decimal(15,2),
  "difference"        decimal(15,2),
  "opening_notes"     text,
  "closing_notes"     text,
  "opened_by"         text NOT NULL,
  "closed_by"         text,
  "opened_at"         timestamptz NOT NULL DEFAULT now(),
  "closed_at"         timestamptz,
  "created_at"        timestamptz NOT NULL DEFAULT now(),
  "updated_at"        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "cash_register_sessions_register_number_unique" UNIQUE ("cash_register_id", "session_number")
);

CREATE INDEX IF NOT EXISTS "cash_register_sessions_company_status_idx" ON "cash_register_sessions" ("company_id", "status");
CREATE INDEX IF NOT EXISTS "cash_register_sessions_register_status_idx" ON "cash_register_sessions" ("cash_register_id", "status");

-- ============================================================
-- CASH MOVEMENTS (movimientos dentro de una sesión)
-- ============================================================

CREATE TABLE IF NOT EXISTS "cash_movements" (
  "id"                  uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "session_id"          uuid NOT NULL REFERENCES "cash_register_sessions"("id") ON DELETE CASCADE,
  "cash_register_id"    uuid NOT NULL REFERENCES "cash_registers"("id") ON DELETE CASCADE,
  "company_id"          uuid NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "type"                "cash_movement_type" NOT NULL,
  "amount"              decimal(15,2) NOT NULL,
  "date"                timestamptz NOT NULL DEFAULT now(),
  "description"         text NOT NULL,
  "reference"           text,
  "purchase_invoice_id" uuid REFERENCES "purchase_invoices"("id") ON DELETE SET NULL,
  "created_by"          text NOT NULL,
  "created_at"          timestamptz NOT NULL DEFAULT now(),
  "updated_at"          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "cash_movements_company_date_idx" ON "cash_movements" ("company_id", "date");
CREATE INDEX IF NOT EXISTS "cash_movements_session_type_idx" ON "cash_movements" ("session_id", "type");
CREATE INDEX IF NOT EXISTS "cash_movements_register_date_idx" ON "cash_movements" ("cash_register_id", "date");

-- ============================================================
-- BANK ACCOUNTS (cuentas bancarias)
-- ============================================================

CREATE TABLE IF NOT EXISTS "bank_accounts" (
  "id"             uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "company_id"     uuid NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "bank_name"      text NOT NULL,
  "account_number" text NOT NULL,
  "account_type"   "bank_account_type" NOT NULL,
  "cbu"            text,
  "alias"          text,
  "currency"       text NOT NULL DEFAULT 'ARS',
  "balance"        decimal(15,2) NOT NULL DEFAULT 0,
  "status"         "bank_account_status" NOT NULL DEFAULT 'ACTIVE',
  "created_by"     text,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "bank_accounts_company_account_number_unique" UNIQUE ("company_id", "account_number")
);

CREATE INDEX IF NOT EXISTS "bank_accounts_company_status_idx" ON "bank_accounts" ("company_id", "status");

-- ============================================================
-- BANK MOVEMENTS (movimientos bancarios)
-- ============================================================

CREATE TABLE IF NOT EXISTS "bank_movements" (
  "id"               uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "bank_account_id"  uuid NOT NULL REFERENCES "bank_accounts"("id") ON DELETE CASCADE,
  "company_id"       uuid NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "type"             "bank_movement_type" NOT NULL,
  "amount"           decimal(15,2) NOT NULL,
  "date"             timestamptz NOT NULL,
  "description"      text NOT NULL,
  "reference"        text,
  "statement_number" text,
  "reference_type"   text,
  "reference_id"     uuid,
  "payment_order_id" uuid,  -- FK agregada más abajo (circular con payment_orders)
  "reconciled"       boolean NOT NULL DEFAULT false,
  "reconciled_at"    timestamptz,
  "reconciled_by"    text,
  "created_by"       text NOT NULL,
  "created_at"       timestamptz NOT NULL DEFAULT now(),
  "updated_at"       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "bank_movements_company_date_idx" ON "bank_movements" ("company_id", "date");
CREATE INDEX IF NOT EXISTS "bank_movements_account_date_idx" ON "bank_movements" ("bank_account_id", "date");
CREATE INDEX IF NOT EXISTS "bank_movements_reconciled_idx" ON "bank_movements" ("reconciled");

-- ============================================================
-- PAYMENT ORDERS (órdenes de pago a proveedores)
-- ============================================================

CREATE TABLE IF NOT EXISTS "payment_orders" (
  "id"           uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "company_id"   uuid NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "supplier_id"  uuid REFERENCES "suppliers"("id"),
  "number"       integer NOT NULL,
  "full_number"  text NOT NULL,
  "date"         timestamptz NOT NULL,
  "total_amount" decimal(15,2) NOT NULL,
  "notes"        text,
  "status"       "payment_order_status" NOT NULL DEFAULT 'DRAFT',
  "document_url" text,
  "document_key" text,
  "created_by"   text NOT NULL,
  "confirmed_by" text,
  "confirmed_at" timestamptz,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "updated_at"   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "payment_orders_company_number_unique" UNIQUE ("company_id", "number")
);

CREATE INDEX IF NOT EXISTS "payment_orders_company_status_idx" ON "payment_orders" ("company_id", "status");
CREATE INDEX IF NOT EXISTS "payment_orders_supplier_status_idx" ON "payment_orders" ("supplier_id", "status");

-- FK circular: bank_movements.payment_order_id -> payment_orders.id
ALTER TABLE "bank_movements"
  ADD CONSTRAINT "bank_movements_payment_order_id_fkey"
  FOREIGN KEY ("payment_order_id") REFERENCES "payment_orders"("id") ON DELETE SET NULL;

-- ============================================================
-- PAYMENT ORDER ITEMS (línea vinculada a factura de compra)
-- ============================================================

CREATE TABLE IF NOT EXISTS "payment_order_items" (
  "id"                uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "payment_order_id"  uuid NOT NULL REFERENCES "payment_orders"("id") ON DELETE CASCADE,
  "invoice_id"        uuid REFERENCES "purchase_invoices"("id") ON DELETE SET NULL,
  "amount"            decimal(15,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS "payment_order_items_order_idx" ON "payment_order_items" ("payment_order_id");
CREATE INDEX IF NOT EXISTS "payment_order_items_invoice_idx" ON "payment_order_items" ("invoice_id");

-- ============================================================
-- PAYMENT ORDER PAYMENTS (método de pago)
-- ============================================================

CREATE TABLE IF NOT EXISTS "payment_order_payments" (
  "id"                uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "payment_order_id"  uuid NOT NULL REFERENCES "payment_orders"("id") ON DELETE CASCADE,
  "payment_method"    "payment_method" NOT NULL,
  "amount"            decimal(15,2) NOT NULL,
  "cash_register_id"  uuid REFERENCES "cash_registers"("id") ON DELETE SET NULL,
  "bank_account_id"   uuid REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
  "check_number"      text,
  "card_last4"        text,
  "reference"         text
);

CREATE INDEX IF NOT EXISTS "payment_order_payments_order_idx" ON "payment_order_payments" ("payment_order_id");

-- ============================================================
-- CHECKS (cheques propios y de terceros)
-- ============================================================

CREATE TABLE IF NOT EXISTS "checks" (
  "id"                       uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "company_id"               uuid NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
  "type"                     "check_type" NOT NULL,
  "status"                   "check_status" NOT NULL DEFAULT 'PORTFOLIO',
  "check_number"             text NOT NULL,
  "bank_name"                text NOT NULL,
  "branch"                   text,
  "account_number"           text,
  "amount"                   decimal(15,2) NOT NULL,
  "issue_date"               timestamptz NOT NULL,
  "due_date"                 timestamptz NOT NULL,
  "drawer_name"              text NOT NULL,
  "drawer_tax_id"            text,
  "payee_name"               text,
  "customer_id"              uuid REFERENCES "customers"("id"),
  "supplier_id"              uuid REFERENCES "suppliers"("id"),
  "payment_order_payment_id" uuid UNIQUE REFERENCES "payment_order_payments"("id") ON DELETE SET NULL,
  "bank_account_id"          uuid REFERENCES "bank_accounts"("id"),
  "bank_movement_id"         uuid UNIQUE REFERENCES "bank_movements"("id") ON DELETE SET NULL,
  "endorsed_to_name"         text,
  "endorsed_to_tax_id"       text,
  "endorsed_at"              timestamptz,
  "rejected_at"              timestamptz,
  "rejection_reason"         text,
  "deposited_at"             timestamptz,
  "cleared_at"               timestamptz,
  "notes"                    text,
  "created_by"               text NOT NULL,
  "created_at"               timestamptz NOT NULL DEFAULT now(),
  "updated_at"               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "checks_company_type_status_idx" ON "checks" ("company_id", "type", "status");
CREATE INDEX IF NOT EXISTS "checks_company_due_date_idx" ON "checks" ("company_id", "due_date");

COMMIT;
