-- Versionado de capacitaciones (TKT-827).
--
-- Migración ADD-only. El cliente definió este circuito:
--   1. Una capacitación publicada que ya tiene intentos no se edita: se crea una
--      versión nueva en Borrador, copiando la anterior.
--   2. Mientras la versión nueva está en preparación, la anterior sigue publicada.
--   3. Al publicar la nueva, la anterior se cierra "por cambio de versión" y su
--      registro queda definitivo; sus constancias en el legajo se vencen.
--   4. Todos los empleados tienen que rendir la versión nueva.
--
-- Cada versión es una fila de trainings. Las capacitaciones existentes quedan
-- como versión 1 sin versión anterior.

-- Número de versión visible en el listado, el detalle y los PDF.
ALTER TABLE "trainings"
  ADD COLUMN IF NOT EXISTS "version_number" integer NOT NULL DEFAULT 1;

-- Agrupa todas las versiones de una misma capacitación. Es null en la original:
-- el grupo es root_training_id ?? id.
ALTER TABLE "trainings"
  ADD COLUMN IF NOT EXISTS "root_training_id" uuid REFERENCES "trainings"("id");

-- Versión que esta reemplaza. UNIQUE: una versión tiene a lo sumo una sucesora,
-- así no puede haber dos versiones nuevas en preparación a la vez.
ALTER TABLE "trainings"
  ADD COLUMN IF NOT EXISTS "previous_version_id" uuid REFERENCES "trainings"("id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trainings_previous_version_id_key'
  ) THEN
    ALTER TABLE "trainings"
      ADD CONSTRAINT "trainings_previous_version_id_key" UNIQUE ("previous_version_id");
  END IF;
END $$;

-- Momento en que la versión fue reemplazada por la siguiente. Distingue el
-- cierre por cambio de versión del cierre formal normal.
ALTER TABLE "trainings"
  ADD COLUMN IF NOT EXISTS "superseded_at" timestamptz;

-- Fecha de publicación, para la pestaña Versiones. Null en las publicadas antes
-- de esta migración.
ALTER TABLE "trainings"
  ADD COLUMN IF NOT EXISTS "published_at" timestamptz;

CREATE INDEX IF NOT EXISTS "trainings_root_training_id_idx"
  ON "trainings" ("root_training_id");
