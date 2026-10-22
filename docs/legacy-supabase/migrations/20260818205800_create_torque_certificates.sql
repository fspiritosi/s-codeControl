-- Certificado de torqueo: tablas de spec de referencia, certificado y checklist (tsk-575).
-- Migración ADD-only.

-- ============================================================
-- 1) ENUMS
-- ============================================================
CREATE TYPE "torque_sheet_format" AS ENUM ('LIGHT', 'BUS');
CREATE TYPE "torque_bolt_condition" AS ENUM ('DRY', 'LUBRICATED');

-- ============================================================
-- 2) torque_specs: tabla de referencia de torques por marca/config
-- ============================================================
CREATE TABLE "torque_specs" (
  "id"            uuid        NOT NULL DEFAULT gen_random_uuid(),
  "company_id"    uuid        NOT NULL,
  "brand_id"      bigint      NOT NULL,
  "configuration" text        NOT NULL,
  "nm_min"        integer     NOT NULL,
  "nm_max"        integer     NOT NULL,
  "ftlb_min"      integer,
  "ftlb_max"      integer,
  "is_active"     boolean     NOT NULL DEFAULT true,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "torque_specs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "torque_specs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "torque_specs_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand_vehicles"("id") ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX "torque_specs_company_id_idx" ON "torque_specs"("company_id");
CREATE INDEX "torque_specs_brand_id_idx" ON "torque_specs"("brand_id");
-- Sin esta unique, el ON CONFLICT DO NOTHING del seed (más abajo) no tiene
-- arbiter: una empresa no puede tener dos veces la misma configuración para
-- la misma marca, y esto es lo que hace idempotente al seed.
CREATE UNIQUE INDEX "torque_specs_company_brand_config_key" ON "torque_specs"("company_id", "brand_id", "configuration");

-- ============================================================
-- 3) torque_certificates: cabecera del certificado
-- ============================================================
CREATE TABLE "torque_certificates" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "company_id"            uuid                     NOT NULL,
  "number"                integer                  NOT NULL,
  "full_number"           text                     NOT NULL,
  "vehicle_id"            uuid                     NOT NULL,
  "sheet_format"          "torque_sheet_format"    NOT NULL,
  "date"                  date                     NOT NULL,
  "driver_name"           text                     NOT NULL,
  "mechanic_name"         text                     NOT NULL,
  "place"                 text                     NOT NULL,
  "tool_type"             text                     NOT NULL,
  "calibration_di"        text,
  "calibration_dd"        text,
  "calibration_td"        text,
  "calibration_ti"        text,
  "required_torque"       text                     NOT NULL,
  "meets_requirement"     boolean                  NOT NULL,
  "tolerance_range_nm"    text,
  "bolt_condition"        "torque_bolt_condition"  NOT NULL,
  "vehicle_domain"        text,
  "vehicle_intern_number" text,
  "vehicle_brand_name"    text,
  "created_by"            uuid,
  "created_at"            timestamptz              NOT NULL DEFAULT now(),
  CONSTRAINT "torque_certificates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "torque_certificates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "torque_certificates_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "torque_certificates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profile"("id") ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE UNIQUE INDEX "torque_certificates_company_id_number_key" ON "torque_certificates"("company_id", "number");
CREATE INDEX "torque_certificates_vehicle_id_idx" ON "torque_certificates"("vehicle_id");

-- ============================================================
-- 4) torque_certificate_checks: checklist (15 ítems del catálogo de Task 1,
--    definido en src/modules/maintenance/features/torque/shared/torque-spec.ts;
--    item_key guarda esas claves como texto, sin duplicar el catálogo en la DB)
-- ============================================================
CREATE TABLE "torque_certificate_checks" (
  "id"             uuid    NOT NULL DEFAULT gen_random_uuid(),
  "certificate_id" uuid    NOT NULL,
  "item_key"       text    NOT NULL,
  "value"          boolean NOT NULL,
  "observations"   text,
  CONSTRAINT "torque_certificate_checks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "torque_certificate_checks_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "torque_certificates"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX "torque_certificate_checks_certificate_id_idx" ON "torque_certificate_checks"("certificate_id");

-- ============================================================
-- 5) Seed de torque_specs: valores de las dos hojas en papel. Mercedes-Benz
--    para vehículos chicos, Iveco para colectivos; se cargan como dato porque
--    la tabla que se imprime depende de la marca real del vehículo, no del
--    formato de hoja (tsk-575).
--    Las marcas NO son globales: brand_vehicles tiene company_id. Por eso cada
--    empresa se une con SUS propias marcas y no con un CROSS JOIN, que le
--    asignaría a un cliente las marcas de otro.
-- ============================================================
INSERT INTO torque_specs (company_id, brand_id, configuration, nm_min, nm_max, ftlb_min, ftlb_max)
SELECT b.company_id, b.id, v.configuration, v.nm_min, v.nm_max, v.ftlb_min, v.ftlb_max
FROM (VALUES
  ('Mercedes-Benz', '9+1',  150, 170, 111, 125),
  ('Mercedes-Benz', '15+1', 170, 190, 125, 140),
  ('Mercedes-Benz', '19+1', 190, 210, 140, 155),
  ('Iveco', '1+8',   500,  600, 369,  443),
  ('Iveco', '24+1',  600,  700, 443,  516),
  ('Iveco', '31+1',  800,  900, 590,  664),
  ('Iveco', '41+1', 1000, 1200, 738,  885),
  ('Iveco', '43+1', 1100, 1300, 811,  959),
  ('Iveco', '44+1', 1200, 1400, 885, 1030)
) AS v(brand_name, configuration, nm_min, nm_max, ftlb_min, ftlb_max)
JOIN brand_vehicles b ON b.name = v.brand_name AND b.company_id IS NOT NULL
ON CONFLICT DO NOTHING;
