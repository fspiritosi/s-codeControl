-- Add WITHDRAWAL to stock_movement_type enum
ALTER TYPE "stock_movement_type" ADD VALUE IF NOT EXISTS 'WITHDRAWAL';

-- Create withdrawal_order_status enum
CREATE TYPE "withdrawal_order_status" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED', 'CANCELLED');

-- Create withdrawal_orders table
CREATE TABLE "withdrawal_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "full_number" TEXT NOT NULL,
    "request_date" DATE NOT NULL,
    "notes" TEXT,
    "status" "withdrawal_order_status" NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "employee_id" UUID,
    "vehicle_id" UUID,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "withdrawal_orders_pkey" PRIMARY KEY ("id")
);

-- Create withdrawal_order_lines table
CREATE TABLE "withdrawal_order_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "notes" TEXT,
    CONSTRAINT "withdrawal_order_lines_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "withdrawal_orders_company_id_status_idx" ON "withdrawal_orders"("company_id", "status");
CREATE UNIQUE INDEX "withdrawal_orders_company_id_number_key" ON "withdrawal_orders"("company_id", "number");

-- Foreign Keys
ALTER TABLE "withdrawal_orders" ADD CONSTRAINT "withdrawal_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawal_orders" ADD CONSTRAINT "withdrawal_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawal_orders" ADD CONSTRAINT "withdrawal_orders_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "withdrawal_orders" ADD CONSTRAINT "withdrawal_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "withdrawal_order_lines" ADD CONSTRAINT "withdrawal_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "withdrawal_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "withdrawal_order_lines" ADD CONSTRAINT "withdrawal_order_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
