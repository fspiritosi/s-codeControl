-- Los accesorios y el mantenimiento ahora viven en item_costo_tipo, a nivel tipo de
-- equipo (migrados en 20260830143030_migrar_items_mantenimiento_a_tipo.sql).
DROP TABLE IF EXISTS "item_mantenimiento";
ALTER TABLE "costo_equipo" DROP COLUMN IF EXISTS "accesorios";
