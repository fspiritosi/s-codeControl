-- Enum para tipo de descuento
CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FIXED');

-- Campos de descuento en líneas de factura
ALTER TABLE purchase_invoice_lines
  ADD COLUMN discount_type discount_type,
  ADD COLUMN discount_value numeric(12,3),
  ADD COLUMN discount_amount numeric(12,3) NOT NULL DEFAULT 0;

-- Campos de descuento en cabecera de factura
ALTER TABLE purchase_invoices
  ADD COLUMN global_discount_type discount_type,
  ADD COLUMN global_discount_value numeric(12,2),
  ADD COLUMN discount_amount numeric(12,2) NOT NULL DEFAULT 0;
