-- Alineación de las tablas E-2 (Costo de equipos + Combustible) al diseño §2.3.
--
-- La migración E-1 (20260518133834) creó costo_equipo, item_mantenimiento y
-- registro_combustible con una forma desactualizada. Esta migración las alinea con
-- el diseño definitivo, que es el que reproduce las planillas reales del cliente
-- (Transporte SP): residual como porcentaje, accesorios, precio anual por ítem,
-- combustible por vehículo con urea.
--
-- Las 3 tablas son nuevas y están vacías (módulo de costos sin UI E-2 todavía),
-- por lo que el reemplazo de columnas no implica pérdida de datos.

-- ─── costo_equipo ─────────────────────────────────────────────────────────────
ALTER TABLE "costo_equipo" DROP COLUMN "valor_residual";
ALTER TABLE "costo_equipo" DROP COLUMN "km_vida_util";
ALTER TABLE "costo_equipo" ADD COLUMN "valor_residual_pct" DECIMAL(5, 4)  NOT NULL;
ALTER TABLE "costo_equipo" ADD COLUMN "km_anuales"         INTEGER        NOT NULL DEFAULT 0;
ALTER TABLE "costo_equipo" ADD COLUMN "accesorios"         DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- ─── item_mantenimiento ───────────────────────────────────────────────────────
ALTER TABLE "item_mantenimiento" DROP COLUMN "frecuencia_km";
ALTER TABLE "item_mantenimiento" DROP COLUMN "precio_unitario";
ALTER TABLE "item_mantenimiento" DROP COLUMN "cantidad";
ALTER TABLE "item_mantenimiento" ADD COLUMN "precio_anual" DECIMAL(15, 2) NOT NULL;
ALTER TABLE "item_mantenimiento" ADD COLUMN "orden"        INTEGER        NOT NULL DEFAULT 0;

-- Alinear ON DELETE del FK a Cascade (los ítems se borran con su costo_equipo).
ALTER TABLE "item_mantenimiento" DROP CONSTRAINT "item_mantenimiento_costo_equipo_id_fkey";
ALTER TABLE "item_mantenimiento"
  ADD CONSTRAINT "item_mantenimiento_costo_equipo_id_fkey"
  FOREIGN KEY ("costo_equipo_id") REFERENCES "costo_equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── registro_combustible ─────────────────────────────────────────────────────
ALTER TABLE "registro_combustible" DROP CONSTRAINT "registro_combustible_servicio_id_periodo_key";
ALTER TABLE "registro_combustible" ADD COLUMN "vehicle_id"  UUID           NOT NULL;
ALTER TABLE "registro_combustible" ADD COLUMN "litros_urea" DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE "registro_combustible"
  ADD CONSTRAINT "registro_combustible_vehicle_id_fkey"
  FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "registro_combustible"
  ADD CONSTRAINT "registro_combustible_servicio_id_vehicle_id_periodo_key"
  UNIQUE ("servicio_id", "vehicle_id", "periodo");

-- Alinear ON DELETE del FK servicio a Cascade (diseño §2.3).
ALTER TABLE "registro_combustible" DROP CONSTRAINT "registro_combustible_servicio_id_fkey";
ALTER TABLE "registro_combustible"
  ADD CONSTRAINT "registro_combustible_servicio_id_fkey"
  FOREIGN KEY ("servicio_id") REFERENCES "servicio_contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
