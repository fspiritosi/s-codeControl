-- Registro de capacitación: datos del acta y firma del empleado (tsk-540).
--
-- Migración ADD-only: todas las columnas nuevas son nullable o traen DEFAULT,
-- así las capacitaciones y los intentos ya existentes siguen funcionando igual.
--
-- Contexto: la empresa necesita descargar la planilla de registro de capacitación
-- con el formato que usan en papel. La planilla es "viva": lista únicamente a los
-- empleados que aprobaron hasta el momento de la descarga.

-- ============================================================
-- 1) ENUMS
-- ============================================================

-- "Temas incluidos" del formulario en papel: son cuatro fijos, no tags libres.
CREATE TYPE "training_topic" AS ENUM (
  'SEGURIDAD_VIAL',
  'SEGURIDAD_HIGIENE',
  'SALUD',
  'MEDIO_AMBIENTE'
);

-- "Evaluación" del formulario en papel: cómo se evaluó la capacitación.
CREATE TYPE "training_evaluation_method" AS ENUM (
  'ESCRITA_ORAL',
  'ENCUESTA_AUDITORIA',
  'SUPERVISION_INSPECCION',
  'EVALUACION_DESEMPENO'
);

-- ============================================================
-- 2) training_instructors: capacitadores por empresa
-- ============================================================
-- Hoy el capacitador está pegado como imagen en el Word (Lic. Lucas Gutiérrez).
-- El cliente anticipó que puede cambiar, así que va como tabla y no como texto
-- suelto en cada capacitación. signature_path apunta al bucket de Storage.

CREATE TABLE IF NOT EXISTS "training_instructors" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id"      uuid NOT NULL REFERENCES "company"("id"),
  "full_name"       text NOT NULL,
  "position"        text,
  "license_numbers" text,
  "signature_path"  text,
  "is_active"       boolean NOT NULL DEFAULT true,
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  "updated_at"      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "training_instructors_company_id_idx"
  ON "training_instructors" ("company_id");

-- ============================================================
-- 3) trainings: campos del encabezado del acta
-- ============================================================
-- dictated_at define el mes al que corresponde la capacitación: si se dicta el
-- 15/07, es la capacitación de julio.
-- estimated_duration_minutes es la duración que declara el capacitador y NO es
-- test_limit_time, que es el límite de tiempo del cuestionario.
-- validity_months en NULL significa que la capacitación no vence.

ALTER TABLE "trainings"
  ADD COLUMN IF NOT EXISTS "dictated_at"                date,
  ADD COLUMN IF NOT EXISTS "location"                   text DEFAULT 'Capacitación Online',
  ADD COLUMN IF NOT EXISTS "instructor_id"              uuid REFERENCES "training_instructors"("id"),
  ADD COLUMN IF NOT EXISTS "estimated_duration_minutes" integer,
  ADD COLUMN IF NOT EXISTS "topics"                     "training_topic"[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "teaching_resources"         text,
  ADD COLUMN IF NOT EXISTS "material_delivered"         boolean,
  ADD COLUMN IF NOT EXISTS "material_delivered_detail"  text,
  ADD COLUMN IF NOT EXISTS "evaluation_methods"         "training_evaluation_method"[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "effectiveness_method"       text,
  ADD COLUMN IF NOT EXISTS "requires_new_actions"       boolean,
  ADD COLUMN IF NOT EXISTS "new_actions_detail"         text,
  ADD COLUMN IF NOT EXISTS "validity_months"            integer;

CREATE INDEX IF NOT EXISTS "trainings_instructor_id_idx"
  ON "trainings" ("instructor_id");

-- ============================================================
-- 4) training_attempts: firma del empleado
-- ============================================================
-- signer_full_name y signer_position son un snapshot al momento de firmar: la
-- planilla se regenera en cada descarga y, sin esto, un empleado que cambia de
-- puesto aparecería con el puesto nuevo al lado de una firma vieja.
-- La metadata (ip, user agent) sostiene el valor probatorio del registro, que
-- se usa en auditorías de HSE.

ALTER TABLE "training_attempts"
  ADD COLUMN IF NOT EXISTS "signature_path"       text,
  ADD COLUMN IF NOT EXISTS "signed_at"            timestamptz,
  ADD COLUMN IF NOT EXISTS "signature_ip"         text,
  ADD COLUMN IF NOT EXISTS "signature_user_agent" text,
  ADD COLUMN IF NOT EXISTS "signer_full_name"     text,
  ADD COLUMN IF NOT EXISTS "signer_position"      text;
