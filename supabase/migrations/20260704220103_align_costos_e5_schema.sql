-- Alineación de las tablas E-5 (Fórmula polinómica) al diseño §2.6.
--
-- La migración E-1 (20260518133834) creó formula_polinomica, componente_formula,
-- periodo_formula_polinomica y valor_componente_periodo con columnas TEXT y FKs
-- ON DELETE RESTRICT. Esta migración las alinea al diseño: longitudes VARCHAR y
-- borrado en cascada de los hijos de la fórmula.
--
-- Las 4 tablas están vacías (módulo de costos sin UI E-5 todavía): sin pérdida de datos.

-- ─── formula_polinomica ───────────────────────────────────────────────────────
ALTER TABLE "formula_polinomica" DROP CONSTRAINT "formula_polinomica_servicio_id_fkey";
ALTER TABLE "formula_polinomica"
  ADD CONSTRAINT "formula_polinomica_servicio_id_fkey"
  FOREIGN KEY ("servicio_id") REFERENCES "servicio_contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── componente_formula ───────────────────────────────────────────────────────
ALTER TABLE "componente_formula" ALTER COLUMN "codigo"        TYPE VARCHAR(20);
ALTER TABLE "componente_formula" ALTER COLUMN "nombre"        TYPE VARCHAR(120);
ALTER TABLE "componente_formula" ALTER COLUMN "fuente_indice" TYPE VARCHAR(160);

ALTER TABLE "componente_formula" DROP CONSTRAINT "componente_formula_formula_id_fkey";
ALTER TABLE "componente_formula"
  ADD CONSTRAINT "componente_formula_formula_id_fkey"
  FOREIGN KEY ("formula_id") REFERENCES "formula_polinomica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── periodo_formula_polinomica ───────────────────────────────────────────────
ALTER TABLE "periodo_formula_polinomica" DROP CONSTRAINT "periodo_formula_polinomica_formula_id_fkey";
ALTER TABLE "periodo_formula_polinomica"
  ADD CONSTRAINT "periodo_formula_polinomica_formula_id_fkey"
  FOREIGN KEY ("formula_id") REFERENCES "formula_polinomica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── valor_componente_periodo ─────────────────────────────────────────────────
ALTER TABLE "valor_componente_periodo" DROP CONSTRAINT "valor_componente_periodo_periodo_id_fkey";
ALTER TABLE "valor_componente_periodo"
  ADD CONSTRAINT "valor_componente_periodo_periodo_id_fkey"
  FOREIGN KEY ("periodo_id") REFERENCES "periodo_formula_polinomica"("id") ON DELETE CASCADE ON UPDATE CASCADE;
