-- ================================================================
-- FIX: cash_movements.payment_order_id no existía en DB
-- ================================================================
-- La migración 20260505123008_add_payment_order_id_to_cash_movements.sql
-- fue commiteada como archivo vacío (0 bytes), por lo que aplicó como
-- noop. El schema Prisma sí incluye el campo, lo que rompe inserts en
-- cash_movements ("column (not available) does not exist").
--
-- Esta migración es idempotente: usa IF NOT EXISTS para que sea segura
-- correr tanto en entornos donde la columna nunca se creó como en los
-- que pudieran tenerla por algún hotfix manual.
-- ================================================================

BEGIN;

ALTER TABLE "cash_movements"
  ADD COLUMN IF NOT EXISTS "payment_order_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cash_movements_payment_order_id_fkey'
  ) THEN
    ALTER TABLE "cash_movements"
      ADD CONSTRAINT "cash_movements_payment_order_id_fkey"
      FOREIGN KEY ("payment_order_id") REFERENCES "payment_orders"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "cash_movements_payment_order_id_idx"
  ON "cash_movements" ("payment_order_id");

COMMIT;
