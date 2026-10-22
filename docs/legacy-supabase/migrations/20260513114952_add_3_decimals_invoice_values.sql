-- Ampliar precision de Decimal(12,2) a Decimal(12,3) en líneas de factura de compra
ALTER TABLE purchase_invoice_lines
  ALTER COLUMN unit_cost TYPE numeric(12,3),
  ALTER COLUMN vat_amount TYPE numeric(12,3),
  ALTER COLUMN subtotal TYPE numeric(12,3),
  ALTER COLUMN total TYPE numeric(12,3);

-- Ampliar precision en percepciones de factura
ALTER TABLE purchase_invoice_perceptions
  ALTER COLUMN base_amount TYPE numeric(15,3),
  ALTER COLUMN amount TYPE numeric(15,3);

-- Ampliar precision en líneas de orden de compra
ALTER TABLE purchase_order_lines
  ALTER COLUMN unit_cost TYPE numeric(12,3),
  ALTER COLUMN vat_amount TYPE numeric(12,3),
  ALTER COLUMN subtotal TYPE numeric(12,3),
  ALTER COLUMN total TYPE numeric(12,3);
