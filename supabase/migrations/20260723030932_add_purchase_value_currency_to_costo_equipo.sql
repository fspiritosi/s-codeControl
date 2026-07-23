-- Valor de compra del equipo en ARS/USD con snapshot del tipo de cambio (tsk-518).
-- valor_compra (existente) sigue guardando el valor en ARS.
-- moneda_compra: moneda en la que el usuario cargó el dato ('ARS' o 'USD'); el otro valor se calcula.
-- valor_compra_usd: valor equivalente en USD.
-- tipo_cambio_compra: tipo de cambio usado al momento de la carga (snapshot, no recalcula si cambia la cotización).
ALTER TABLE "costo_equipo"
  ADD COLUMN IF NOT EXISTS "moneda_compra"      text          NOT NULL DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS "valor_compra_usd"   numeric(15,2),
  ADD COLUMN IF NOT EXISTS "tipo_cambio_compra" numeric(15,4);
