-- Órdenes de pago multimoneda (tsk-576).
--
-- Hasta ahora la OP no tenía moneda: sumaba los importes de los comprobantes tal
-- cual, así que una factura en USD se sumaba a una en ARS como si fueran la
-- misma unidad. La OP pasa a tener moneda propia — por defecto ARS, incluso
-- cuando la factura del proveedor está en dólares — y cada ítem guarda su
-- importe en las dos monedas.
--
-- Migración ADD-only y retrocompatible: los defaults ('ARS', tipo de cambio 1)
-- reproducen exactamente el comportamiento actual sobre los datos existentes.

-- ============================================================
-- 1) payment_orders: moneda de la orden
-- ============================================================
-- total_amount, retentions_total y net_to_pay quedan expresados en esta moneda.
-- exchange_rate es de referencia: el que efectivamente se aplicó a cada ítem se
-- guarda por ítem, porque cada comprobante puede tener el suyo.

ALTER TABLE "payment_orders"
  ADD COLUMN IF NOT EXISTS "currency"      text    NOT NULL DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS "exchange_rate" numeric(15,4) NOT NULL DEFAULT 1;

-- ============================================================
-- 2) payment_order_items: importe en las dos monedas
-- ============================================================
-- `amount` NO cambia de significado: sigue siendo el importe imputado EN LA
-- MONEDA DEL COMPROBANTE. Es lo que hace que el saldo de una factura en dólares
-- cierre contra su propio total, sin depender de ningún tipo de cambio al leer.
--
-- `amount_in_order_currency` es ese mismo importe convertido a la moneda de la
-- OP, y es lo que suma para total_amount y para el cuadre contra los pagos.
--
-- `exchange_rate` es el tipo de cambio aplicado a este ítem, tomado de la
-- factura (snapshot: no se recalcula si la cotización cambia después).

ALTER TABLE "payment_order_items"
  ADD COLUMN IF NOT EXISTS "currency"                 text    NOT NULL DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS "exchange_rate"            numeric(15,4) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "amount_in_order_currency" numeric(15,2);

-- Backfill: hasta hoy todo se trataba como una sola moneda, así que el importe
-- convertido es el mismo importe. Se hace antes del NOT NULL para que las filas
-- existentes queden consistentes.
UPDATE "payment_order_items"
   SET "amount_in_order_currency" = "amount"
 WHERE "amount_in_order_currency" IS NULL;

ALTER TABLE "payment_order_items"
  ALTER COLUMN "amount_in_order_currency" SET NOT NULL;

-- Las facturas ya cargadas en dólares tienen su moneda en purchase_invoices:
-- se refleja en los ítems que las imputan para no perder el dato histórico.
-- El importe convertido no se toca: los datos viejos se cargaron sin conversión
-- y recalcularlos ahora inventaría un tipo de cambio que nadie eligió.
UPDATE "payment_order_items" i
   SET "currency" = pi."currency"
  FROM "purchase_invoices" pi
 WHERE i."invoice_id" = pi."id"
   AND pi."currency" IS NOT NULL
   AND pi."currency" <> 'ARS';
