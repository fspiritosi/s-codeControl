-- Vínculo entre una línea de pago de la Orden de Pago y el cheque seleccionado
-- (propio o de tercero) que la respalda. (TSK Orden de Pago con cheques)
--
-- Se registra del lado del pago (check_id) para que sobreviva a la recreación de
-- payment_order_payments al editar una OP en borrador. El cambio de estado del
-- cheque (ENDORSED/DELIVERED) y el endoso/entrega ocurren al confirmar la OP.
-- ON DELETE SET NULL: si se borra el cheque, el pago no se rompe.

ALTER TABLE "public"."payment_order_payments"
  ADD COLUMN "check_id" uuid REFERENCES "public"."checks"("id") ON DELETE SET NULL;

CREATE INDEX "idx_payment_order_payments_check_id"
  ON "public"."payment_order_payments" ("check_id");
