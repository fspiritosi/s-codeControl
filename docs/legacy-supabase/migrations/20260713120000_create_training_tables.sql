-- Módulo HSE / Capacitaciones: las tablas training_* y el enum training_status
-- se crearon manualmente en producción y nunca se versionaron como migración,
-- por lo que faltaban en los entornos locales (relation "public.trainings"
-- does not exist). Esta migración las reconstruye a partir de prisma/schema.prisma.
--
-- Es idempotente y aditiva: en local crea lo que falta; en producción (donde ya
-- existen) es un no-op gracias a IF NOT EXISTS y la guardia del enum.

-- Enum de estado de capacitación
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'training_status') THEN
    CREATE TYPE "public"."training_status" AS ENUM ('Borrador', 'Archivado', 'Publicado');
  END IF;
END$$;

-- Capacitaciones
CREATE TABLE IF NOT EXISTS "public"."trainings" (
  "id"              uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at"      timestamptz DEFAULT now(),
  "company_id"      uuid NOT NULL,
  "title"           text NOT NULL,
  "description"     text,
  "passing_score"   integer NOT NULL DEFAULT 0,
  "test_limit_time" integer NOT NULL DEFAULT 0,
  "status"          "public"."training_status" DEFAULT 'Borrador',
  "updated_at"      timestamptz,
  CONSTRAINT "trainings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "trainings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company" ("id")
);

-- Materiales de una capacitación
CREATE TABLE IF NOT EXISTS "public"."training_materials" (
  "id"          uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at"  timestamptz DEFAULT now(),
  "training_id" uuid,
  "name"        text NOT NULL,
  "type"        text NOT NULL,
  "file_url"    text NOT NULL,
  "file_size"   bigint,
  "order_index" integer NOT NULL DEFAULT 0,
  "is_required" boolean DEFAULT true,
  CONSTRAINT "training_materials_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_materials_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings" ("id")
);

-- Preguntas de la evaluación
CREATE TABLE IF NOT EXISTS "public"."training_questions" (
  "id"            uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at"    timestamptz DEFAULT now(),
  "training_id"   uuid,
  "question_text" text NOT NULL,
  "question_type" text,
  "points"        integer,
  "order_index"   integer NOT NULL DEFAULT 0,
  "is_active"     boolean DEFAULT true,
  CONSTRAINT "training_questions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_questions_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings" ("id")
);

-- Opciones de cada pregunta
CREATE TABLE IF NOT EXISTS "public"."training_question_options" (
  "id"          uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at"  timestamptz DEFAULT now(),
  "question_id" uuid,
  "option_text" text NOT NULL,
  "is_correct"  boolean DEFAULT false,
  "order_index" integer NOT NULL DEFAULT 0,
  "is_active"   boolean DEFAULT true,
  CONSTRAINT "training_question_options_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."training_questions" ("id")
);

-- Asignaciones de capacitaciones a empleados
CREATE TABLE IF NOT EXISTS "public"."training_assignments" (
  "id"           uuid NOT NULL DEFAULT gen_random_uuid(),
  "employee_id"  uuid NOT NULL,
  "training_id"  uuid,
  "assigned_by"  uuid,
  "assigned_at"  timestamptz DEFAULT now(),
  "due_date"     timestamptz,
  "is_mandatory" boolean DEFAULT false,
  CONSTRAINT "training_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees" ("id"),
  CONSTRAINT "training_assignments_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings" ("id")
);

-- Intentos de evaluación
CREATE TABLE IF NOT EXISTS "public"."training_attempts" (
  "id"                 uuid NOT NULL DEFAULT gen_random_uuid(),
  "employee_id"        uuid NOT NULL,
  "training_id"        uuid,
  "attempt_number"     integer NOT NULL DEFAULT 1,
  "started_at"         timestamptz DEFAULT now(),
  "completed_at"       timestamptz,
  "score"              integer,
  "max_score"          integer NOT NULL,
  "passed"             boolean,
  "time_spent_seconds" integer,
  CONSTRAINT "training_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_attempts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees" ("id"),
  CONSTRAINT "training_attempts_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings" ("id")
);

-- Respuestas de cada intento
CREATE TABLE IF NOT EXISTS "public"."training_attempt_answers" (
  "id"                 uuid NOT NULL DEFAULT gen_random_uuid(),
  "attempt_id"         uuid,
  "question_id"        uuid,
  "selected_option_id" uuid,
  "text_answer"        text,
  "is_correct"         boolean,
  "answered_at"        timestamptz,
  CONSTRAINT "training_attempt_answers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."training_attempts" ("id"),
  CONSTRAINT "training_attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."training_questions" ("id"),
  CONSTRAINT "training_attempt_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "public"."training_question_options" ("id")
);

-- Lecturas de materiales
CREATE TABLE IF NOT EXISTS "public"."training_material_readings" (
  "id"          uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at"  timestamptz DEFAULT now(),
  "employee_id" uuid NOT NULL,
  "material_id" uuid NOT NULL,
  "training_id" uuid,
  "read_at"     timestamptz,
  CONSTRAINT "training_material_readings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_material_readings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees" ("id"),
  CONSTRAINT "training_material_readings_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."training_materials" ("id"),
  CONSTRAINT "training_material_readings_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings" ("id")
);

-- Progreso de lectura de materiales por empleado
CREATE TABLE IF NOT EXISTS "public"."employee_material_progress" (
  "id"                 uuid NOT NULL DEFAULT gen_random_uuid(),
  "employee_id"        uuid NOT NULL,
  "material_id"        uuid,
  "started_at"         timestamptz,
  "completed_at"       timestamptz,
  "time_spent_seconds" integer,
  CONSTRAINT "employee_material_progress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employee_material_progress_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees" ("id"),
  CONSTRAINT "employee_material_progress_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."training_materials" ("id")
);
