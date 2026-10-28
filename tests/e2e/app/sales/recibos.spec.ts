import { expect, test, type Page } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { openRowMenu, pickSearchable } from '../../helpers/purchasing';
import { FIXED_CUSTOMER, SALES_URL, createSalesInvoiceViaUi, ensureFixedCustomer, ensureFixedPointOfSale, expectPdfBody } from '../../helpers/sales';
import { clickHydrated, hydrated } from '../../helpers/ui';

/**
 * Ventas > Recibos de cobro: se crea y confirma una factura de venta, se la cobra con un recibo (borrador, confirmación, PDF,
 * anulación) y se comprueba el efecto sobre el estado de la factura y la cuenta corriente. Los medios de pago del recibo son solo
 * informativos (no tocan caja ni banco). El PDF no se guarda en ningún bucket: se genera al pedirlo (`/api/sales/receipts/:id/pdf`).
 */
test.describe('ventas: recibos de cobro', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const line = uniq('linea-recibo');
  let invoiceId = '';
  let invoiceNumber = '';
  let receiptId = '';
  let receiptNumber = '';
  /** Recibos creados por la prueba (para limpiar los que queden en borrador o confirmados). */
  const receiptNumbers: string[] = [];

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      for (const number of receiptNumbers) await cleanupReceipt(page, number);
      if (invoiceId) await cleanupInvoice(page, invoiceId);
    } finally {
      await context.close();
    }
  });

  /** Anula el recibo si está confirmado o lo elimina si está en borrador; si ya está anulado o no existe, no hace nada. */
  async function cleanupReceipt(page: Page, number: string) {
    await page.goto(`${SALES_URL}/receipts`);
    await expect(page.getByRole('table')).toBeVisible();
    const row = page.getByRole('row').filter({ hasText: number });
    if (!(await row.isVisible({ timeout: 3_000 }).catch(() => false))) return;
    const menu = await openRowMenu(page, row);
    const cancel = menu.getByRole('menuitem', { name: 'Anular' });
    const del = menu.getByRole('menuitem', { name: 'Eliminar' });
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Anular' }).click();
      await expect(page.getByText('Recibo anulado').first()).toBeVisible();
    } else if (await del.isVisible().catch(() => false)) {
      await del.click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
      await expect(page.getByText('Recibo eliminado').first()).toBeVisible();
    }
  }

  async function cleanupInvoice(page: Page, id: string) {
    await page.goto(`${SALES_URL}/invoices/${id}`);
    const cancel = page.getByRole('button', { name: 'Anular' });
    if (await cancel.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await cancel.click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Anular' }).click();
      await expect(page.getByText('Factura anulada').first()).toBeVisible();
    }
  }

  /** Abre el diálogo "Nuevo recibo", elige el cliente fijo, tilda la factura y crea el recibo (importe = saldo de la factura). */
  async function createReceiptViaUi(page: Page) {
    await page.goto(`${SALES_URL}/receipts`);
    await clickHydrated(page.getByRole('button', { name: 'Nuevo recibo' }));
    const dialog = page.getByRole('dialog', { name: 'Nuevo recibo de cobro' });
    await pickSearchable(page, dialog.getByRole('combobox').first(), new RegExp(FIXED_CUSTOMER));
    const card = dialog.locator('div.rounded-lg.border').filter({ hasText: invoiceNumber });
    await card.getByRole('checkbox').click();
    await expect(card.getByRole('spinbutton')).toHaveValue('1210.00');
    await dialog.getByRole('button', { name: 'Crear recibo' }).click();
    await expect(page.getByText('Recibo creado').first()).toBeVisible();
    await expect(dialog).toBeHidden();
  }

  test('con una factura confirmada, "Nuevo recibo" crea el recibo en borrador', async ({ page }) => {
    await ensureFixedPointOfSale(page);
    await ensureFixedCustomer(page);
    invoiceId = await createSalesInvoiceViaUi(page, line, 1000);
    await clickHydrated(page.getByRole('button', { name: 'Confirmar' }));
    await expect(page.getByText('Factura confirmada').first()).toBeVisible();
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText(/^09901-\d{8}$/);
    invoiceNumber = (await heading.textContent())!;

    await createReceiptViaUi(page);
    const row = page.getByRole('row').filter({ hasText: FIXED_CUSTOMER }).first();
    await expect(row).toContainText('Borrador');
    receiptNumber = (await row.getByRole('cell').first().textContent())!.trim();
    expect(receiptNumber).toMatch(/^R-\d{8}$/);
    receiptNumbers.push(receiptNumber);
  });

  test('confirmar el recibo deja la factura cobrada y se puede ver su detalle', async ({ page }) => {
    await page.goto(`${SALES_URL}/receipts`);
    const row = page.getByRole('row').filter({ hasText: receiptNumber });
    const menu = await openRowMenu(page, row);
    await menu.getByRole('menuitem', { name: 'Confirmar' }).click();
    await expect(page.getByText('Recibo confirmado').first()).toBeVisible();
    await page.goto(`${SALES_URL}/receipts`);
    await expect(row).toContainText('Confirmado');

    await clickHydrated(row.getByRole('button', { name: receiptNumber }).or(row.getByText(receiptNumber)).first());
    const detail = page.getByRole('dialog', { name: 'Detalle del recibo de cobro' });
    await expect(detail).toContainText(invoiceNumber);
    await expect(detail).toContainText(FIXED_CUSTOMER);
    await page.keyboard.press('Escape');

    await page.goto(`${SALES_URL}/invoices/${invoiceId}`);
    await expect(page.getByText('Cobrada', { exact: true })).toBeVisible();
    await expect(page.getByText(receiptNumber).first()).toBeVisible();
  });

  test('el PDF del recibo se genera', async ({ page }) => {
    // El listado no enlaza el recibo: su id se lee de los datos que el servidor envía a la tabla (`"id":...,"full_number":"R-..."`).
    await page.goto(`${SALES_URL}/receipts`);
    await expect(page.getByRole('row').filter({ hasText: receiptNumber })).toBeVisible();
    const html = (await page.content()).replace(/\\"/g, '"');
    receiptId = new RegExp(`"id":"([0-9a-f-]{36})","company_id":"[^"]+","customer_id":"[^"]+","number":\\d+,"full_number":"${receiptNumber}"`).exec(html)?.[1] ?? '';
    expect(receiptId, 'no se encontró el id del recibo en la página').not.toBe('');
    const pdf = await page.request.get(`/api/sales/receipts/${receiptId}/pdf`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()['content-type']).toBe('application/pdf');
    expectPdfBody(await pdf.body());
  });

  test('anular el recibo devuelve la factura a confirmada', async ({ page }) => {
    await page.goto(`${SALES_URL}/receipts`);
    const row = page.getByRole('row').filter({ hasText: receiptNumber });
    const menu = await openRowMenu(page, row);
    await menu.getByRole('menuitem', { name: 'Anular' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Anular' }).click();
    await expect(page.getByText('Recibo anulado').first()).toBeVisible();
    await page.goto(`${SALES_URL}/receipts`);
    await expect(row).toContainText('Anulado');
    await page.goto(`${SALES_URL}/invoices/${invoiceId}`);
    // Durante el refresco de la ruta el estado puede estar dos veces en el DOM: alcanza con que haya uno.
    await expect(page.getByText('Confirmada', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Cobrada', { exact: true })).toHaveCount(0);
  });

  test('un recibo en borrador se elimina desde el menú de la fila', async ({ page }) => {
    await createReceiptViaUi(page);
    const row = page.getByRole('row').filter({ hasText: FIXED_CUSTOMER }).filter({ hasText: 'Borrador' }).first();
    const number = (await row.getByRole('cell').first().textContent())!.trim();
    receiptNumbers.push(number);
    const menu = await openRowMenu(page, row);
    await menu.getByRole('menuitem', { name: 'Eliminar' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Recibo eliminado').first()).toBeVisible();
    await page.goto(`${SALES_URL}/receipts`);
    await hydrated(page.getByRole('button', { name: 'Nuevo recibo' }));
    await expect(page.getByRole('row').filter({ hasText: number })).toHaveCount(0);
  });
});
