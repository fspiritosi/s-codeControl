-- Reescribe las URLs absolutas de Supabase Storage guardadas en la base hacia RustFS.
-- Uso: psql -v base='https://cc-s3.31.97.42.82.sslip.io' -f 03-storage-urls.sql
-- Los nombres de bucket cambian guion bajo por guion (S3 no admite "_"). Es idempotente.
BEGIN;
SELECT set_config('cc.base', :'base', true);

CREATE TEMP TABLE _buckets(old text, new text);
INSERT INTO _buckets VALUES
  ('document_files','document-files'), ('document_files_expired','document-files-expired'),
  ('documents-hse','documents-hse'), ('repair_images','repair-images'),
  ('training-materials','training-materials'), ('daily_reports','daily-reports'),
  ('logo','logo'), ('documents','documents'), ('purchase_invoices','purchase-invoices'),
  ('purchase_orders','purchase-orders'), ('costos-pdfs','costos-pdfs'),
  ('vehicle_photos','vehicle-photos'), ('employee_photos','employee-photos'), ('avatar','avatar');

DO $$
DECLARE
  col record; b record;
  src text := 'https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/';
  base text := current_setting('cc.base');
BEGIN
  FOR col IN VALUES ('profile','avatar'), ('training_materials','file_url'), ('vehicles','picture'),
                    ('employees','picture'), ('pdf_settings','signature_image_url'),
                    ('purchase_invoices','document_url'), ('company','company_logo')
  LOOP
    FOR b IN SELECT old, new FROM _buckets LOOP
      EXECUTE format('UPDATE public.%I SET %I = replace(%I, %L, %L) WHERE %I LIKE %L',
        col.column1, col.column2, col.column2, src || b.old || '/', rtrim(base,'/') || '/' || b.new || '/', col.column2, src || b.old || '/%');
    END LOOP;
  END LOOP;
END $$;

COMMIT;
