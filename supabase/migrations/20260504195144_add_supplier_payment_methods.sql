-- COD-456 — Métodos de pago en Proveedores
-- Migración aditiva: nuevo enum supplier_account_type + tabla supplier_payment_methods.
-- Reutiliza enums existentes: payment_method (CHECK, ACCOUNT) y supplier_status (ACTIVE, INACTIVE, BLOCKED).

-- CreateEnum
CREATE TYPE "supplier_account_type" AS ENUM ('CHECKING', 'SAVINGS');

-- CreateTable
CREATE TABLE "supplier_payment_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplier_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "type" "payment_method" NOT NULL,
    "bank_name" TEXT,
    "account_holder" TEXT,
    "account_holder_tax_id" TEXT,
    "account_type" "supplier_account_type",
    "cbu" VARCHAR(22),
    "alias" TEXT,
    "currency" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" "supplier_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "supplier_payment_methods_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "supplier_payment_methods_type_check" CHECK ("type" IN ('CHECK', 'ACCOUNT'))
);

-- CreateIndex
CREATE INDEX "supplier_payment_methods_supplier_id_idx" ON "supplier_payment_methods"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_payment_methods_company_id_supplier_id_idx" ON "supplier_payment_methods"("company_id", "supplier_id");

-- CreateIndex (partial unique: only one active CHECK per supplier)
CREATE UNIQUE INDEX "supplier_payment_methods_unique_active_check"
    ON "supplier_payment_methods"("supplier_id")
    WHERE "type" = 'CHECK' AND "status" = 'ACTIVE';

-- CreateIndex (partial unique: only one active default per supplier)
CREATE UNIQUE INDEX "supplier_payment_methods_unique_active_default"
    ON "supplier_payment_methods"("supplier_id")
    WHERE "is_default" = true AND "status" = 'ACTIVE';

-- AddForeignKey
ALTER TABLE "supplier_payment_methods"
    ADD CONSTRAINT "supplier_payment_methods_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payment_methods"
    ADD CONSTRAINT "supplier_payment_methods_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "company"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- created_by / updated_by quedan como UUID NULL sin FK explícita,
-- alineado con el patrón del resto del proyecto (bank_accounts, cash_registers, etc.).
