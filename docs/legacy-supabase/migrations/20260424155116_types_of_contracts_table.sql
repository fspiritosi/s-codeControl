-- Convertir employees.type_of_contract de enum a tabla-catálogo de opciones.
--
-- Estrategia (trade-off pragmático):
--   - El valor stored en employees.type_of_contract SIGUE SIENDO TEXTO (ej. "Plazo fijo").
--     No se convierte a FK UUID para preservar portabilidad de condiciones de documentos
--     (document_types.conditions guarda strings) y minimizar cambios en código.
--   - La tabla types_of_contracts sirve sólo como catálogo editable por empresa para
--     poblar el select del formulario de empleado.
--
-- Pasos:
--   1. Crear tabla types_of_contracts.
--   2. Seed 3 valores originales con company_id=NULL (catálogo semilla, visible a todas).
--   3. Replicar por cada empresa que tenga empleados usando ese tipo (para que puedan
--      renombrar/desactivar sin afectar otras empresas).
--   4. ALTER COLUMN employees.type_of_contract de enum a text (conserva los labels).
--   5. DROP TYPE type_of_contract_enum (ya no lo usa nadie).

BEGIN;

-- 1. Crear tabla catálogo
CREATE TABLE IF NOT EXISTS "types_of_contracts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "name" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "company_id" uuid REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "types_of_contracts_company_id_idx" ON "types_of_contracts" ("company_id");

-- 2. Seed semilla (company_id NULL)
INSERT INTO "types_of_contracts" ("name", "company_id", "is_active")
SELECT v.name, NULL::uuid, true
FROM (VALUES ('Período de prueba'), ('A tiempo indeterminado'), ('Plazo fijo')) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM "types_of_contracts" t WHERE t.name = v.name AND t.company_id IS NULL
);

-- 3. Replicar por empresa (idempotente: solo inserta si no existe ya)
INSERT INTO "types_of_contracts" ("name", "company_id", "is_active")
SELECT DISTINCT e."type_of_contract"::text AS name, e."company_id", true
FROM "employees" e
WHERE e."company_id" IS NOT NULL
  AND e."type_of_contract" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "types_of_contracts" t
    WHERE t.name = e."type_of_contract"::text AND t.company_id = e."company_id"
  );

-- 4. Cambiar tipo de columna (el cast ::text del enum devuelve el label, ej. "Plazo fijo")
ALTER TABLE "employees" ALTER COLUMN "type_of_contract" TYPE text USING "type_of_contract"::text;

-- 5. Eliminar el enum (ya no lo referencia nadie)
DROP TYPE IF EXISTS "type_of_contract_enum";

COMMIT;
