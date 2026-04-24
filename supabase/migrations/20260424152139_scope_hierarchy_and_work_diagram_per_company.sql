-- Scopear hierarchy y work-diagram por empresa.
-- Estrategia:
--   1. ADD columna company_id (nullable) a ambas tablas.
--   2. Por cada par (empresa, registro_original) que esté en uso por los empleados,
--      crear una copia con company_id = <empresa> y re-apuntar el FK del empleado.
--   3. Los registros originales con company_id NULL se mantienen como "catálogo semilla"
--      accesible a todas las empresas (se consultan con OR company_id IS NULL desde la app).

BEGIN;

-- Paso 1: ADD columna company_id
ALTER TABLE "hierarchy"
  ADD COLUMN IF NOT EXISTS "company_id" uuid REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "work-diagram"
  ADD COLUMN IF NOT EXISTS "company_id" uuid REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Paso 2.a: Replicar hierarchy por empresa usando un mapeo (old_id, company_id) -> new_id
-- y re-apuntar los empleados.
WITH uses AS (
  SELECT DISTINCT e.hierarchical_position AS old_id, e.company_id
  FROM employees e
  JOIN hierarchy h ON h.id = e.hierarchical_position
  WHERE e.hierarchical_position IS NOT NULL
    AND e.company_id IS NOT NULL
    AND h.company_id IS NULL
),
inserted AS (
  INSERT INTO hierarchy (id, created_at, name, is_active, company_id)
  SELECT gen_random_uuid(), now(), h.name, h.is_active, u.company_id
  FROM uses u
  JOIN hierarchy h ON h.id = u.old_id
  RETURNING id, name, company_id
),
-- Mapeo (old_id, company_id) -> new_id por NAME + company (el name original se mantiene)
mapping AS (
  SELECT u.old_id, u.company_id, i.id AS new_id
  FROM uses u
  JOIN hierarchy h_old ON h_old.id = u.old_id
  JOIN inserted i ON i.company_id = u.company_id AND i.name = h_old.name
)
UPDATE employees e
SET hierarchical_position = m.new_id
FROM mapping m
WHERE e.hierarchical_position = m.old_id
  AND e.company_id = m.company_id;

-- Paso 2.b: Replicar work-diagram por empresa y re-apuntar empleados.
WITH uses AS (
  SELECT DISTINCT e.workflow_diagram AS old_id, e.company_id
  FROM employees e
  JOIN "work-diagram" w ON w.id = e.workflow_diagram
  WHERE e.workflow_diagram IS NOT NULL
    AND e.company_id IS NOT NULL
    AND w.company_id IS NULL
),
inserted AS (
  INSERT INTO "work-diagram" (id, created_at, name, is_active, company_id)
  SELECT gen_random_uuid(), now(), w.name, w.is_active, u.company_id
  FROM uses u
  JOIN "work-diagram" w ON w.id = u.old_id
  RETURNING id, name, company_id
),
mapping AS (
  SELECT u.old_id, u.company_id, i.id AS new_id
  FROM uses u
  JOIN "work-diagram" w_old ON w_old.id = u.old_id
  JOIN inserted i ON i.company_id = u.company_id AND i.name = w_old.name
)
UPDATE employees e
SET workflow_diagram = m.new_id
FROM mapping m
WHERE e.workflow_diagram = m.old_id
  AND e.company_id = m.company_id;

COMMIT;
