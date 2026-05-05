-- COD-568: agregar tipo de producto (compra/venta) y margen de ganancia
-- Aditiva, idempotente, no destructiva. Defaults preservan comportamiento de productos existentes.

-- 1) Crear enum product_purchase_sale_type si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_purchase_sale_type') THEN
    CREATE TYPE product_purchase_sale_type AS ENUM ('PURCHASE', 'PURCHASE_SALE');
  END IF;
END
$$;

-- 2) Agregar columna purchase_sale_type a products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS purchase_sale_type product_purchase_sale_type NOT NULL DEFAULT 'PURCHASE_SALE';

-- 3) Agregar columna profit_margin_percent (nullable, aplica solo a PURCHASE_SALE)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS profit_margin_percent DECIMAL(7, 2);
