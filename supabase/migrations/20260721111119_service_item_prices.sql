-- Historial de precios por período (mes/año) por ítem de servicio + precio habilitado (tsk-511).
CREATE TABLE "service_item_prices" (
  "id"              uuid          NOT NULL DEFAULT gen_random_uuid(),
  "service_item_id" uuid          NOT NULL,
  "price"           numeric(12,2) NOT NULL,
  "period_month"    integer,
  "period_year"     integer,
  "is_enabled"      boolean       NOT NULL DEFAULT false,
  "notes"           text,
  "created_at"      timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT "service_item_prices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_item_prices_service_item_id_fkey"
    FOREIGN KEY ("service_item_id") REFERENCES "service_items"("id") ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX "service_item_prices_service_item_idx" ON "service_item_prices"("service_item_id");

-- Backfill: por cada ítem existente, crear su precio actual como habilitado (sin período),
-- si todavía no tiene precios cargados. Idempotente.
INSERT INTO "service_item_prices" ("service_item_id", "price", "is_enabled")
SELECT si."id", si."item_price"::numeric(12,2), true
FROM "service_items" si
WHERE NOT EXISTS (SELECT 1 FROM "service_item_prices" p WHERE p."service_item_id" = si."id");
