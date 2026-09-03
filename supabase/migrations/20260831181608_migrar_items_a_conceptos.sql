-- Convierte los items planos de item_costo_tipo en conceptos del catalogo por empresa.
-- Cada item se vuelve un concepto FIJO y el perfil que lo usaba queda asociado a el.
--
-- Unificacion: se unifican los items IDENTICOS dentro de la empresa, o sea los que coinciden
-- en nombre, clase, cantidad, precio unitario y producto vinculado. Dos items con el mismo
-- nombre pero distinto importe NO se unifican: son montos distintos y fusionarlos moveria el
-- costo de uno de los tipos. Quedan como dos conceptos con el mismo nombre y codigos
-- distintos (sufijo numerico), igual que hace derivarCodigo() del lado TS.
--
-- Los importes no cambian: cantidad, precio_unitario e is_active se copian tal cual.
--
-- Todo corre dentro de una transaccion: se aplica con `psql < archivo`, que es autocommit por
-- sentencia, asi que sin el BEGIN/COMMIT un fallo del control final dejaria los INSERT
-- commiteados y la tabla vieja sin borrar, o sea un estado a medias para limpiar a mano.
--
-- Idempotencia: el alta de conceptos saltea los que ya existen con la misma clave natural y el
-- alta de asociaciones lleva ON CONFLICT DO NOTHING, asi que una segunda pasada no duplica nada.

BEGIN;

-- Respaldo previo: la conversion es irreversible y conviene poder auditarla.
CREATE TABLE IF NOT EXISTS "item_costo_tipo_backup_20260831" AS
  SELECT i.*, c."company_id", c."type_id"
  FROM "item_costo_tipo" i
  JOIN "costo_tipo_equipo" c ON c."id" = i."costo_tipo_equipo_id";

-- 1) Un concepto FIJO por cada item distinto de la empresa.
--
--    El codigo se deriva del nombre: minusculas, sin acentos, no alfanumericos a '_', 40
--    caracteres. El sufijo ante colision NO se numera por particion del nombre derivado, sino
--    contra los codigos REALMENTE usados en la empresa (los preexistentes y los creados en esta
--    misma pasada). Numerar por particion es lo que permitiria que "Cubiertas" (segunda
--    aparicion, 'cubiertas_2') y "Cubiertas 2" (primera aparicion, 'cubiertas_2') se pisen: el
--    ON CONFLICT descartaria una fila en silencio. Este bucle es el mismo algoritmo que
--    derivarCodigo() en TS y no puede colisionar.
DO $$
DECLARE
  r        record;
  -- Prefijo v_ a proposito: una variable llamada `codigo` es ambigua contra la columna
  -- concepto_equipo.codigo dentro del EXISTS y Postgres aborta el bloque.
  v_base   text;
  v_codigo text;
  v_n      integer;
BEGIN
  FOR r IN
    SELECT c."company_id",
           i."nombre",
           i."clase",
           i."cantidad",
           i."precio_unitario",
           i."product_id",
           MIN(i."orden")                 AS orden,
           MAX(i."precio_actualizado_at")  AS precio_actualizado_at,
           BOOL_OR(i."is_active")          AS is_active
    FROM "item_costo_tipo" i
    JOIN "costo_tipo_equipo" c ON c."id" = i."costo_tipo_equipo_id"
    GROUP BY c."company_id", i."nombre", i."clase", i."cantidad", i."precio_unitario",
             i."product_id"
    ORDER BY c."company_id", i."clase", i."nombre", i."precio_unitario", i."cantidad"
  LOOP
    -- Si el concepto ya existe con esta clave natural, no se vuelve a crear.
    PERFORM 1
    FROM "concepto_equipo" ce
    WHERE ce."company_id"    = r."company_id"
      AND ce."nombre"        = r."nombre"
      AND ce."clase"         = r."clase"
      AND ce."clase_calculo" = 'FIJO'
      AND (ce."parametros"->>'cantidad')::numeric        = r."cantidad"
      AND (ce."parametros"->>'precio_unitario')::numeric = r."precio_unitario"
      AND ce."product_id" IS NOT DISTINCT FROM r."product_id";
    CONTINUE WHEN FOUND;

    v_base := COALESCE(
      NULLIF(
        LEFT(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              LOWER(TRANSLATE(r."nombre", 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')),
              '[^a-z0-9]+', '_', 'g'),
            '^_+|_+$', '', 'g'),
          40),
        ''),
      'concepto');

    v_codigo := v_base;
    v_n := 1;
    WHILE EXISTS (
      SELECT 1 FROM "concepto_equipo" ce
      WHERE ce."company_id" = r."company_id" AND ce."codigo" = v_codigo
    ) LOOP
      v_n := v_n + 1;
      v_codigo := v_base || '_' || v_n;
    END LOOP;

    INSERT INTO "concepto_equipo"
      ("company_id", "codigo", "nombre", "clase", "clase_calculo", "parametros",
       "product_id", "precio_actualizado_at", "orden", "is_active")
    VALUES
      (r."company_id", v_codigo, r."nombre", r."clase", 'FIJO',
       jsonb_build_object('cantidad', r."cantidad", 'precio_unitario', r."precio_unitario"),
       r."product_id", r."precio_actualizado_at", r."orden", r."is_active");
  END LOOP;
