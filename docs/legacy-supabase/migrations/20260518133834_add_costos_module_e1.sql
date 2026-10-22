-- E-1: Módulo Costos — enums, CCT, equipos, servicios, composición, fórmula polinómica, liquidación

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "tipo_concepto_cct" AS ENUM (
  'remunerativo',
  'no_remunerativo',
  'descuento',
  'aporte_patronal',
  'provision',
  'prevision',
  'ausentismo'
);

CREATE TYPE "ambito_concepto_cct" AS ENUM (
  'mod_servicio',
  'liquidacion'
);

CREATE TYPE "clase_calculo_concepto" AS ENUM (
  'FIJO_GLOBAL',
  'FIJO_POR_CATEGORIA',
  'PCT_CONCEPTO',
  'PCT_SUMA_CONCEPTOS',
  'POR_ANTIGUEDAD_VALOR',
  'POR_ANTIGUEDAD_PCT',
  'POR_UNIDAD'
);

CREATE TYPE "tipo_indice_polinomico" AS ENUM (
  'cct',
  'ipim_34',
  'gasoil_g3',
  'ipim_ng',
  'custom'
);

CREATE TYPE "estado_liquidacion" AS ENUM (
  'borrador',
  'confirmada',
  'pagada'
);

-- ─── config_cct ───────────────────────────────────────────────────────────────

