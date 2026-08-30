-- Respaldo previo al borrado: la migración anterior descarta deliberadamente los ítems
-- de los equipos no donantes de cada tipo, y acá se elimina la tabla de origen. Esta copia
-- deja auditar en producción qué se descartó y permite reconstruirlo si algún tipo hubiera
-- elegido un donante no representativo. Se elimina en un release posterior, una vez que el
-- cliente haya validado los costos en pantalla.
CREATE TABLE IF NOT EXISTS "item_mantenimiento_backup_20260830" AS
  SELECT im.*, ce."vehicle_id", ce."company_id", ce."accesorios"
  FROM "item_mantenimiento" im
  JOIN "costo_equipo" ce ON ce."id" = im."costo_equipo_id";

-- Respaldo de la columna accesorios para TODOS los costo_equipo, no sólo los que tienen
-- ítems de mantenimiento: un equipo sin ítems nunca es donante, así que sus accesorios no
-- se migraron a item_costo_tipo y el respaldo de arriba (que parte de item_mantenimiento)
-- tampoco los captura. Sin esto, ese valor se pierde de forma irrecuperable.
CREATE TABLE IF NOT EXISTS "costo_equipo_accesorios_backup_20260830" AS
  SELECT "id", "vehicle_id", "company_id", "accesorios" FROM "costo_equipo";

-- Los accesorios y el mantenimiento ahora viven en item_costo_tipo, a nivel tipo de
-- equipo (migrados en 20260830143030_migrar_items_mantenimiento_a_tipo.sql).
DROP TABLE IF EXISTS "item_mantenimiento";
ALTER TABLE "costo_equipo" DROP COLUMN IF EXISTS "accesorios";
