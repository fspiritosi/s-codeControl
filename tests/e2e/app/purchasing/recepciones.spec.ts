import { expect, test } from '@playwright/test';
import { uniq } from '../../helpers/env';
import {
  FIXED_WAREHOUSE_A,
  createProductViaUi,
  deactivateProductIfActive,
  ensureFixedSupplier,
  ensureWarehouse,
  gotoPurchasingTab,
  openRowMenu,
  openWarehouseStock,
  pickSearchable,
  pickSelect,
  stockRow,
  FIXED_SUPPLIER,
} from '../../helpers/purchasing';
import { hydrated } from '../../helpers/ui';

/**
 * Remitos de recepción: alta manual (proveedor, almacén, producto y cantidad), confirmación (ingresa el stock al almacén) y
 * cancelación (revierte el stock). Un remito no se puede eliminar: queda "Anulado" en la empresa QA E2E (ver hallazgos).
 */
test.describe('compras: remitos de recepción', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const product = uniq('ProdRemito');
  let number = '';

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      await deactivateProductIfActive(page, product);
    } finally {
      await context.close();
    }
  });

  test('alta de un remito lo deja en el listado como borrador', async ({ page }) => {
    await ensureFixedSupplier(page);
    await ensureWarehouse(page, FIXED_WAREHOUSE_A);
    await createProductViaUi(page, product, 100);

    await page.goto('/dashboard/purchasing/receiving/new');
    await hydrated(page.getByRole('button', { name: 'Crear remito' }));
    await pickSearchable(page, page.getByRole('combobox').first(), new RegExp(FIXED_SUPPLIER));
    await pickSelect(page, page.getByRole('combobox', { name: 'Almacén destino *' }), new RegExp(FIXED_WAREHOUSE_A.name));
    const line = page.getByRole('row').nth(1);
    await pickSearchable(page, line.getByRole('combobox'), new RegExp(product));
    await line.getByRole('spinbutton').fill('5');
    await page.getByRole('button', { name: 'Crear remito' }).click();
    await expect(page.getByText('Remito creado').first()).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/purchasing\?tab=receiving/);

    const first = page.getByRole('tabpanel').getByRole('row').nth(1);
    number = ((await first.getByRole('cell').first().textContent()) ?? '').trim();
    expect(number).not.toBe('');
    await expect(first).toContainText(FIXED_WAREHOUSE_A.name);
    await expect(first).toContainText('Borrador');
  });

  test('confirmar el remito ingresa el stock al almacén', async ({ page }) => {
    const panel = await gotoPurchasingTab(page, 'receiving');
    const row = panel.getByRole('row').filter({ has: page.getByRole('cell', { name: number, exact: true }) });
    const menu = await openRowMenu(page, row);
    await menu.getByRole('menuitem', { name: /Confirmar/ }).click();
    await expect(page.getByText('Remito confirmado').first()).toBeVisible();
    await expect(panel.getByRole('row').filter({ has: page.getByRole('cell', { name: number, exact: true }) })).toContainText('Confirmado');

    await openWarehouseStock(page, FIXED_WAREHOUSE_A.name, product);
    await expect(stockRow(page, product).getByRole('cell').nth(3)).toHaveText('5');
  });

  test('cancelar el remito revierte el stock', async ({ page }) => {
    const panel = await gotoPurchasingTab(page, 'receiving');
    const menu = await openRowMenu(page, panel.getByRole('row').filter({ has: page.getByRole('cell', { name: number, exact: true }) }));
    await menu.getByRole('menuitem', { name: /Cancelar/ }).click();
    await expect(page.getByText('Remito cancelado').first()).toBeVisible();
    await expect(panel.getByRole('row').filter({ has: page.getByRole('cell', { name: number, exact: true }) })).toContainText('Anulado');

    await openWarehouseStock(page, FIXED_WAREHOUSE_A.name, product);
    await expect(stockRow(page, product).getByRole('cell').nth(3)).toHaveText('0');
  });
});
