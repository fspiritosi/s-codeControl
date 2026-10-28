import { expect, test } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { createProductViaUi, deactivateProductIfActive, gotoWarehouseTab, openRowMenu } from '../../helpers/purchasing';
import { clickHydrated } from '../../helpers/ui';

/** Productos (catálogo que usan compras y almacenes): alta, edición y desactivación. El producto queda desactivado al terminar. */
test.describe('almacenes: productos', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const name = uniq('Producto');
  const renamed = `${name}-ed`;
  let current = name;

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      await deactivateProductIfActive(page, current);
    } finally {
      await context.close();
    }
  });

  test('alta de un producto lo muestra activo en el listado', async ({ page }) => {
    await createProductViaUi(page, name, 100);
    const panel = await gotoWarehouseTab(page, 'products', name);
    const row = panel.getByRole('row').filter({ hasText: name });
    await expect(row).toContainText('Activo');
    await expect(row).toContainText('PROD-');
  });

  test('se puede editar el nombre del producto', async ({ page }) => {
    const panel = await gotoWarehouseTab(page, 'products', name);
    const menu = await openRowMenu(page, panel.getByRole('row').filter({ hasText: name }));
    await menu.getByRole('menuitem', { name: 'Editar' }).click();
    const input = page.getByRole('textbox', { name: 'Nombre *' });
    await expect(input).toHaveValue(name);
    await input.fill(renamed);
    await clickHydrated(page.getByRole('button', { name: /Actualizar|Guardar/ }));
    await expect(page.getByText('Producto actualizado').first()).toBeVisible();
    current = renamed;
    const fresh = await gotoWarehouseTab(page, 'products', renamed);
    await expect(fresh.getByRole('row').filter({ hasText: renamed })).toContainText('Activo');
  });

  test('desactivar el producto lo deja inactivo en el listado', async ({ page }) => {
    await deactivateProductIfActive(page, renamed);
    const panel = await gotoWarehouseTab(page, 'products', renamed);
    await expect(panel.getByRole('row').filter({ hasText: renamed })).toContainText('Inactivo');
  });
});
