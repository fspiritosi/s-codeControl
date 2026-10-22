-- Accesorios y mantenimiento definidos a nivel tipo de equipo, no por dominio.
-- costo_tipo_equipo: perfil de costo compartido por todas las unidades de un tipo
--   dentro de una empresa. La unicidad incluye company_id porque type.company_id es
--   nullable: hay tipos globales que comparten varias empresas y sus listas no deben mezclarse.
-- item_costo_tipo: accesorio o ítem de mantenimiento del tipo. Una sola tabla con
--   discriminador `clase` porque comparten estructura y CRUD; lo único que cambia es
--   cómo entran al cálculo (accesorio → base amortizable; mantenimiento → gasto anual / 12).
--   `cantidad` significa "por unidad de equipo" en ACCESORIO y "por año" en MANTENIMIENTO.
--   product_id es opcional: vincula el ítem a un producto de almacén para poder
--   refrescar precio_unitario desde products.cost_price.

CREATE TYPE "clase_item_costo" AS ENUM ('ACCESORIO', 'MANTENIMIENTO');

CREATE TABLE "costo_tipo_equipo" (
  "id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "company_id" uuid        NOT NULL,
  "type_id"    uuid        NOT NULL,
  "is_active"  boolean     NOT NULL DEFAULT true,
  CONSTRAINT "costo_tipo_equipo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "costo_tipo_equipo_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "company"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "costo_tipo_equipo_type_id_fkey"
    FOREIGN KEY ("type_id") REFERENCES "type"("id") ON UPDATE CASCADE,
  CONSTRAINT "costo_tipo_equipo_company_type_key" UNIQUE ("company_id", "type_id")
);

CREATE TABLE "item_costo_tipo" (
  "id"                    uuid               NOT NULL DEFAULT gen_random_uuid(),
  "costo_tipo_equipo_id"  uuid               NOT NULL,
  "clase"                 "clase_item_costo" NOT NULL,
  "nombre"                text               NOT NULL,
  "product_id"            uuid,
  "cantidad"              numeric(12,3)      NOT NULL DEFAULT 1,
  "precio_unitario"       numeric(15,2)      NOT NULL,
  "precio_actualizado_at" timestamptz,
  "orden"                 integer            NOT NULL DEFAULT 0,
  "is_active"             boolean            NOT NULL DEFAULT true,
  CONSTRAINT "item_costo_tipo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "item_costo_tipo_costo_tipo_equipo_id_fkey"
    FOREIGN KEY ("costo_tipo_equipo_id") REFERENCES "costo_tipo_equipo"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "item_costo_tipo_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON UPDATE CASCADE
);

CREATE INDEX "item_costo_tipo_perfil_clase_idx" ON "item_costo_tipo"("costo_tipo_equipo_id", "clase");
