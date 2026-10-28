import { expect, test, type Page } from '@playwright/test';
import { createInvoiceViaUi, ensureFixedSupplier, gotoPurchasingTab, openRowMenu, pickSelect, uniqueInvoiceNumber } from '../../helpers/purchasing';
import { TREASURY_URL, gotoTreasuryTab } from '../../helpers/treasury';
import { clickHydrated, hydrated } from '../../helpers/ui';

/**
 * Tesorería > Saldos pendientes: una factura de compra confirmada aparece con su saldo, se arma una orden de pago desde la
 * selección (queda "Programada" mientras la orden está en borrador) y al anular la orden la factura vuelve a "Sin OP".
 * La orden no se confirma ni se paga (no toca caja ni manda mails); la factura de prueba se elimina al terminar.
 */
test.describe('tesorería: saldos pendientes', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const number = uniqueInvoiceNumber();
  const fullNumber = `00001-${number}`;
  let orderId = '';
  let orderNumber = '';

  /** Pestaña de saldos filtrada por el número de la factura de prueba (los saldos de otras corridas se acumulan). */
  async function pendingRow(page: Page) {
    const panel = await gotoTreasuryTab(page, 'pending-balances');
    await hydrated(panel.getByRole('button', { name: 'Aplicar' }));
    await panel.getByRole('textbox').fill(fullNumber);
    await panel.getByRole('button', { name: 'Aplicar' }).click();
    return panel.getByRole('row').filter({ hasText: fullNumber });
  }

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      if (orderId) {
        await page.goto(`${TREASURY_URL}/payment-orders/${orderId}`);
        const cancel = page.getByRole('button', { name: 'Anular' });
        if (await cancel.isVisible({ timeout: 4_000 }).catch(() => false)) {
          await cancel.click();
          await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click();
          await expect(page.getByText('Orden anulada').first()).toBeVisible();
        }
      }
      const panel = await gotoPurchasingTab(page, 'invoices', fullNumber);
      const row = panel.getByRole('row').filter({ hasText: fullNumber });
      if (await row.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const menu = await openRowMenu(page, row);
        const del = menu.getByRole('menuitem', { name: 'Eliminar' });
        if (await del.isVisible().catch(() => false)) {
          await del.click();
          await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
          await expect(row).toHaveCount(0);
        }
      }
    } finally {
      await context.close();
    }
  });

  test('una factura de compra confirmada aparece con su saldo y sin orden de pago', async ({ page }) => {
    await ensureFixedSupplier(page);
    await createInvoiceViaUi(page, number);
    const panel = await gotoPurchasingTab(page, 'invoices', fullNumber);
    const menu = await openRowMenu(page, panel.getByRole('row').filter({ hasText: fullNumber }));
    await menu.getByRole('menuitem', { name: 'Confirmar' }).click();
    await expect(page.getByText('Factura confirmada').first()).toBeVisible();

    const row = await pendingRow(page);
    await expect(row).toBeVisible();
    await expect(row).toContainText('QA-E2E-Proveedor');
    await expect(row).toContainText('Sin OP');
    await expect(row).toContainText('1.210,00');
  });

  test('crear la orden de pago desde la selección deja la factura programada', async ({ page }) => {
    const row = await pendingRow(page);
    // Al aplicar el filtro la tabla se vuelve a dibujar y puede perder la selección: se marca hasta que aparece la barra de acción.
    const checkbox = row.getByRole('checkbox');
    const create = page.getByRole('button', { name: 'Crear orden de pago' });
    await expect(async () => {
      if ((await checkbox.getAttribute('data-state', { timeout: 2_000 })) !== 'checked') await checkbox.click({ timeout: 2_000 });
      await expect(create).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await create.click();
    await expect(page).toHaveURL(/\/dashboard\/treasury\/payment-orders\/new/);
    await expect(page.getByText(fullNumber).first()).toBeVisible();

    const payment = page.locator('div.rounded-md.border.p-3').filter({ hasText: 'Pago #1' });
    await pickSelect(page, payment.getByRole('combobox').first(), 'Cuenta corriente');
    await page.getByRole('button', { name: /Cargar saldo pendiente/ }).click();
    await page.getByRole('button', { name: 'Crear orden' }).click();
    await expect(page.getByText('Orden de pago creada').first()).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/treasury\/payment-orders\/[0-9a-f-]{36}$/);
    orderId = page.url().split('/').pop()!;
    orderNumber = (await page.getByRole('heading', { level: 1 }).textContent())!.trim();
    await expect(page.getByText(fullNumber).first()).toBeVisible();

    await expect(await pendingRow(page)).toContainText(`Programada · ${orderNumber}`);
  });

  test('anular la orden en borrador devuelve la factura a "Sin OP"', async ({ page }) => {
    await page.goto(`${TREASURY_URL}/payment-orders/${orderId}`);
    await clickHydrated(page.getByRole('button', { name: 'Anular' }));
    await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText('Orden anulada').first()).toBeVisible();
    const row = await pendingRow(page);
    await expect(row).toContainText('Sin OP');
  });
});