END $$;

-- 2) Asociar cada perfil a los conceptos que tenia, conservando el orden y el is_active del
--    item: un item desactivado tiene que revivir desactivado, o sumaria al costo del tipo.
--    El JOIN va por la clave natural completa, la misma que agrupo el paso 1.
INSERT INTO "concepto_tipo_equipo"
  ("costo_tipo_equipo_id", "concepto_equipo_id", "orden", "is_active")
SELECT i."costo_tipo_equipo_id", ce."id", i."orden", i."is_active"
FROM "item_costo_tipo" i
JOIN "costo_tipo_equipo" c ON c."id" = i."costo_tipo_equipo_id"
JOIN "concepto_equipo" ce
  ON ce."company_id"    = c."company_id"
 AND ce."nombre"        = i."nombre"
 AND ce."clase"         = i."clase"
 AND ce."clase_calculo" = 'FIJO'
 AND (ce."parametros"->>'cantidad')::numeric        = i."cantidad"
 AND (ce."parametros"->>'precio_unitario')::numeric = i."precio_unitario"
 AND ce."product_id" IS NOT DISTINCT FROM i."product_id"
ON CONFLICT ("costo_tipo_equipo_id", "concepto_equipo_id") DO NOTHING;

-- 3) Informar el resultado y frenar si algun item quedo sin su concepto.
--    El control es "no quedo ningun item sin mapear", no una igualdad de conteos: dos items
--    identicos dentro del mismo tipo colapsan legitimamente en una sola asociacion.
DO $$
DECLARE items integer; conceptos integer; asociaciones integer; huerfanos integer;
BEGIN
  SELECT COUNT(*) INTO items        FROM "item_costo_tipo";
  SELECT COUNT(*) INTO conceptos    FROM "concepto_equipo";
  SELECT COUNT(*) INTO asociaciones FROM "concepto_tipo_equipo";

  SELECT COUNT(*) INTO huerfanos
  FROM "item_costo_tipo" i
  JOIN "costo_tipo_equipo" c ON c."id" = i."costo_tipo_equipo_id"
  WHERE NOT EXISTS (
    SELECT 1 FROM "concepto_equipo" ce
    WHERE ce."company_id"    = c."company_id"
      AND ce."nombre"        = i."nombre"
      AND ce."clase"         = i."clase"
      AND ce."clase_calculo" = 'FIJO'
      AND (ce."parametros"->>'cantidad')::numeric        = i."cantidad"
      AND (ce."parametros"->>'precio_unitario')::numeric = i."precio_unitario"
      AND ce."product_id" IS NOT DISTINCT FROM i."product_id"
  );

  RAISE NOTICE 'Items: % - conceptos: % - asociaciones: %', items, conceptos, asociaciones;
  IF huerfanos > 0 THEN
    RAISE EXCEPTION 'La migracion dejo % item(s) sin su concepto', huerfanos;
  END IF;
END $$;

DROP TABLE "item_costo_tipo";

COMMIT;
