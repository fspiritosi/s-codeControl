-- tsk-302 / tsk-303: Imputación de gastos a OC + adjuntos múltiples en OC.
-- Solo-ADD: no altera ni elimina datos existentes. Idempotente donde aplica.

-- ── Gastos → Orden de Compra (FK nullable) ──────────────────────────────────
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS purchase_order_id uuid REFERENCES purchase_orders(id);

CREATE INDEX IF NOT EXISTS idx_expenses_purchase_order_id
  ON expenses(purchase_order_id);

-- ── Adjuntos de Orden de Compra (1-N) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_order_attachments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  file_name         text NOT NULL,
  file_key          text NOT NULL,
  file_size         int,
  mime_type         text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_attachments_po
  ON purchase_order_attachments(purchase_order_id);

-- ── Bucket privado para adjuntos de OC ──────────────────────────────────────
-- Aislamiento por empresa garantizado vía path (companyId) en el código.
INSERT INTO storage.buckets (id, name, public)
VALUES ('purchase_orders', 'purchase_orders', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "purchase_orders_select_authenticated" ON storage.objects;
CREATE POLICY "purchase_orders_select_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'purchase_orders');

DROP POLICY IF EXISTS "purchase_orders_insert_authenticated" ON storage.objects;
CREATE POLICY "purchase_orders_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'purchase_orders');

DROP POLICY IF EXISTS "purchase_orders_update_authenticated" ON storage.objects;
CREATE POLICY "purchase_orders_update_authenticated"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'purchase_orders')
  WITH CHECK (bucket_id = 'purchase_orders');

DROP POLICY IF EXISTS "purchase_orders_delete_authenticated" ON storage.objects;
CREATE POLICY "purchase_orders_delete_authenticated"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'purchase_orders');
