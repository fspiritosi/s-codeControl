-- Migra los ítems de mantenimiento y el accesorio escalar desde costo_equipo
-- (por dominio) hacia costo_tipo_equipo / item_costo_tipo (por tipo de equipo).
--
-- Donante de cada (company_id, type): el equipo con más ítems activos; desempata
-- el costo_equipo más antiguo. Los ítems de los equipos no donantes se descartan
-- deliberadamente (decisión del spec 2026-08-30).
--
-- cantidad = 1 y precio_unitario = precio_anual ⇒ el valor anual no cambia.
--
-- Todavía NO se borra nada de costo_equipo.accesorios ni de item_mantenimiento:
-- el código actual sigue leyendo de ahí hasta la Task 9.

-- 1) Un perfil por cada par (empresa, tipo) que tenga al menos un equipo con costo.
--    El company_id sale de costo_equipo, no de vehicles (donde es nullable).
INSERT INTO "costo_tipo_equipo" ("company_id", "type_id")
SELECT DISTINCT ce."company_id", v."type"
FROM "costo_equipo" ce
JOIN "vehicles" v ON v."id" = ce."vehicle_id"
ON CONFLICT ("company_id", "type_id") DO NOTHING;

-- 2) Elegir el equipo donante de cada par.
CREATE TEMP TABLE "donantes" AS
SELECT DISTINCT ON (ce."company_id", v."type")
       ce."company_id",
       v."type"        AS type_id,
       ce."id"         AS costo_equipo_id,
       ce."accesorios" AS accesorios
FROM "costo_equipo" ce
JOIN "vehicles" v ON v."id" = ce."vehicle_id"
LEFT JOIN "item_mantenimiento" im
       ON im."costo_equipo_id" = ce."id" AND im."is_active" = true
GROUP BY ce."company_id", v."type", ce."id", ce."accesorios", ce."created_at"
ORDER BY ce."company_id", v."type", COUNT(im."id") DESC, ce."created_at" ASC;

-- 3) Copiar los ítems de mantenimiento del donante.
--    WHERE NOT EXISTS: idempotencia. item_costo_tipo no tiene constraint única
--    sobre una clave natural, así que una re-ejecución de este archivo sobre una
--    base donde ya corrió duplicaría cada ítem si no se filtra explícitamente
--    (el paso 1 no vuelve a crear el perfil, el JOIN de arriba lo encuentra igual
--    y sin este guard se insertarían todos los ítems de nuevo).
INSERT INTO "item_costo_tipo"
  ("costo_tipo_equipo_id", "clase", "nombre", "cantidad", "precio_unitario", "orden", "is_active")
SELECT cte."id", 'MANTENIMIENTO', im."nombre", 1, im."precio_anual", im."orden", im."is_active"
FROM "donantes" d
JOIN "costo_tipo_equipo" cte
  ON cte."company_id" = d."company_id" AND cte."type_id" = d."type_id"
JOIN "item_mantenimiento" im ON im."costo_equipo_id" = d."costo_equipo_id"
WHERE NOT EXISTS (
  SELECT 1 FROM "item_costo_tipo" i2
  WHERE i2."costo_tipo_equipo_id" = cte."id"
    AND i2."clase" = 'MANTENIMIENTO'
    AND i2."nombre" = im."nombre"
);

-- 4) El accesorio escalar del donante, si tenía.
--    Mismo guard de idempotencia que el paso 3, sobre clase = 'ACCESORIO'.
INSERT INTO "item_costo_tipo"
  ("costo_tipo_equipo_id", "clase", "nombre", "cantidad", "precio_unitario", "orden")
SELECT cte."id", 'ACCESORIO', 'Accesorios (migrado)', 1, d."accesorios", 0
FROM "donantes" d
JOIN "costo_tipo_equipo" cte
  ON cte."company_id" = d."company_id" AND cte."type_id" = d."type_id"
WHERE d."accesorios" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "item_costo_tipo" i2
    WHERE i2."costo_tipo_equipo_id" = cte."id"
      AND i2."clase" = 'ACCESORIO'
      AND i2."nombre" = 'Accesorios (migrado)'
  );

-- 5) Informar cuántos ítems se descartan, para revisión posterior.
DO $$
DECLARE descartados integer;
BEGIN
  SELECT COUNT(*) INTO descartados
  FROM "item_mantenimiento" im
  WHERE im."costo_equipo_id" NOT IN (SELECT "costo_equipo_id" FROM "donantes");
  RAISE NOTICE 'Ítems de mantenimiento descartados (equipos no donantes): %', descartados;
END $$;

DROP TABLE "donantes";
