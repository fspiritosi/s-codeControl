-- Respaldo previo al borrado: la migración anterior descarta deliberadamente los ítems
-- de los equipos no donantes de cada tipo, y acá se elimina la tabla de origen. Esta copia
-- deja auditar en producción qué se descartó y permite reconstruirlo si algún tipo hubiera
-- elegido un donante no representativo. Se elimina en un release posterior, una vez que el
-- cliente haya validado los costos en pantalla.
CREATE TABLE IF NOT EXISTS "item_mantenimiento_backup_20260830" AS
  SELECT im.*, ce."vehicle_id", ce."company_id", ce."accesorios"
  FROM "item_mantenimiento" im
  JOIN "costo_equipo" ce ON ce."id" = im."costo_equipo_id";

-- Los accesorios y el mantenimiento ahora viven en item_costo_tipo, a nivel tipo de
-- equipo (migrados en 20260830143030_migrar_items_mantenimiento_a_tipo.sql).
DROP TABLE IF EXISTS "item_mantenimiento";
ALTER TABLE "costo_equipo" DROP COLUMN IF EXISTS "accesorios";
