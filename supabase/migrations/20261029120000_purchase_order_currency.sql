-- Órdenes de compra en dólares.
--
-- Hasta ahora la OC no tenía moneda: todos los importes se asumían en pesos. La
-- OC pasa a tener moneda propia y, si es extranjera, el tipo de cambio de
-- referencia con el que se emitió (snapshot: no se recalcula si la cotización
-- cambia después). Las sumas que mezclan órdenes (dashboard, cuenta corriente,
-- límite de crédito) convierten a pesos con ese tipo de cambio.
--
-- Migración ADD-only y retrocompatible: los defaults ('ARS', tipo de cambio 1)
-- reproducen exactamente el comportamiento actual sobre los datos existentes.

ALTER TABLE "purchase_orders"
  ADD COLUMN IF NOT EXISTS "currency"      text          NOT NULL DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS "exchange_rate" numeric(15,4) NOT NULL DEFAULT 1;
