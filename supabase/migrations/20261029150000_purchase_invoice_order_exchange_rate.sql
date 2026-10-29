-- Tipo de cambio aplicado al facturar una OC en otra moneda.
--
-- Caso típico: la OC salió en dólares y el proveedor factura en pesos al tipo de
-- cambio de la fecha de la factura. Las líneas de la OC se convierten a pesos con
-- ese TC, y con el mismo TC la factura descuenta el saldo de la OC en dólares.
--
-- No se reusa purchase_invoices.exchange_rate: en una factura en pesos vale 1, y
-- hay pantallas que multiplican total × exchange_rate sin mirar la moneda.
--
-- Nullable y ADD-only: las facturas existentes quedan sin este dato y el saldo de
-- la OC las sigue convirtiendo con el TC de referencia de la OC.

ALTER TABLE "purchase_invoices"
  ADD COLUMN IF NOT EXISTS "order_exchange_rate" numeric(15,4);
