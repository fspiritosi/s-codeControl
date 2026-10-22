-- COD-458: agregar estado PAID al enum payment_order_status
-- Estado terminal (no se puede revertir).
-- Idempotente: chequea si ya existe antes de agregar.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'payment_order_status' AND e.enumlabel = 'PAID'
  ) THEN
    ALTER TYPE payment_order_status ADD VALUE 'PAID' AFTER 'CONFIRMED';
  END IF;
END$$;

-- Campos para registrar marca de pagada
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS paid_by text;
