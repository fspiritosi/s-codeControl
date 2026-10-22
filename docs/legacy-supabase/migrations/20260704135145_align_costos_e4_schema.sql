-- Alineación de las tablas E-4 (Composición + Outputs) al diseño §2.5.
--
-- La migración E-1 (20260518133834) creó composicion_costo, tipo_output_servicio
-- y output_composicion con una forma desactualizada (columnas TEXT, defaults '{}'
-- y FKs ON DELETE RESTRICT). Esta migración las alinea al diseño definitivo:
-- longitudes VARCHAR, sin defaults JSON, y borrado en cascada de los hijos
-- (outputs configurados del servicio y outputs calculados de la composición).
--
-- Las 3 tablas están vacías (módulo de costos sin UI E-4 todavía): sin pérdida de datos.

-- ─── tipo_output_servicio ─────────────────────────────────────────────────────
ALTER TABLE "tipo_output_servicio" ALTER COLUMN "codigo" TYPE VARCHAR(40);
ALTER TABLE "tipo_output_servicio" ALTER COLUMN "nombre" TYPE VARCHAR(120);
ALTER TABLE "tipo_output_servicio" ALTER COLUMN "formula" DROP DEFAULT;

ALTER TABLE "tipo_output_servicio" DROP CONSTRAINT "tipo_output_servicio_servicio_id_fkey";
ALTER TABLE "tipo_output_servicio"
  ADD CONSTRAINT "tipo_output_servicio_servicio_id_fkey"
  FOREIGN KEY ("servicio_id") REFERENCES "servicio_contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── composicion_costo ────────────────────────────────────────────────────────
ALTER TABLE "composicion_costo" ALTER COLUMN "pdf_path" TYPE VARCHAR(500);
ALTER TABLE "composicion_costo" ALTER COLUMN "detalle_json" DROP DEFAULT;

-- ─── output_composicion ───────────────────────────────────────────────────────
-- Los outputs calculados se borran junto con su composición.
ALTER TABLE "output_composicion" DROP CONSTRAINT "output_composicion_composicion_id_fkey";
ALTER TABLE "output_composicion"
  ADD CONSTRAINT "output_composicion_composicion_id_fkey"
  FOREIGN KEY ("composicion_id") REFERENCES "composicion_costo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
