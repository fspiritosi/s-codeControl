-- Vincular cada línea de factura de venta con el item de servicio del cliente (tsk-479)
ALTER TABLE "sales_invoice_lines" ADD COLUMN IF NOT EXISTS "service_item_id" uuid;
ALTER TABLE "sales_invoice_lines"
  ADD CONSTRAINT "sales_invoice_lines_service_item_id_fkey"
  FOREIGN KEY ("service_item_id") REFERENCES "service_items"("id") ON UPDATE CASCADE ON DELETE SET NULL;
CREATE INDEX "sales_invoice_lines_service_item_idx" ON "sales_invoice_lines"("service_item_id");
