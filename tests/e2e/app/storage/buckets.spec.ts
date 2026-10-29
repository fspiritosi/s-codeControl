import { expect, test, type APIRequestContext } from '@playwright/test';
import { PREFIX } from '../../helpers/env';

// Un ciclo completo por bucket vía /api/storage (la misma ruta que usa la app): subir, listar, bajar, URL pública o firmada y borrar.
const BUCKETS = [
  'document_files', 'document_files_expired', 'documents-hse', 'repair_images', 'training-materials', 'daily_reports', 'logo',
  'documents', 'purchase_invoices', 'purchase_orders', 'sales_invoices', 'receipts', 'costos-pdfs', 'vehicle_photos', 'employee_photos', 'avatar',
];
const PRIVATE = ['costos-pdfs', 'purchase_orders'];
const STORAGE_PUBLIC = process.env.E2E_STORAGE_URL ?? 'https://cc-s3.31.97.42.82.sslip.io';

const post = (request: APIRequestContext, form: Record<string, string | { name: string; mimeType: string; buffer: Buffer }>) =>
  request.post('/api/storage', { multipart: form });

// H-54: sales_invoices y receipts figuran en el código pero no existen ni en Supabase prod ni en el clon: subir falla igual que en producción.
const MISSING_IN_PROD = ['sales_invoices', 'receipts'];

for (const bucket of BUCKETS) {
  const t = MISSING_IN_PROD.includes(bucket) ? test.fixme : test;
  t(`bucket ${bucket}: subir, listar, bajar, URL y borrar`, async ({ request }) => {
    const dir = `${PREFIX}bucket-${Date.now().toString(36)}`;
    const path = `${dir}/archivo.txt`;
    const content = `contenido ${bucket} ${Date.now()}`;
    try {
      const up = await post(request, {
        op: 'upload', bucket, path, options: JSON.stringify({ contentType: 'text/plain', upsert: true }),
        file: { name: 'archivo.txt', mimeType: 'text/plain', buffer: Buffer.from(content) },
      });
      expect(up.status(), await up.text()).toBe(200);

      const list = await post(request, { op: 'list', bucket, path: dir, options: '{}' });
      expect(list.status()).toBe(200);
      expect(JSON.stringify(await list.json())).toContain('archivo.txt');

      const down = await request.get(`/api/storage?bucket=${bucket}&path=${encodeURIComponent(path)}`);
      expect(down.status()).toBe(200);
      expect(await down.text()).toBe(content);

      if (PRIVATE.includes(bucket)) {
        const signed = await post(request, { op: 'signed-url', bucket, path, expiresIn: '120' });
        expect(signed.status()).toBe(200);
        const { url } = await signed.json();
        expect((await request.get(url)).status()).toBe(200);
        expect((await request.get(`${STORAGE_PUBLIC}/${bucket.replace(/_/g, '-')}/${path}`)).status()).not.toBe(200);
      } else {
        const pub = await request.get(`${STORAGE_PUBLIC}/${bucket.replace(/_/g, '-')}/${path}`);
        expect(pub.status()).toBe(200);
        expect(await pub.text()).toBe(content);
      }
    } finally {
      const del = await post(request, { op: 'remove', bucket, paths: JSON.stringify([path]) });
      expect(del.status()).toBe(200);
    }
    const gone = await request.get(`/api/storage?bucket=${bucket}&path=${encodeURIComponent(path)}`);
    expect(gone.status()).toBe(404);
  });
}