CREATE TABLE "config_cct" (
  "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "company_id"     UUID        NOT NULL,
  "cct_codigo"     TEXT        NOT NULL,
  "cct_nombre"     TEXT        NOT NULL,
  "vigencia_desde" VARCHAR(7)  NOT NULL,
  "vigencia_hasta" VARCHAR(7),
  "is_active"      BOOLEAN     NOT NULL DEFAULT true,
  "descripcion"    TEXT,
  CONSTRAINT "config_cct_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "config_cct_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "config_cct_company_id_cct_codigo_is_active_idx" ON "config_cct"("company_id", "cct_codigo", "is_active");

-- ─── categoria_cct ────────────────────────────────────────────────────────────

CREATE TABLE "categoria_cct" (
  "id"            UUID    NOT NULL DEFAULT gen_random_uuid(),
  "config_cct_id" UUID    NOT NULL,
  "codigo"        TEXT    NOT NULL,
  "nombre"        TEXT    NOT NULL,
  "orden"         INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "categoria_cct_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "categoria_cct_config_cct_id_fkey" FOREIGN KEY ("config_cct_id") REFERENCES "config_cct"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "categoria_cct_config_cct_id_codigo_key" UNIQUE ("config_cct_id", "codigo")
);

-- ─── concepto_cct ─────────────────────────────────────────────────────────────

CREATE TABLE "concepto_cct" (
  "id"            UUID                     NOT NULL DEFAULT gen_random_uuid(),
  "config_cct_id" UUID                     NOT NULL,
  "codigo"        TEXT                     NOT NULL,
  "nombre"        TEXT                     NOT NULL,
  "tipo"          "tipo_concepto_cct"      NOT NULL,
  "aplica_en"     "ambito_concepto_cct"[]  NOT NULL DEFAULT '{}',
  "clase_calculo" "clase_calculo_concepto" NOT NULL,
  "parametros"    JSONB                    NOT NULL DEFAULT '{}',
  "orden"         INTEGER                  NOT NULL DEFAULT 0,
  "is_active"     BOOLEAN                  NOT NULL DEFAULT true,
  CONSTRAINT "concepto_cct_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "concepto_cct_config_cct_id_fkey" FOREIGN KEY ("config_cct_id") REFERENCES "config_cct"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "concepto_cct_config_cct_id_codigo_key" UNIQUE ("config_cct_id", "codigo")
);

-- ─── valor_concepto_categoria ─────────────────────────────────────────────────

CREATE TABLE "valor_concepto_categoria" (
  "id"               UUID           NOT NULL DEFAULT gen_random_uuid(),
  "concepto_cct_id"  UUID           NOT NULL,
  "categoria_cct_id" UUID           NOT NULL,
  "valor"            DECIMAL(15, 2) NOT NULL,
  CONSTRAINT "valor_concepto_categoria_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "valor_concepto_categoria_concepto_cct_id_fkey"  FOREIGN KEY ("concepto_cct_id")  REFERENCES "concepto_cct"("id")  ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "valor_concepto_categoria_categoria_cct_id_fkey" FOREIGN KEY ("categoria_cct_id") REFERENCES "categoria_cct"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "valor_concepto_categoria_concepto_cct_id_categoria_cct_id_key" UNIQUE ("concepto_cct_id", "categoria_cct_id")
);

-- ─── tope_imponible ───────────────────────────────────────────────────────────

CREATE TABLE "tope_imponible" (
  "id"             UUID           NOT NULL DEFAULT gen_random_uuid(),
  "codigo"         TEXT           NOT NULL,
  "vigencia_desde" VARCHAR(7)     NOT NULL,
  "valor"          DECIMAL(15, 2) NOT NULL,
  "fuente"         TEXT,
  CONSTRAINT "tope_imponible_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tope_imponible_codigo_vigencia_desde_key" UNIQUE ("codigo", "vigencia_desde")
);

-- ─── costo_equipo ─────────────────────────────────────────────────────────────

CREATE TABLE "costo_equipo" (
  "id"                 UUID           NOT NULL DEFAULT gen_random_uuid(),
  "created_at"         TIMESTAMPTZ    NOT NULL DEFAULT now(),
  "vehicle_id"         UUID           NOT NULL,
  "company_id"         UUID           NOT NULL,
  "valor_compra"       DECIMAL(15, 2) NOT NULL,
  "valor_residual"     DECIMAL(15, 2) NOT NULL,
  "anios_amortizacion" INTEGER        NOT NULL,
  "km_vida_util"       INTEGER        NOT NULL,
  "is_active"          BOOLEAN        NOT NULL DEFAULT true,
  CONSTRAINT "costo_equipo_pkey"            PRIMARY KEY ("id"),
  CONSTRAINT "costo_equipo_vehicle_id_key"  UNIQUE ("vehicle_id"),
  CONSTRAINT "costo_equipo_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "costo_equipo_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id")  ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── item_mantenimiento ───────────────────────────────────────────────────────

CREATE TABLE "item_mantenimiento" (
  "id"              UUID           NOT NULL DEFAULT gen_random_uuid(),
  "costo_equipo_id" UUID           NOT NULL,
  "nombre"          TEXT           NOT NULL,
  "frecuencia_km"   INTEGER        NOT NULL,
  "precio_unitario" DECIMAL(15, 2) NOT NULL,
  "cantidad"        INTEGER        NOT NULL DEFAULT 1,
  "is_active"       BOOLEAN        NOT NULL DEFAULT true,
  CONSTRAINT "item_mantenimiento_pkey"                PRIMARY KEY ("id"),
  CONSTRAINT "item_mantenimiento_costo_equipo_id_fkey" FOREIGN KEY ("costo_equipo_id") REFERENCES "costo_equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── servicio_contrato ────────────────────────────────────────────────────────

CREATE TABLE "servicio_contrato" (
  "id"                 UUID          NOT NULL DEFAULT gen_random_uuid(),
  "created_at"         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "company_id"         UUID          NOT NULL,
  "customer_id"        UUID          NOT NULL,
  "config_cct_id"      UUID          NOT NULL,
  "nombre"             TEXT          NOT NULL,
  "descripcion"        TEXT,
  "fecha_inicio"       VARCHAR(7)    NOT NULL,
  "fecha_fin"          VARCHAR(7),
  "is_active"          BOOLEAN       NOT NULL DEFAULT true,
  "margen_iibb"        DECIMAL(5, 2) NOT NULL DEFAULT 0,
  "margen_debcred"     DECIMAL(5, 2) NOT NULL DEFAULT 0,
  "margen_estructura"  DECIMAL(5, 2) NOT NULL DEFAULT 0,
  "margen_ganancia"    DECIMAL(5, 2) NOT NULL DEFAULT 0,
  "licencia_ordenanza" DECIMAL(5, 2) NOT NULL DEFAULT 0,
  CONSTRAINT "servicio_contrato_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "servicio_contrato_company_id_fkey"   FOREIGN KEY ("company_id")   REFERENCES "company"("id")    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "servicio_contrato_customer_id_fkey"  FOREIGN KEY ("customer_id")  REFERENCES "customers"("id")  ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "servicio_contrato_config_cct_id_fkey" FOREIGN KEY ("config_cct_id") REFERENCES "config_cct"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── asignacion_mod ───────────────────────────────────────────────────────────

CREATE TABLE "asignacion_mod" (
  "id"               UUID          NOT NULL DEFAULT gen_random_uuid(),
  "servicio_id"      UUID          NOT NULL,
  "employee_id"      UUID          NOT NULL,
  "categoria_cct_id" UUID          NOT NULL,
  "afectacion_pct"   DECIMAL(5, 2) NOT NULL,
  "antiguedad_anios" INTEGER       NOT NULL DEFAULT 0,
  "is_active"        BOOLEAN       NOT NULL DEFAULT true,
  "overrides_calculo" JSONB,
  CONSTRAINT "asignacion_mod_pkey"                PRIMARY KEY ("id"),
  CONSTRAINT "asignacion_mod_servicio_id_fkey"      FOREIGN KEY ("servicio_id")      REFERENCES "servicio_contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "asignacion_mod_employee_id_fkey"      FOREIGN KEY ("employee_id")      REFERENCES "employees"("id")        ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "asignacion_mod_categoria_cct_id_fkey" FOREIGN KEY ("categoria_cct_id") REFERENCES "categoria_cct"("id")    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── asignacion_equipo_servicio ───────────────────────────────────────────────

CREATE TABLE "asignacion_equipo_servicio" (
  "id"           UUID    NOT NULL DEFAULT gen_random_uuid(),
  "servicio_id"  UUID    NOT NULL,
  "vehicle_id"   UUID    NOT NULL,
  "km_mensuales" INTEGER NOT NULL DEFAULT 0,
  "is_active"    BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "asignacion_equipo_servicio_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "asignacion_equipo_servicio_servicio_id_fkey"  FOREIGN KEY ("servicio_id") REFERENCES "servicio_contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "asignacion_equipo_servicio_vehicle_id_fkey"   FOREIGN KEY ("vehicle_id")  REFERENCES "vehicles"("id")         ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── item_ocp ─────────────────────────────────────────────────────────────────

CREATE TABLE "item_ocp" (
  "id"                 UUID           NOT NULL DEFAULT gen_random_uuid(),
  "servicio_id"        UUID           NOT NULL,
  "concepto"           TEXT           NOT NULL,
  "costo_anual"        DECIMAL(15, 2) NOT NULL,
  "cantidad_empleados" INTEGER        NOT NULL DEFAULT 1,
  "is_active"          BOOLEAN        NOT NULL DEFAULT true,
  CONSTRAINT "item_ocp_pkey"             PRIMARY KEY ("id"),
  CONSTRAINT "item_ocp_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicio_contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── registro_combustible ─────────────────────────────────────────────────────

CREATE TABLE "registro_combustible" (
  "id"               UUID           NOT NULL DEFAULT gen_random_uuid(),
  "servicio_id"      UUID           NOT NULL,
  "periodo"          VARCHAR(7)     NOT NULL,
  "litros_mensuales" DECIMAL(10, 2) NOT NULL,
  "precio_gasoil_lt" DECIMAL(15, 2) NOT NULL,
  "precio_urea_lt"   DECIMAL(15, 2) NOT NULL DEFAULT 0,
  CONSTRAINT "registro_combustible_pkey"                    PRIMARY KEY ("id"),
  CONSTRAINT "registro_combustible_servicio_id_periodo_key" UNIQUE ("servicio_id", "periodo"),
  CONSTRAINT "registro_combustible_servicio_id_fkey"        FOREIGN KEY ("servicio_id") REFERENCES "servicio_contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── tipo_output_servicio ─────────────────────────────────────────────────────

CREATE TABLE "tipo_output_servicio" (
  "id"          UUID    NOT NULL DEFAULT gen_random_uuid(),
  "servicio_id" UUID    NOT NULL,
  "codigo"      TEXT    NOT NULL,
  "nombre"      TEXT    NOT NULL,
  "formula"     JSONB   NOT NULL DEFAULT '{}',
  "orden"       INTEGER NOT NULL DEFAULT 0,
  "is_active"   BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "tipo_output_servicio_pkey"                   PRIMARY KEY ("id"),
  CONSTRAINT "tipo_output_servicio_servicio_id_codigo_key" UNIQUE ("servicio_id", "codigo"),
  CONSTRAINT "tipo_output_servicio_servicio_id_fkey"       FOREIGN KEY ("servicio_id") REFERENCES "servicio_contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── composicion_costo ────────────────────────────────────────────────────────

CREATE TABLE "composicion_costo" (
  "id"                   UUID           NOT NULL DEFAULT gen_random_uuid(),
  "created_at"           TIMESTAMPTZ    NOT NULL DEFAULT now(),
  "servicio_id"          UUID           NOT NULL,
  "periodo"              VARCHAR(7)     NOT NULL,
  "config_cct_id"        UUID           NOT NULL,
  "subtotal_mod"         DECIMAL(15, 2) NOT NULL,
  "subtotal_equipos"     DECIMAL(15, 2) NOT NULL,
  "subtotal_combustible" DECIMAL(15, 2) NOT NULL,
  "subtotal_ocp"         DECIMAL(15, 2) NOT NULL,
  "total_costo_directo"  DECIMAL(15, 2) NOT NULL,
  "total_con_margenes"   DECIMAL(15, 2) NOT NULL,
  "precio_mensual"       DECIMAL(15, 2) NOT NULL,
  "detalle_json"         JSONB          NOT NULL DEFAULT '{}',
  "pdf_path"             TEXT,
  CONSTRAINT "composicion_costo_pkey"                    PRIMARY KEY ("id"),
  CONSTRAINT "composicion_costo_servicio_id_periodo_key" UNIQUE ("servicio_id", "periodo"),
  CONSTRAINT "composicion_costo_servicio_id_fkey"        FOREIGN KEY ("servicio_id")  REFERENCES "servicio_contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "composicion_costo_config_cct_id_fkey"      FOREIGN KEY ("config_cct_id") REFERENCES "config_cct"("id")      ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── output_composicion ───────────────────────────────────────────────────────

CREATE TABLE "output_composicion" (
  "id"              UUID           NOT NULL DEFAULT gen_random_uuid(),
  "composicion_id"  UUID           NOT NULL,
  "tipo_output_id"  UUID           NOT NULL,
  "valor"           DECIMAL(15, 4) NOT NULL,
  "detalle_calculo" JSONB,
  CONSTRAINT "output_composicion_pkey"                               PRIMARY KEY ("id"),
  CONSTRAINT "output_composicion_composicion_id_tipo_output_id_key" UNIQUE ("composicion_id", "tipo_output_id"),
  CONSTRAINT "output_composicion_composicion_id_fkey" FOREIGN KEY ("composicion_id") REFERENCES "composicion_costo"("id")    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "output_composicion_tipo_output_id_fkey" FOREIGN KEY ("tipo_output_id") REFERENCES "tipo_output_servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── formula_polinomica ───────────────────────────────────────────────────────

CREATE TABLE "formula_polinomica" (
  "id"          UUID           NOT NULL DEFAULT gen_random_uuid(),
  "servicio_id" UUID           NOT NULL,
  "descripcion" TEXT,
  "fecha_base"  VARCHAR(7)     NOT NULL,
  "precio_base" DECIMAL(15, 2) NOT NULL,
  CONSTRAINT "formula_polinomica_pkey"            PRIMARY KEY ("id"),
  CONSTRAINT "formula_polinomica_servicio_id_key" UNIQUE ("servicio_id"),
  CONSTRAINT "formula_polinomica_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicio_contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── componente_formula ───────────────────────────────────────────────────────

CREATE TABLE "componente_formula" (
  "id"                UUID                    NOT NULL DEFAULT gen_random_uuid(),
  "formula_id"        UUID                    NOT NULL,
  "codigo"            TEXT                    NOT NULL,
  "nombre"            TEXT                    NOT NULL,
  "tipo_indice"       "tipo_indice_polinomico" NOT NULL,
  "ponderacion"       DECIMAL(5, 4)           NOT NULL,
  "valor_indice_base" DECIMAL(15, 4)          NOT NULL,
  "fuente_indice"     TEXT,
  CONSTRAINT "componente_formula_pkey"                  PRIMARY KEY ("id"),
  CONSTRAINT "componente_formula_formula_id_codigo_key" UNIQUE ("formula_id", "codigo"),
  CONSTRAINT "componente_formula_formula_id_fkey"       FOREIGN KEY ("formula_id") REFERENCES "formula_polinomica"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── periodo_formula_polinomica ───────────────────────────────────────────────

CREATE TABLE "periodo_formula_polinomica" (
  "id"                          UUID           NOT NULL DEFAULT gen_random_uuid(),
  "formula_id"                  UUID           NOT NULL,
  "servicio_id"                 UUID           NOT NULL,
  "periodo"                     VARCHAR(7)     NOT NULL,
  "ajuste_porcentual_acumulado" DECIMAL(10, 6) NOT NULL,
  "ajuste_monto"                DECIMAL(15, 2) NOT NULL,
  "valor_ajustado"              DECIMAL(15, 2) NOT NULL,
  "importe_certificado"         DECIMAL(15, 2),
  "retroactivo_acumulado"       DECIMAL(15, 2),
  CONSTRAINT "periodo_formula_polinomica_pkey"                    PRIMARY KEY ("id"),
  CONSTRAINT "periodo_formula_polinomica_formula_id_periodo_key"  UNIQUE ("formula_id", "periodo"),
  CONSTRAINT "periodo_formula_polinomica_formula_id_fkey"         FOREIGN KEY ("formula_id")  REFERENCES "formula_polinomica"("id")  ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "periodo_formula_polinomica_servicio_id_fkey"        FOREIGN KEY ("servicio_id") REFERENCES "servicio_contrato"("id")   ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── valor_componente_periodo ─────────────────────────────────────────────────

CREATE TABLE "valor_componente_periodo" (
  "id"               UUID           NOT NULL DEFAULT gen_random_uuid(),
  "periodo_id"       UUID           NOT NULL,
  "componente_id"    UUID           NOT NULL,
  "valor_indice"     DECIMAL(15, 4) NOT NULL,
  "variacion_pct"    DECIMAL(10, 6) NOT NULL,
  "contribucion_pct" DECIMAL(10, 6) NOT NULL,
  CONSTRAINT "valor_componente_periodo_pkey"                         PRIMARY KEY ("id"),
  CONSTRAINT "valor_componente_periodo_periodo_id_componente_id_key" UNIQUE ("periodo_id", "componente_id"),
  CONSTRAINT "valor_componente_periodo_periodo_id_fkey"    FOREIGN KEY ("periodo_id")    REFERENCES "periodo_formula_polinomica"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "valor_componente_periodo_componente_id_fkey" FOREIGN KEY ("componente_id") REFERENCES "componente_formula"("id")         ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── liquidacion_sueldo ───────────────────────────────────────────────────────

CREATE TABLE "liquidacion_sueldo" (
  "id"                 UUID                 NOT NULL DEFAULT gen_random_uuid(),
  "created_at"         TIMESTAMPTZ          NOT NULL DEFAULT now(),
  "company_id"         UUID                 NOT NULL,
  "employee_id"        UUID                 NOT NULL,
  "config_cct_id"      UUID                 NOT NULL,
  "categoria_cct_id"   UUID                 NOT NULL,
  "periodo"            VARCHAR(7)           NOT NULL,
  "estado"             "estado_liquidacion" NOT NULL DEFAULT 'borrador',
  "dias_trabajados"    INTEGER              NOT NULL DEFAULT 30,
  "inasistencias_dias" INTEGER              NOT NULL DEFAULT 0,
  "hs_nocturnas"       DECIMAL(8, 2)        NOT NULL DEFAULT 0,
  "hs_extras_50"       DECIMAL(8, 2)        NOT NULL DEFAULT 0,
  "hs_extras_100"      DECIMAL(8, 2)        NOT NULL DEFAULT 0,
  "dias_feriado"       INTEGER              NOT NULL DEFAULT 0,
  "dias_desarraigo"    INTEGER              NOT NULL DEFAULT 0,
  "inputs_extra"       JSONB,
  "total_remunerativo" DECIMAL(15, 2)       NOT NULL,
  "total_no_remun"     DECIMAL(15, 2)       NOT NULL,
  "total_descuentos"   DECIMAL(15, 2)       NOT NULL,
  "total_sac"          DECIMAL(15, 2)       NOT NULL DEFAULT 0,
  "neto_a_pagar"       DECIMAL(15, 2)       NOT NULL,
  "conceptos_json"     JSONB                NOT NULL DEFAULT '{}',
  "pdf_path"           TEXT,
  CONSTRAINT "liquidacion_sueldo_pkey"                    PRIMARY KEY ("id"),
  CONSTRAINT "liquidacion_sueldo_employee_id_periodo_key" UNIQUE ("employee_id", "periodo"),
  CONSTRAINT "liquidacion_sueldo_company_id_fkey"         FOREIGN KEY ("company_id")       REFERENCES "company"("id")       ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "liquidacion_sueldo_employee_id_fkey"        FOREIGN KEY ("employee_id")      REFERENCES "employees"("id")     ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "liquidacion_sueldo_config_cct_id_fkey"      FOREIGN KEY ("config_cct_id")    REFERENCES "config_cct"("id")    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "liquidacion_sueldo_categoria_cct_id_fkey"   FOREIGN KEY ("categoria_cct_id") REFERENCES "categoria_cct"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
