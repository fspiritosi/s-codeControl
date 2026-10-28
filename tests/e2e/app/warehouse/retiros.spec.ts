import { expect, test, type Page } from '@playwright/test';
import { uniq } from '../../helpers/env';
import {
  FIXED_WAREHOUSE_A,
  adjustStockViaUi,
  createProductViaUi,
  deactivateProductIfActive,
  ensureWarehouse,
  gotoWarehouseTab,
  openWarehouseStock,
  pickSearchable,
  stockRow,
} from '../../helpers/purchasing';
import { clickHydrated, hydrated } from '../../helpers/ui';

/**
 * Órdenes de retiro de materiales (ORM): alta, flujo borrador > pendiente > aprobada > completada (descuenta stock y genera el
 * movimiento) y cancelación. No se pueden eliminar: quedan "Completada" y "Cancelada" en la empresa QA E2E (ver hallazgos).
 * No hay mails: el flujo de aprobación de retiros no notifica a nadie.
 */
test.describe('almacenes: órdenes de retiro', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const product = uniq('ProdRetiro');
  const note = uniq('Retiro');
  let mainOrder = '';
  const warehouse = `${FIXED_WAREHOUSE_A.name} (${FIXED_WAREHOUSE_A.code})`;

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      await deactivateProductIfActive(page, product);
    } finally {
      await context.close();
    }
  });

  /** Crea una orden de retiro de `quantity` del producto desde el almacén A; deja el detalle de la orden abierto. */
  async function createWithdrawal(page: Page, quantity: number, notes: string): Promise<string> {
    await page.goto('/dashboard/warehouse/withdrawals/new');
    await hydrated(page.getByRole('button', { name: 'Crear orden de retiro' }));
    await pickSearchable(page, page.getByRole('combobox').first(), warehouse);
    await page.getByRole('textbox', { name: 'Notas' }).first().fill(notes);
    const line = page.getByRole('row').nth(1);
    await pickSearchable(page, line.getByRole('combobox'), new RegExp(product));
    await line.getByRole('spinbutton').fill(String(quantity));
    await page.getByRole('button', { name: 'Crear orden de retiro' }).click();
    await expect(page.getByText('Orden de retiro creada').first()).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/warehouse\?tab=withdrawals/);
    const first = page.getByRole('tabpanel').getByRole('link', { name: /^ORM-\d+/ }).first();
    await expect(first).toBeVisible();
    const id = (await first.getAttribute('href'))!.split('/').pop()!;
    await page.goto(`/dashboard/warehouse/withdrawals/${id}`);
    await expect(page.getByText(notes)).toBeVisible();
    await expect(page.getByText(product).first()).toBeVisible();
    return id;
  }

  async function action(page: Page, name: string, toast: string) {
    // El botón del paso siguiente aparece cuando termina el refresco de la pantalla; bajo carga puede tardar más que el timeout normal.
    await expect(page.getByRole('button', { name })).toBeVisible({ timeout: 30_000 });
    await clickHydrated(page.getByRole('button', { name }));
    await expect(page.getByText(toast).first()).toBeVisible();
  }

  test('alta de una orden de retiro la deja en borrador', async ({ page }) => {
    await createProductViaUi(page, product, 100);
    await ensureWarehouse(page, FIXED_WAREHOUSE_A);
    await adjustStockViaUi(page, FIXED_WAREHOUSE_A.name, product, 10, `Stock inicial ${note}`);

    mainOrder = await createWithdrawal(page, 3, note);
    await expect(page.getByText('Borrador', { exact: true }).first()).toBeVisible();
  });

  test('aprobar y completar el retiro descuenta el stock y genera el movimiento', async ({ page }) => {
    await page.goto(`/dashboard/warehouse/withdrawals/${mainOrder}`);
    await expect(page.getByText(note)).toBeVisible();

    await action(page, 'Enviar a aprobación', 'Enviada a aprobación');
    await expect(page.getByText('Pendiente', { exact: true }).first()).toBeVisible();
    await action(page, 'Aprobar', 'Aprobada');
    await expect(page.getByText('Aprobada', { exact: true }).first()).toBeVisible();
    await action(page, 'Completar retiro', 'Retiro completado');
    await expect(page.getByText('Completada', { exact: true }).first()).toBeVisible();

    await openWarehouseStock(page, FIXED_WAREHOUSE_A.name, product);
    await expect(stockRow(page, product).getByRole('cell').nth(3)).toHaveText('7');
    const movements = await gotoWarehouseTab(page, 'movements', product);
    const movement = movements.getByRole('row').filter({ hasText: 'Retiro' });
    await expect(movement.first()).toContainText('-3');
  });

  test('un retiro en borrador se puede cancelar', async ({ page }) => {
    await createWithdrawal(page, 1, `${note}-cancelar`);
    await action(page, 'Cancelar', 'Cancelada');
    await expect(page.getByText('Cancelada', { exact: true }).first()).toBeVisible();
  });
});
