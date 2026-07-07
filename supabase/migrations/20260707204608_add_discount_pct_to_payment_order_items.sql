-- Agrega el porcentaje de descuento aplicado por factura/gasto dentro de una orden de pago.
-- El descuento reduce el importe imputado (amount) de cada ítem; la factura queda con su
-- saldo pendiente (pago parcial). Columna aditiva, con default 0, segura para datos existentes.

ALTER TABLE public.payment_order_items
  ADD COLUMN IF NOT EXISTS discount_pct numeric(5, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.payment_order_items.discount_pct IS
  'Porcentaje de descuento aplicado sobre el importe base de la factura/gasto en esta OP (0-100). El amount ya refleja el neto con el descuento aplicado.';
