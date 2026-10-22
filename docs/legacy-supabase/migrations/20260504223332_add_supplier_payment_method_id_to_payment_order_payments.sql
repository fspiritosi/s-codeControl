-- COD-458: agrega FK opcional a payment_order_payments para registrar el
-- destino del pago (cuenta del proveedor) elegido al crear la OP.
-- Aditiva e idempotente.

ALTER TABLE public.payment_order_payments
  ADD COLUMN IF NOT EXISTS supplier_payment_method_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payment_order_payments_supplier_payment_method_id_fkey'
  ) THEN
    ALTER TABLE public.payment_order_payments
      ADD CONSTRAINT payment_order_payments_supplier_payment_method_id_fkey
      FOREIGN KEY (supplier_payment_method_id)
      REFERENCES public.supplier_payment_methods(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS payment_order_payments_supplier_payment_method_id_idx
  ON public.payment_order_payments(supplier_payment_method_id);
