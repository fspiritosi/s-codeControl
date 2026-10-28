import { expect, test } from '@playwright/test';
import { uniq } from '../../helpers/env';
import {
  FIXED_WAREHOUSE_B,
  adjustStockViaUi,
  createProductViaUi,
  createWarehouseViaUi,
  deactivateProductIfActive,
  ensureWarehouse,
  gotoWarehouseTab,
  openStockDialog,
  openWarehouseStock,
  pickSelect,
  stockRow,
} from '../../helpers/purchasing';
import { clickHydrated } from '../../helpers/ui';

/**
 * Almacenes: alta y edición, ajuste de stock, movimientos y transferencia entre almacenes. La app no permite desactivar ni
 * eliminar almacenes (`toggleWarehouseActive` no está en ninguna pantalla): el almacén de este spec queda activo en la empresa QA E2E
 * (ver hallazgos). El producto de prueba sí se desactiva al terminar.
 */
test.describe('almacenes: almacenes y stock', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const suffix = Date.now().toString(36);
  const code = `QA-E2E-W-${suffix}`;
  const name = uniq('Almacen');
  const renamed = `${name}-ed`;
  const product = uniq('ProdStock');
  const note = uniq('AjusteNota');

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      await deactivateProductIfActive(page, product);
    } finally {
      await context.close();
    }
  });

  test('alta de un almacén lo muestra activo en el listado', async ({ page }) => {
    await createWarehouseViaUi(page, code, name);
    await expect(page.getByText('Almacén creado').first()).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/warehouse$/);
    const panel = await gotoWarehouseTab(page, 'warehouses', name);
    const row = panel.getByRole('row').filter({ hasText: name });
    await expect(row).toContainText(code);
    await expect(row).toContainText('Activo');
  });

  test('se puede editar el nombre del almacén', async ({ page }) => {
    const panel = await gotoWarehouseTab(page, 'warehouses', name);
    await clickHydrated(panel.getByRole('row').filter({ hasText: name }).getByRole('button').last());
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    const input = page.getByRole('textbox', { name: 'Nombre *' });
    await expect(input).toHaveValue(name);
    await input.fill(renamed);
    await clickHydrated(page.getByRole('button', { name: /Actualizar|Guardar/ }));
    await expect(page.getByText('Almacén actualizado').first()).toBeVisible();
    const fresh = await gotoWarehouseTab(page, 'warehouses', renamed);
    await expect(fresh.getByRole('row').filter({ hasText: renamed })).toContainText(code);
  });

  test('ajustar el stock de un producto lo muestra en el almacén y en los movimientos', async ({ page }) => {
    await createProductViaUi(page, product, 100);
    await adjustStockViaUi(page, renamed, product, 10, note);
    const row = stockRow(page, product);
    await expect(row.getByRole('cell').nth(3)).toHaveText('10');
    await expect(row.getByRole('cell').nth(5)).toHaveText('10');

    const movements = await gotoWarehouseTab(page, 'movements', note);
    const movement = movements.getByRole('row').filter({ hasText: note });
    await expect(movement).toContainText('Ajuste');
    await expect(movement).toContainText(product);
    await expect(movement).toContainText('+10');
  });

  test('transferir stock a otro almacén descuenta del origen y suma en el destino', async ({ page }) => {
    await ensureWarehouse(page, FIXED_WAREHOUSE_B);
    const dialog = await openStockDialog(page, renamed, 'Transferir');
    const [productSelect, warehouseSelect] = [dialog.getByRole('combobox').nth(0), dialog.getByRole('combobox').nth(1)];
    await pickSelect(page, productSelect, new RegExp(product));
    await pickSelect(page, warehouseSelect, new RegExp(FIXED_WAREHOUSE_B.name));
    await dialog.getByRole('spinbutton').fill('4');
    await dialog.getByRole('button', { name: 'Confirmar transferencia' }).click();
    await expect(page.getByText('Transferencia realizada').first()).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(stockRow(page, product).getByRole('cell').nth(3)).toHaveText('6');

    await openWarehouseStock(page, FIXED_WAREHOUSE_B.name, product);
    await expect(stockRow(page, product).getByRole('cell').nth(3)).toHaveText('4');
  });
});
