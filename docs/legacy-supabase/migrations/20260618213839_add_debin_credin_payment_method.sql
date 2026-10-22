-- Agrega DEBIN/CREDIN como método de pago (TSK-282).
-- Es un único medio de pago electrónico asociado a una cuenta bancaria; se
-- comporta como una transferencia (egreso de la cuenta) en la Orden de Pago.

ALTER TYPE "payment_method" ADD VALUE IF NOT EXISTS 'DEBIN_CREDIN';
