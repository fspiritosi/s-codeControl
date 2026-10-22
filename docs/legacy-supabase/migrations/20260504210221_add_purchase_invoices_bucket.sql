-- COD-457: Bucket privado para adjuntos de Facturas de Compra (1-1).
-- Idempotente: usa ON CONFLICT y DROP POLICY IF EXISTS antes de crearlas.

INSERT INTO storage.buckets (id, name, public)
VALUES ('purchase_invoices', 'purchase_invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Policies: acceso restringido a usuarios autenticados.
-- El aislamiento por empresa se garantiza via path en el código (companyId en el path).
DROP POLICY IF EXISTS "purchase_invoices_select_authenticated" ON storage.objects;
CREATE POLICY "purchase_invoices_select_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'purchase_invoices');

DROP POLICY IF EXISTS "purchase_invoices_insert_authenticated" ON storage.objects;
CREATE POLICY "purchase_invoices_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'purchase_invoices');

DROP POLICY IF EXISTS "purchase_invoices_update_authenticated" ON storage.objects;
CREATE POLICY "purchase_invoices_update_authenticated"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'purchase_invoices')
  WITH CHECK (bucket_id = 'purchase_invoices');

DROP POLICY IF EXISTS "purchase_invoices_delete_authenticated" ON storage.objects;
CREATE POLICY "purchase_invoices_delete_authenticated"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'purchase_invoices');
