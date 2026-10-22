-- Agrega moneda y tipo de cambio a las facturas de compra.
-- La factura guarda sus montos en la moneda original (currency) y el
-- exchange_rate (ARS por unidad de la moneda). Para ARS el tipo de cambio es 1.
-- Migración aditiva: columnas con default, no rompe filas existentes.

ALTER TABLE public.purchase_invoices
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(12, 4) NOT NULL DEFAULT 1;
