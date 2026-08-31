-- Convierte los items planos de item_costo_tipo en conceptos del catalogo por empresa.
-- Cada item se vuelve un concepto FIJO y el perfil que lo usaba queda asociado a el.
--
-- Unificacion: se unifican los items IDENTICOS dentro de la empresa, o sea los que coinciden
-- en nombre, clase, cantidad, precio unitario y producto vinculado. Dos items con el mismo
-- nombre pero distinto importe NO se unifican: son montos distintos y fusionarlos moveria el
-- costo de uno de los tipos. Quedan como dos conceptos con el mismo nombre y codigos
-- distintos (sufijo numerico), igual que hace derivarCodigo() del lado TS.
--
-- Los importes no cambian: cantidad y precio_unitario se copian tal cual a parametros.
--
-- Idempotencia: los dos INSERT llevan ON CONFLICT DO NOTHING sobre las claves naturales
-- (company_id + codigo, y perfil + concepto), asi que una segunda pasada no duplica nada.

-- Respaldo previo: la conversion es irreversible y conviene poder auditarla.
CREATE TABLE IF NOT EXISTS "item_costo_tipo_backup_20260831" AS
  SELECT i.*, c."company_id", c."type_id"
  FROM "item_costo_tipo" i
  JOIN "costo_tipo_equipo" c ON c."id" = i."costo_tipo_equipo_id";

-- 1) Un concepto FIJO por cada item distinto de la empresa.
--    El codigo se deriva del nombre: minusculas, sin acentos, no alfanumericos a '_', 40
--    caracteres. Ante colision dentro de la empresa se agrega un sufijo numerico.
WITH distintos AS (
  SELECT c."company_id",
         i."nombre",
         i."clase",
         i."cantidad",
         i."precio_unitario",
         i."product_id",
         MIN(i."orden")                AS orden,
         MAX(i."precio_actualizado_at") AS precio_actualizado_at
  FROM "item_costo_tipo" i
  JOIN "costo_tipo_equipo" c ON c."id" = i."costo_tipo_equipo_id"
  GROUP BY c."company_id", i."nombre", i."clase", i."cantidad", i."precio_unitario",
           i."product_id"
), con_base AS (
  SELECT d.*,
         COALESCE(
           NULLIF(
             LEFT(
               REGEXP_REPLACE(
                 REGEXP_REPLACE(
                   LOWER(TRANSLATE(d."nombre", 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')),
                   '[^a-z0-9]+', '_', 'g'),
                 '^_+|_+$', '', 'g'),
               40),
             ''),
           'concepto') AS codigo_base
  FROM distintos d
), con_codigo AS (
  SELECT b.*,
         ROW_NUMBER() OVER (
           PARTITION BY b."company_id", b."codigo_base"
           ORDER BY b."clase", b."nombre", b."precio_unitario", b."cantidad"
         ) AS n
  FROM con_base b
)
INSERT INTO "concepto_equipo"
  ("company_id", "codigo", "nombre", "clase", "clase_calculo", "parametros",
   "product_id", "precio_actualizado_at", "orden")
SELECT "company_id",
       CASE WHEN n = 1 THEN "codigo_base" ELSE "codigo_base" || '_' || n END,
       "nombre",
       "clase",
       'FIJO',
       jsonb_build_object('cantidad', "cantidad", 'precio_unitario', "precio_unitario"),
       "product_id",
       "precio_actualizado_at",
       "orden"
FROM con_codigo
ON CONFLICT ("company_id", "codigo") DO NOTHING;

-- 2) Asociar cada perfil a los conceptos que tenia, conservando el orden.
--    El JOIN va por la clave natural completa (nombre + clase + cantidad + precio + producto),
--    que es exactamente la que agrupo el paso 1, asi que cada item encuentra su concepto.
INSERT INTO "concepto_tipo_equipo" ("costo_tipo_equipo_id", "concepto_equipo_id", "orden")
SELECT i."costo_tipo_equipo_id", ce."id", i."orden"
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

-- 3) Informar el resultado y frenar si se perdio alguna fila por el camino.
DO $$
DECLARE items integer; conceptos integer; asociaciones integer;
BEGIN
  SELECT COUNT(*) INTO items        FROM "item_costo_tipo";
  SELECT COUNT(*) INTO conceptos    FROM "concepto_equipo";
  SELECT COUNT(*) INTO asociaciones FROM "concepto_tipo_equipo";
  RAISE NOTICE 'Items: % - conceptos creados: % - asociaciones: %', items, conceptos, asociaciones;
  IF asociaciones <> items THEN
    RAISE EXCEPTION 'La migracion perdio filas: % items contra % asociaciones', items, asociaciones;
  END IF;
END $$;

DROP TABLE "item_costo_tipo";
