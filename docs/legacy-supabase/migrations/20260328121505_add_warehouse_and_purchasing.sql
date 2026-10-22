-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "product_type" AS ENUM ('PRODUCT', 'SERVICE', 'RAW_MATERIAL', 'CONSUMABLE');

-- CreateEnum
CREATE TYPE "supplier_tax_condition" AS ENUM ('RESPONSABLE_INSCRIPTO', 'MONOTRIBUTISTA', 'EXENTO', 'NO_RESPONSABLE', 'CONSUMIDOR_FINAL');

-- CreateEnum
CREATE TYPE "supplier_status" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "warehouse_type" AS ENUM ('MAIN', 'BRANCH', 'TRANSIT', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "stock_movement_type" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'TRANSFER_OUT', 'TRANSFER_IN', 'RETURN', 'PRODUCTION', 'LOSS');

-- CreateEnum
CREATE TYPE "voucher_type" AS ENUM ('FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'NOTA_CREDITO_A', 'NOTA_CREDITO_B', 'NOTA_CREDITO_C', 'NOTA_DEBITO_A', 'NOTA_DEBITO_B', 'NOTA_DEBITO_C', 'RECIBO');

-- CreateEnum
CREATE TYPE "purchase_order_status" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "purchase_order_invoicing_status" AS ENUM ('NOT_INVOICED', 'PARTIALLY_INVOICED', 'FULLY_INVOICED');

-- CreateEnum
CREATE TYPE "purchase_order_installment_status" AS ENUM ('PENDING', 'INVOICED', 'PAID');

-- CreateEnum
CREATE TYPE "purchase_invoice_status" AS ENUM ('DRAFT', 'CONFIRMED', 'PAID', 'PARTIAL_PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "receiving_note_status" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "product_type" NOT NULL DEFAULT 'PRODUCT',
    "unit_of_measure" TEXT NOT NULL DEFAULT 'UN',
    "cost_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sale_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat_rate" DECIMAL(5,2) NOT NULL DEFAULT 21,
    "track_stock" BOOLEAN NOT NULL DEFAULT true,
    "min_stock" DECIMAL(12,3) DEFAULT 0,
    "max_stock" DECIMAL(12,3),
    "barcode" TEXT,
    "brand" TEXT,
    "status" "product_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "tax_id" TEXT NOT NULL,
    "tax_condition" "supplier_tax_condition" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "zip_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Argentina',
    "payment_term_days" INTEGER NOT NULL DEFAULT 0,
    "credit_limit" DECIMAL(12,2),
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "status" "supplier_status" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "warehouse_type" NOT NULL DEFAULT 'MAIN',
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_stocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "warehouse_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "reserved_qty" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "available_qty" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "type" "stock_movement_type" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "reference_type" TEXT,
    "reference_id" UUID,
    "notes" TEXT,
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "full_number" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "expected_delivery_date" DATE,
    "payment_conditions" TEXT,
    "delivery_address" TEXT,
    "delivery_notes" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "purchase_order_status" NOT NULL DEFAULT 'DRAFT',
    "invoicing_status" "purchase_order_invoicing_status" NOT NULL DEFAULT 'NOT_INVOICED',
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit_cost" DECIMAL(12,2) NOT NULL,
    "vat_rate" DECIMAL(5,2) NOT NULL,
    "vat_amount" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "received_qty" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "invoiced_qty" DECIMAL(12,3) NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_installments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "purchase_order_installment_status" NOT NULL DEFAULT 'PENDING',
    "purchase_invoice_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "voucher_type" "voucher_type" NOT NULL,
    "point_of_sale" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "full_number" TEXT NOT NULL,
    "issue_date" TIMESTAMPTZ NOT NULL,
    "due_date" TIMESTAMPTZ,
    "cae" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "other_taxes" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "purchase_invoice_status" NOT NULL DEFAULT 'DRAFT',
    "document_url" TEXT,
    "document_key" TEXT,
    "original_invoice_id" UUID,
    "purchase_order_id" UUID,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_invoice_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_id" UUID NOT NULL,
    "product_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit_cost" DECIMAL(12,2) NOT NULL,
    "vat_rate" DECIMAL(5,2) NOT NULL,
    "vat_amount" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "purchase_order_line_id" UUID,

    CONSTRAINT "purchase_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receiving_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "full_number" TEXT NOT NULL,
    "purchase_order_id" UUID,
    "purchase_invoice_id" UUID,
    "reception_date" DATE NOT NULL,
    "notes" TEXT,
    "status" "receiving_note_status" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receiving_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receiving_note_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "receiving_note_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "purchase_order_line_id" UUID,
    "notes" TEXT,

    CONSTRAINT "receiving_note_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "products_company_id_code_key" ON "products"("company_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_company_id_code_key" ON "suppliers"("company_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_company_id_tax_id_key" ON "suppliers"("company_id", "tax_id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_company_id_code_key" ON "warehouses"("company_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_stocks_warehouse_id_product_id_key" ON "warehouse_stocks"("warehouse_id", "product_id");

-- CreateIndex
CREATE INDEX "purchase_orders_company_id_status_idx" ON "purchase_orders"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_company_id_number_key" ON "purchase_orders"("company_id", "number");

-- CreateIndex
CREATE INDEX "purchase_order_installments_company_id_order_id_idx" ON "purchase_order_installments"("company_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_installments_order_id_number_key" ON "purchase_order_installments"("order_id", "number");

-- CreateIndex
CREATE INDEX "purchase_invoices_purchase_order_id_idx" ON "purchase_invoices"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_invoices_company_id_supplier_id_full_number_key" ON "purchase_invoices"("company_id", "supplier_id", "full_number");

-- CreateIndex
CREATE INDEX "receiving_notes_company_id_status_idx" ON "receiving_notes"("company_id", "status");

-- CreateIndex
CREATE INDEX "receiving_notes_purchase_order_id_idx" ON "receiving_notes"("purchase_order_id");

-- CreateIndex
CREATE INDEX "receiving_notes_purchase_invoice_id_idx" ON "receiving_notes"("purchase_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "receiving_notes_company_id_number_key" ON "receiving_notes"("company_id", "number");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stocks" ADD CONSTRAINT "warehouse_stocks_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stocks" ADD CONSTRAINT "warehouse_stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_installments" ADD CONSTRAINT "purchase_order_installments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_installments" ADD CONSTRAINT "purchase_order_installments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_installments" ADD CONSTRAINT "purchase_order_installments_purchase_invoice_id_fkey" FOREIGN KEY ("purchase_invoice_id") REFERENCES "purchase_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_original_invoice_id_fkey" FOREIGN KEY ("original_invoice_id") REFERENCES "purchase_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoice_lines" ADD CONSTRAINT "purchase_invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "purchase_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoice_lines" ADD CONSTRAINT "purchase_invoice_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoice_lines" ADD CONSTRAINT "purchase_invoice_lines_purchase_order_line_id_fkey" FOREIGN KEY ("purchase_order_line_id") REFERENCES "purchase_order_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiving_notes" ADD CONSTRAINT "receiving_notes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiving_notes" ADD CONSTRAINT "receiving_notes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiving_notes" ADD CONSTRAINT "receiving_notes_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiving_notes" ADD CONSTRAINT "receiving_notes_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiving_notes" ADD CONSTRAINT "receiving_notes_purchase_invoice_id_fkey" FOREIGN KEY ("purchase_invoice_id") REFERENCES "purchase_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiving_note_lines" ADD CONSTRAINT "receiving_note_lines_receiving_note_id_fkey" FOREIGN KEY ("receiving_note_id") REFERENCES "receiving_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiving_note_lines" ADD CONSTRAINT "receiving_note_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiving_note_lines" ADD CONSTRAINT "receiving_note_lines_purchase_order_line_id_fkey" FOREIGN KEY ("purchase_order_line_id") REFERENCES "purchase_order_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
