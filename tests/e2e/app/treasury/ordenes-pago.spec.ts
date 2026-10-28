import { expect, test, type Page } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { FIXED_SUPPLIER, ensureFixedSupplier } from '../../helpers/purchasing';
import { expectPdfBody } from '../../helpers/sales';
import {
  FIXED_RETENTION,
  TREASURY_URL,
  closeCashSession,
  createCashRegisterViaUi,
  createPaymentOrderViaUi,
  deactivateCashRegisterIfActive,
  ensureFixedRetentionType,
  gotoTreasuryTab,
  newCashCode,
  openCashRegisterDetail,
  openCashSession,
  orderNotes,
} from '../../helpers/treasury';
import { clickHydrated } from '../../helpers/ui';

/**
 * Tesorería > Órdenes de pago y Retenciones: una orden con retención se crea, edita, confirma (genera el egreso de caja y el
 * certificado de retención), se descarga su PDF y se marca como pagada; otra se confirma y se anula (reversa el egreso).
 * El pago de una orden envía un mail al proveedor: se usa solo el proveedor fijo (sin email), que la app informa como "no se envió".
 * Los PDF (de la orden y del certificado) no se guardan en ningún bucket: se generan al pedirlos.
 */
test.describe('tesorería: órdenes de pago y retenciones', () => {
  test.describe.configure({ mode: 'serial', timeout: 150_000 });
  test.use({ actionTimeout: 15_000 });

  const code = newCashCode();
  const note1 = uniq('op-ret');
  const note2 = uniq('op-anul');
  let cashId = '';
  let order1 = '';
  let order1Number = '';
  let order2 = '';
  let order2Number = '';
  let certificate = '';

  const detail = (page: Page, id: string) => page.goto(`${TREASURY_URL}/payment-orders/${id}`);
  const numberOf = async (page: Page) => (await page.getByRole('heading', { level: 1 }).textContent())!.trim();

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      // Una orden que quedó en borrador o confirmada se anula (la pagada es terminal); después se cierra la sesión y se desactiva la caja.
      for (const id of [order1, order2].filter(Boolean)) {
        await detail(page, id);
        const cancel = page.getByRole('button', { name: 'Anular' });
        if (await cancel.isVisible({ timeout: 4_000 }).catch(() => false)) {
          await cancel.click();
          await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click();
          await expect(page.getByText('Orden anulada').first()).toBeVisible();
        }
      }
      await openCashRegisterDetail(page, code).catch(() => undefined);
      if (await page.getByRole('button', { name: 'Cerrar sesión' }).isVisible({ timeout: 2_000 }).catch(() => false)) await closeCashSession(page);
      await deactivateCashRegisterIfActive(page, code);
    } finally {
      await context.close();
    }
  });

  test('preparar proveedor, retención y caja con sesión abierta; alta de una orden con retención', async ({ page }) => {
    await ensureFixedSupplier(page);
    await ensureFixedRetentionType(page);
    await createCashRegisterViaUi(page, code, uniq('Caja-OP'));
    cashId = await openCashRegisterDetail(page, code);
    await openCashSession(page, 10_000);

    order1 = await createPaymentOrderViaUi(page, { supplier: FIXED_SUPPLIER, amount: 1000, cashCode: code, notes: note1, withRetention: true });
    order1Number = await numberOf(page);
    await expect(page.getByText('Borrador', { exact: true })).toBeVisible();
    await expect(page.getByText(FIXED_SUPPLIER).first()).toBeVisible();
    await expect(page.getByText(note1).first()).toBeVisible();
    const retentions = page.getByRole('row').filter({ hasText: FIXED_RETENTION.name });
    await expect(retentions).toContainText('2%');
    await expect(retentions).toContainText('$20.00');
  });

  test('el PDF de la orden se genera', async ({ page }) => {
    await detail(page, order1);
    await expect(page.getByRole('link', { name: 'Descargar PDF' })).toHaveAttribute('href', `/api/payment-orders/${order1}/pdf`);
    const pdf = await page.request.get(`/api/payment-orders/${order1}/pdf`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()['content-type']).toBe('application/pdf');
    expect(pdf.headers()['content-disposition']).toContain('.pdf');
    expectPdfBody(await pdf.body());
  });

  test('editar el borrador cambia sus notas', async ({ page }) => {
    await detail(page, order1);
    await clickHydrated(page.getByRole('link', { name: 'Editar' }));
    await expect(page).toHaveURL(/\/edit$/);
    const notes = orderNotes(page);
    await expect(notes).toHaveValue(note1);
    await notes.fill(`${note1}-ed`);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Orden de pago actualizada').first()).toBeVisible();
    await expect(page.getByText(`${note1}-ed`).first()).toBeVisible();
  });

  test('confirmar genera el egreso en la caja y el certificado de retención', async ({ page }) => {
    await detail(page, order1);
    await clickHydrated(page.getByRole('button', { name: 'Confirmar' }));
    await expect(page.getByText('Orden confirmada').first()).toBeVisible();
    await expect(page.getByText('Confirmada', { exact: true })).toBeVisible();
    const link = page.getByRole('row').filter({ hasText: FIXED_RETENTION.name }).getByRole('link', { name: /^\d{8}$/ });
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    certificate = href!;
    const pdf = await page.request.get(certificate);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()['content-type']).toBe('application/pdf');
    expectPdfBody(await pdf.body());

    await page.goto(`${TREASURY_URL}/cash-registers/${cashId}`);
    const movement = page.getByRole('row').filter({ hasText: `Orden de pago ${order1Number}` });
    await expect(movement).toContainText('$980.00');
    await expect(page.getByText('$9020.00').first()).toBeVisible();
  });

  test('la retención aparece en la pestaña Retenciones con su certificado', async ({ page }) => {
    const panel = await gotoTreasuryTab(page, 'retentions');
    const row = panel.getByRole('row').filter({ hasText: order1Number });
    await expect(row).toContainText(FIXED_RETENTION.name);
    await expect(row).toContainText('2%');
    await expect(row.getByRole('link', { name: /^\d{8}$/ })).toHaveAttribute('href', certificate);
  });

  test('marcar como pagada deja la orden pagada y avisa que el proveedor no tiene email', async ({ page }) => {
    await detail(page, order1);
    await clickHydrated(page.getByRole('button', { name: 'Marcar como Pagada' }));
    await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText(/no tiene email cargado, no se envió notificación/).first()).toBeVisible();
    await expect(page.getByText('Pagada', { exact: true })).toBeVisible();
    // Una orden pagada es terminal: no se puede anular.
    await expect(page.getByRole('button', { name: 'Anular' })).toHaveCount(0);
  });

  test('anular una orden confirmada repone el efectivo de la caja', async ({ page }) => {
    order2 = await createPaymentOrderViaUi(page, { supplier: FIXED_SUPPLIER, amount: 500, cashCode: code, notes: note2 });
    order2Number = await numberOf(page);
    await clickHydrated(page.getByRole('button', { name: 'Confirmar' }));
    await expect(page.getByText('Orden confirmada').first()).toBeVisible();
    await page.goto(`${TREASURY_URL}/cash-registers/${cashId}`);
    await expect(page.getByText('$8520.00').first()).toBeVisible();

    await detail(page, order2);
    await clickHydrated(page.getByRole('button', { name: 'Anular' }));
    await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText('Orden anulada').first()).toBeVisible();
    await expect(page.getByText('Anulada', { exact: true })).toBeVisible();
    await page.goto(`${TREASURY_URL}/cash-registers/${cashId}`);
    await expect(page.getByText('$9020.00').first()).toBeVisible();
  });

  test('el listado de órdenes muestra la pagada y la anulada con su estado', async ({ page }) => {
    const panel = await gotoTreasuryTab(page, 'payment-orders');
    await expect(panel.getByRole('row').filter({ hasText: order1Number })).toContainText('Pagada');
    await expect(panel.getByRole('row').filter({ hasText: order2Number })).toContainText('Anulada');
  });
});
