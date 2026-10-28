import { expect, test, type Page } from '@playwright/test';
import { QA_COMPANY_ID } from '../../helpers/env';
import { STORAGE_PUBLIC_URL } from '../../helpers/equipment';
import { expectPublicUrlServes, objectInBucket, removeFromBucket } from '../../helpers/hse';
import { createInvoiceViaUi, ensureFixedSupplier, gotoPurchasingTab, openRowMenu, pdfFile, uniqueInvoiceNumber } from '../../helpers/purchasing';
import { clickHydrated } from '../../helpers/ui';

const BUCKET = 'purchase_invoices';

/** Ruta del objeto dentro del bucket a partir de su URL (pública o firmada). */
const pathOf = (url: string) => decodeURIComponent(new URL(url).pathname.split('/purchase-invoices/')[1]);

/**
 * Facturas de compra con PDF en el bucket `purchase-invoices`: alta con adjunto, vista desde el detalle, reemplazo, quitar el
 * adjunto, confirmar y eliminar. Eliminar la factura no borra su archivo del bucket (ver hallazgos): el test lo limpia.
 */
test.describe('compras: facturas de compra', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const number = uniqueInvoiceNumber();
  const fullNumber = `00001-${number}`;
  const file = pdfFile('factura-original');
  const replacement = pdfFile('factura-reemplazo');
  let invoiceId = '';
  const paths: string[] = [];
  let currentPath = '';

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      await removeFromBucket(page, BUCKET, paths);
    } finally {
      await context.close();
    }
  });

  /** URL firmada de "Ver PDF" en el detalle de una factura. */
  async function viewPdfUrlOf(page: Page, id: string) {
    await page.goto(`/dashboard/purchasing/invoices/${id}`);
    const link = page.getByRole('link', { name: 'Ver PDF' });
    await expect(link).toBeVisible();
    return (await link.getAttribute('href'))!;
  }
  const viewPdfUrl = (page: Page) => viewPdfUrlOf(page, invoiceId);

  test('alta de una factura con PDF la deja en el listado y el archivo en el bucket', async ({ page }) => {
    await ensureFixedSupplier(page);
    invoiceId = await createInvoiceViaUi(page, number, file);
    const panel = await gotoPurchasingTab(page, 'invoices');
    const row = panel.getByRole('row').filter({ hasText: fullNumber });
    await expect(row).toContainText('Borrador');
    await expect(row).toContainText('QA-E2E-Proveedor');

    const href = await viewPdfUrl(page);
    currentPath = pathOf(href);
    paths.push(currentPath);
    expect(currentPath).toMatch(new RegExp(`^${QA_COMPANY_ID}/${invoiceId}/.+\\.pdf$`));
    await expect.poll(() => objectInBucket(page, BUCKET, currentPath), { timeout: 20_000 }).toBe(true);
  });

  test('el PDF se sirve con el mismo contenido por la URL pública y por la URL firmada del detalle', async ({ page }) => {
    await expectPublicUrlServes(page, `${STORAGE_PUBLIC_URL}/purchase-invoices/${currentPath}`, file.buffer);
    const signed = await page.request.get(await viewPdfUrl(page));
    expect(signed.status()).toBe(200);
    expect((await signed.body()).equals(file.buffer)).toBe(true);
  });

  test('reemplazar el adjunto desde el detalle borra el anterior y sirve el nuevo', async ({ page }) => {
    await viewPdfUrl(page);
    const previous = currentPath;
    await page.locator('input[type=file]').setInputFiles(replacement);
    await expect(page.getByText('Adjunto reemplazado').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver PDF' })).toBeVisible();
    currentPath = pathOf(await viewPdfUrl(page));
    paths.push(currentPath);
    expect(currentPath).not.toBe(previous);
    await expect.poll(() => objectInBucket(page, BUCKET, previous), { timeout: 20_000 }).toBe(false);
    await expectPublicUrlServes(page, `${STORAGE_PUBLIC_URL}/purchase-invoices/${currentPath}`, replacement.buffer);
  });

  test('quitar el adjunto lo borra del bucket y la factura queda sin archivo', async ({ page }) => {
    await viewPdfUrl(page);
    page.once('dialog', (dialog) => void dialog.accept());
    await clickHydrated(page.getByRole('button', { name: 'Quitar' }));
    await expect(page.getByText('Adjunto eliminado').first()).toBeVisible();
    await expect(page.getByText('Esta factura no tiene adjunto.')).toBeVisible();
    await expect.poll(() => objectInBucket(page, BUCKET, currentPath), { timeout: 20_000 }).toBe(false);
  });

  test('la factura se puede confirmar y después eliminar desde el listado', async ({ page }) => {
    const panel = await gotoPurchasingTab(page, 'invoices');
    const row = () => panel.getByRole('row').filter({ hasText: fullNumber });
    let menu = await openRowMenu(page, row());
    await menu.getByRole('menuitem', { name: 'Confirmar' }).click();
    await expect(page.getByText('Factura confirmada').first()).toBeVisible();
    await expect(row()).toContainText('Confirmada');

    menu = await openRowMenu(page, row());
    await menu.getByRole('menuitem', { name: 'Eliminar' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(row()).toHaveCount(0);
  });

  // H-36: `deletePurchaseInvoice` borra la factura pero no su PDF: el objeto queda huérfano en `purchase-invoices`. Igual que producción: no se cambia.
  test.fixme('eliminar una factura con adjunto borra también el PDF del bucket (H-36)', async ({ page }) => {
    const other = uniqueInvoiceNumber();
    const id = await createInvoiceViaUi(page, other, pdfFile('factura-huerfana'));
    const path = pathOf(await viewPdfUrlOf(page, id));
    paths.push(path);
    const panel = await gotoPurchasingTab(page, 'invoices');
    const menu = await openRowMenu(page, panel.getByRole('row').filter({ hasText: `00001-${other}` }));
    await menu.getByRole('menuitem', { name: 'Eliminar' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(panel.getByRole('row').filter({ hasText: `00001-${other}` })).toHaveCount(0);
    await expect.poll(() => objectInBucket(page, BUCKET, path), { timeout: 20_000 }).toBe(false);
  });
});
