-- Alineación de las tablas E-3 (Servicio/Contrato + MOD + OCP) al diseño §2.4.
--
-- La migración E-1 (20260518133834) creó servicio_contrato, asignacion_mod,
-- asignacion_equipo_servicio e item_ocp con una forma desactualizada. Esta migración
-- las alinea al diseño definitivo: márgenes con 4 decimales, fechas YYYY-MM-DD,
-- config_servicio, afectación de equipos, grupo y cantidad_personas en OCP, y borrado
-- en cascada de los hijos del servicio.
--
-- Las 4 tablas están vacías (módulo de costos sin UI E-3 todavía): sin pérdida de datos.

-- ─── servicio_contrato ────────────────────────────────────────────────────────
ALTER TABLE "servicio_contrato" ALTER COLUMN "nombre"       TYPE VARCHAR(160);
ALTER TABLE "servicio_contrato" ALTER COLUMN "fecha_inicio" TYPE VARCHAR(10);
ALTER TABLE "servicio_contrato" ALTER COLUMN "fecha_fin"    TYPE VARCHAR(10);
ALTER TABLE "servicio_contrato" ALTER COLUMN "margen_iibb"        TYPE DECIMAL(5, 4);
ALTER TABLE "servicio_contrato" ALTER COLUMN "margen_debcred"     TYPE DECIMAL(5, 4);
ALTER TABLE "servicio_contrato" ALTER COLUMN "margen_estructura"  TYPE DECIMAL(5, 4);
ALTER TABLE "servicio_contrato" ALTER COLUMN "margen_ganancia"    TYPE DECIMAL(5, 4);
ALTER TABLE "servicio_contrato" ALTER COLUMN "licencia_ordenanza" TYPE DECIMAL(5, 4);
ALTER TABLE "servicio_contrato" ADD COLUMN "config_servicio" JSONB;

-- ─── asignacion_mod ───────────────────────────────────────────────────────────
ALTER TABLE "asignacion_mod" ALTER COLUMN "afectacion_pct" TYPE DECIMAL(5, 4);

ALTER TABLE "asignacion_mod" DROP CONSTRAINT "asignacion_mod_servicio_id_fkey";
ALTER TABLE "asignacion_mod"
  ADD CONSTRAINT "asignacion_mod_servicio_id_fkey"
  FOREIGN KEY ("servicio_id") REFERENCES "servicio_contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── asignacion_equipo_servicio ───────────────────────────────────────────────
ALTER TABLE "asignacion_equipo_servicio" ADD COLUMN "afectacion_pct" DECIMAL(5, 4) NOT NULL DEFAULT 1;
ALTER TABLE "asignacion_equipo_servicio"
  ADD CONSTRAINT "asignacion_equipo_servicio_servicio_id_vehicle_id_key"
  UNIQUE ("servicio_id", "vehicle_id");

ALTER TABLE "asignacion_equipo_servicio" DROP CONSTRAINT "asignacion_equipo_servicio_servicio_id_fkey";
ALTER TABLE "asignacion_equipo_servicio"
  ADD CONSTRAINT "asignacion_equipo_servicio_servicio_id_fkey"
  FOREIGN KEY ("servicio_id") REFERENCES "servicio_contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── item_ocp ─────────────────────────────────────────────────────────────────
ALTER TABLE "item_ocp" ALTER COLUMN "concepto" TYPE VARCHAR(160);
ALTER TABLE "item_ocp" ADD COLUMN "grupo" VARCHAR(40) NOT NULL DEFAULT 'otros';
ALTER TABLE "item_ocp" ALTER COLUMN "grupo" DROP DEFAULT;
ALTER TABLE "item_ocp" DROP COLUMN "cantidad_empleados";
ALTER TABLE "item_ocp" ADD COLUMN "cantidad_personas" DECIMAL(5, 2) NOT NULL DEFAULT 1;

ALTER TABLE "item_ocp" DROP CONSTRAINT "item_ocp_servicio_id_fkey";
ALTER TABLE "item_ocp"
  ADD CONSTRAINT "item_ocp_servicio_id_fkey"
  FOREIGN KEY ("servicio_id") REFERENCES "servicio_contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
