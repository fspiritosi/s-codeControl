-- COD-570: agregar fecha programada de pago en payment_orders
-- Fecha futura en la que se planea pagar la OP. Distinta de date (fecha de la OP)
-- y de paid_at (fecha real en que se marco como pagada).
-- Aditiva, idempotente, no destructiva.

ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS scheduled_payment_date DATE;
