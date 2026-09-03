-- Catálogo de conceptos de costo por empresa. Reemplaza a item_costo_tipo (importes planos por
-- tipo) por conceptos reutilizables que pueden ser un monto fijo o un porcentaje de otro valor.
-- Los porcentuales se resuelven POR EQUIPO, con el valor de compra de cada unidad, así que el
-- catálogo guarda la regla y no el importe.
-- Los porcentajes se guardan como fracción (0.17 = 17%), igual que costo_equipo.valor_residual_pct.

CREATE TYPE "clase_calculo_concepto_equipo" AS ENUM (
  'FIJO', 'PCT_VALOR_EQUIPO', 'PCT_CONCEPTO', 'PCT_SUMA_CONCEPTOS', 'POR_KM'
);

CREATE TYPE "base_valor_equipo" AS ENUM (
  'VALOR_COMPRA', 'VALOR_COMPRA_MAS_ACCESORIOS', 'VALOR_RESIDUAL'
);

CREATE TABLE "concepto_equipo" (
  "id"                    uuid                            NOT NULL DEFAULT gen_random_uuid(),
  "created_at"            timestamptz                     NOT NULL DEFAULT now(),
  "company_id"            uuid                            NOT NULL,
  "codigo"                text                            NOT NULL,
  "nombre"                text                            NOT NULL,
  "clase"                 "clase_item_costo"              NOT NULL,
  "clase_calculo"         "clase_calculo_concepto_equipo" NOT NULL,
  "parametros"            jsonb                           NOT NULL,
  "product_id"            uuid,
  "indice_id"             uuid,
  "precio_actualizado_at" timestamptz,
  "orden"                 integer                         NOT NULL DEFAULT 0,
  "is_active"             boolean                         NOT NULL DEFAULT true,
  CONSTRAINT "concepto_equipo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "concepto_equipo_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "company"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "concepto_equipo_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON UPDATE CASCADE,
  CONSTRAINT "concepto_equipo_indice_id_fkey"
    FOREIGN KEY ("indice_id") REFERENCES "indices"("id") ON UPDATE CASCADE,
  CONSTRAINT "concepto_equipo_company_codigo_key" UNIQUE ("company_id", "codigo")
);
CREATE INDEX "concepto_equipo_company_idx" ON "concepto_equipo"("company_id");

CREATE TABLE "concepto_tipo_equipo" (
  "id"                   uuid    NOT NULL DEFAULT gen_random_uuid(),
  "costo_tipo_equipo_id" uuid    NOT NULL,
  "concepto_equipo_id"   uuid    NOT NULL,
  "orden"                integer NOT NULL DEFAULT 0,
  "is_active"            boolean NOT NULL DEFAULT true,
  CONSTRAINT "concepto_tipo_equipo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "concepto_tipo_equipo_perfil_fkey"
    FOREIGN KEY ("costo_tipo_equipo_id") REFERENCES "costo_tipo_equipo"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "concepto_tipo_equipo_concepto_fkey"
    FOREIGN KEY ("concepto_equipo_id") REFERENCES "concepto_equipo"("id") ON UPDATE CASCADE,
  CONSTRAINT "concepto_tipo_equipo_perfil_concepto_key" UNIQUE ("costo_tipo_equipo_id", "concepto_equipo_id")
);
CREATE INDEX "concepto_tipo_equipo_perfil_idx" ON "concepto_tipo_equipo"("costo_tipo_equipo_id");
