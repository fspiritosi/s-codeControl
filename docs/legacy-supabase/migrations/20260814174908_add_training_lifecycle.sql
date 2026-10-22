-- Ciclo de vida de la capacitación: fecha límite y cierre formal (tsk-540).
--
-- Migración ADD-only. El cliente definió este circuito:
--   1. Lucas crea la capacitación con una fecha límite de realización.
--   2. Mientras está abierta, los empleados aprueban y entran al registro grupal.
--   3. Los administradores descargan una vista PROVISORIA para seguir el avance,
--      aun con la evaluación de eficacia y las nuevas acciones sin completar.
--   4. Alcanzada la fecha límite y completados esos campos, Lucas cierra la
--      capacitación y se genera el registro DEFINITIVO.

-- ALTER TYPE ... ADD VALUE va suelto: Postgres no permite usar el valor nuevo en
-- la misma transacción que lo crea.
ALTER TYPE "training_status" ADD VALUE IF NOT EXISTS 'Cerrada';

ALTER TABLE "trainings"
  ADD COLUMN IF NOT EXISTS "deadline_at" date,
  ADD COLUMN IF NOT EXISTS "closed_at"   timestamptz,
  ADD COLUMN IF NOT EXISTS "closed_by"   uuid REFERENCES "profile"("id");

-- El registro definitivo se congela al cerrar: se guarda la ruta del PDF en
-- Storage para que no dependa de regenerarlo con datos que pueden cambiar.
ALTER TABLE "trainings"
  ADD COLUMN IF NOT EXISTS "record_pdf_path" text;

CREATE INDEX IF NOT EXISTS "trainings_deadline_at_idx"
  ON "trainings" ("deadline_at");
