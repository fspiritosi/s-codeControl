-- CreateEnum
CREATE TYPE "public"."purchase_invoice_receiving_status" AS ENUM ('NOT_RECEIVED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED');

-- AlterTable: purchase_invoices
ALTER TABLE "public"."purchase_invoices" ADD COLUMN "receiving_status" "public"."purchase_invoice_receiving_status" NOT NULL DEFAULT 'NOT_RECEIVED';

-- AlterTable: purchase_invoice_lines
ALTER TABLE "public"."purchase_invoice_lines" ADD COLUMN "received_qty" DECIMAL(12,3) NOT NULL DEFAULT 0;

-- AlterTable: receiving_note_lines
ALTER TABLE "public"."receiving_note_lines" ADD COLUMN "purchase_invoice_line_id" UUID;

-- AddForeignKey
ALTER TABLE "public"."receiving_note_lines" ADD CONSTRAINT "receiving_note_lines_purchase_invoice_line_id_fkey" FOREIGN KEY ("purchase_invoice_line_id") REFERENCES "public"."purchase_invoice_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "receiving_note_lines_purchase_invoice_line_id_idx" ON "public"."receiving_note_lines"("purchase_invoice_line_id");
