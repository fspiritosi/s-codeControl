import { expect, test, type Page } from '@playwright/test';
import { QA_COMPANY_ID, uniq } from '../../helpers/env';
import { STORAGE_PUBLIC_URL } from '../../helpers/equipment';
import { objectInBucket, removeFromBucket } from '../../helpers/hse';
import { FIXED_SUPPLIER, createPurchaseOrderViaUi, ensureFixedSupplier, gotoPurchasingTab, openRowMenu, pdfFile } from '../../helpers/purchasing';
import { clickHydrated, hydrated } from '../../helpers/ui';

const BUCKET = 'purchase_orders';

/**
 * "Ver" abre la URL firmada del adjunto con `window.open`: se captura la URL en vez de seguir la pestaña nueva (que puede ser una descarga).
 */
async function openedSignedUrl(page: Page): Promise<string> {
  type Win = { __opened: string[] };
  await page.evaluate(() => {
    (window as unknown as Win).__opened = [];
    window.open = (url) => {
      (window as unknown as Win).__opened.push(String(url));
      return null;
    };
  });
  await clickHydrated(page.getByRole('button', { name: 'Ver', exact: true }));
  await expect.poll(() => page.evaluate(() => (window as unknown as Win).__opened.length)).toBe(1);
  return page.evaluate(() => (window as unknown as Win).__opened[0]);
}

/** Ruta del objeto en el bucket privado a partir de la URL firmada. */
const objectPathOfSigned = (url: string) => decodeURIComponent(new URL(url).pathname.split('/purchase-orders/')[1]);

/**
 * Órdenes de compra: alta, adjunto en el bucket PRIVADO `purchase-orders` (URL firmada desde la app), flujo de estados y baja.
 * Las órdenes aprobadas o canceladas no se pueden eliminar: la del flujo de estados queda "Cancelada" (ver hallazgos).
 * El proveedor fijo no tiene email, así que aprobar no envía ningún mail.
 */
test.describe('compras: órdenes de compra', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const file = pdfFile('oc-adjunto');
  const lineA = uniq('LineaOC-A');
  const lineB = uniq('LineaOC-B');
  let orderA = '';
  let orderB = '';
  let objectPath = '';
  let signedUrl = '';

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      if (objectPath) await removeFromBucket(page, BUCKET, [objectPath]);
    } finally {
      await context.close();
    }
  });

  test('alta de una orden de compra la muestra en el listado como borrador', async ({ page }) => {
    await ensureFixedSupplier(page);
    orderA = await createPurchaseOrderViaUi(page, lineA);
    await expect(page.getByText('Borrador').first()).toBeVisible();
    await expect(page.getByText(FIXED_SUPPLIER).first()).toBeVisible();
    await expect(page.getByText('$1210.00').first()).toBeVisible();
  });

  test('un adjunto queda en el bucket privado y se abre con una URL firmada con el mismo contenido', async ({ page }) => {
    await page.goto(`/dashboard/purchasing/orders/${orderA}`);
    const upload = page.locator('input[type=file]');
    await upload.setInputFiles(file);
    await expect(page.getByText('Adjuntos actualizados').first()).toBeVisible();
    await expect(page.getByText(file.name)).toBeVisible();

    signedUrl = await openedSignedUrl(page);
    expect(signedUrl).toContain(STORAGE_PUBLIC_URL);
    const url = new URL(signedUrl);
    expect(url.pathname).toContain('/purchase-orders/');
    objectPath = objectPathOfSigned(signedUrl);
    expect(objectPath).toMatch(new RegExp(`^${QA_COMPANY_ID}/${orderA}/.+\\.pdf$`));

    await expect.poll(() => objectInBucket(page, BUCKET, objectPath), { timeout: 20_000 }).toBe(true);
    // La URL firmada sirve el mismo contenido; la misma ruta sin firma no se puede leer (bucket privado).
    const signed = await page.request.get(signedUrl);
    expect(signed.status()).toBe(200);
    expect((await signed.body()).equals(file.buffer)).toBe(true);
    const unsigned = await page.request.get(`${STORAGE_PUBLIC_URL}/purchase-orders/${objectPath}`);
    expect(unsigned.status()).not.toBe(200);
  });

  test('eliminar el adjunto lo borra del listado y del bucket', async ({ page }) => {
    await page.goto(`/dashboard/purchasing/orders/${orderA}`);
    await expect(page.getByText(file.name)).toBeVisible();
    page.once('dialog', (dialog) => void dialog.accept());
    await clickHydrated(page.getByRole('button', { name: 'Eliminar', exact: true }));
    await expect(page.getByText('Adjunto eliminado').first()).toBeVisible();
    await expect(page.getByText('No hay documentos adjuntos.')).toBeVisible();
    await expect.poll(() => objectInBucket(page, BUCKET, objectPath), { timeout: 20_000 }).toBe(false);
    objectPath = '';
  });

  test('una orden en borrador se puede eliminar desde el listado', async ({ page }) => {
    const panel = await gotoPurchasingTab(page, 'orders');
    const row = panel.locator(`tr:has(a[href$="/orders/${orderA}"])`);
    const menu = await openRowMenu(page, row);
    await menu.getByRole('menuitem', { name: 'Eliminar' }).click();
    await expect(page.getByText('Orden eliminada').first()).toBeVisible();
    await expect(panel.locator(`tr:has(a[href$="/orders/${orderA}"])`)).toHaveCount(0);
  });

  async function actionButton(page: Page, name: string) {
    const button = page.getByRole('button', { name });
    await hydrated(button);
    await button.click();
  }

  test('flujo de estados: enviar a aprobación, aprobar y cancelar', async ({ page }) => {
    orderB = await createPurchaseOrderViaUi(page, lineB);
    await actionButton(page, 'Enviar a aprobación');
    await expect(page.getByText('Enviada a aprobación').first()).toBeVisible();
    await expect(page.getByText('Pendiente de aprobación').first()).toBeVisible();
    await actionButton(page, 'Aprobar');
    await expect(page.getByText(/OC aprobada\. El proveedor no tiene email/).first()).toBeVisible();
    await expect(page.getByText('Aprobada', { exact: true }).first()).toBeVisible();
    await actionButton(page, 'Cancelar');
    await expect(page.getByText('Cancelada', { exact: true }).first()).toBeVisible();
  });

  // H-37: `deletePurchaseOrder` borra la orden (y sus adjuntos en la base, por cascada) pero no los archivos: quedan huérfanos en `purchase-orders`. Igual que producción: no se cambia.
  test.fixme('eliminar una orden con adjunto borra también el archivo del bucket (H-37)', async ({ page }) => {
    const id = await createPurchaseOrderViaUi(page, uniq('LineaOC-C'));
    await page.locator('input[type=file]').setInputFiles(file);
    await expect(page.getByText('Adjuntos actualizados').first()).toBeVisible();
    const path = objectPathOfSigned(await openedSignedUrl(page));
    const panel = await gotoPurchasingTab(page, 'orders');
    const menu = await openRowMenu(page, panel.locator(`tr:has(a[href$="/orders/${id}"])`));
    await menu.getByRole('menuitem', { name: 'Eliminar' }).click();
    await expect(page.getByText('Orden eliminada').first()).toBeVisible();
    await expect.poll(() => objectInBucket(page, BUCKET, path), { timeout: 20_000 }).toBe(false);
  });
});
