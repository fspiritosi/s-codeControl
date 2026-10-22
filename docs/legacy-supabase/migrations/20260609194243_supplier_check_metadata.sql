-- Metadata extendida del método de pago "Cheque" en proveedores (TSK-7).
--
-- Hasta ahora el método CHECK en supplier_payment_methods era solo un flag
-- "acepta cheques sí/no". Esta migración agrega metadata opcional del cheque,
-- sin tocar ni romper los datos existentes (todos los campos son nullable).

CREATE TYPE supplier_check_type AS ENUM ('COMMON', 'DEFERRED', 'ELECTRONIC');

ALTER TABLE "public"."supplier_payment_methods"
  ADD COLUMN "check_bank_name" text,
  ADD COLUMN "check_type"      supplier_check_type,
  ADD COLUMN "check_max_days"  integer,
  ADD COLUMN "check_payee"     text,
  ADD COLUMN "check_notes"     text;
