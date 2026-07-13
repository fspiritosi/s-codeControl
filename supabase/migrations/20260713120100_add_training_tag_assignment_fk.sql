-- training_tag_assignments se creó en 20250505000000_create_hse_tables.sql con
-- la columna training_id pero SIN la FK hacia trainings (esa tabla no existía
-- como migración en ese momento). Sin esa FK, PostgREST no resuelve el select
-- embebido trainings -> training_tag_assignments y devuelve PGRST200
-- ("Could not find a relationship between 'trainings' and
-- 'training_tag_assignments'"), rompiendo el listado de capacitaciones.
--
-- En producción la FK ya se agregó manualmente, por eso allí el listado funciona.
-- Este bloque es idempotente: solo crea la FK si aún no existe ninguna FK desde
-- training_tag_assignments.training_id hacia trainings, así que es no-op en prod.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conrelid = 'public.training_tag_assignments'::regclass
      AND c.contype = 'f'
      AND c.confrelid = 'public.trainings'::regclass
  ) THEN
    ALTER TABLE "public"."training_tag_assignments"
      ADD CONSTRAINT "training_tag_assignments_training_id_fkey"
      FOREIGN KEY ("training_id") REFERENCES "public"."trainings" ("id") ON DELETE CASCADE;
  END IF;
END$$;
