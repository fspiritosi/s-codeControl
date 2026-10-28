import { expect, test } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { createSupplierViaUi, gotoPurchasingTab, uniqueCuit } from '../../helpers/purchasing';
import { clickHydrated } from '../../helpers/ui';

/**
 * Proveedores con sus métodos de pago (cheque y cuenta bancaria): alta, detalle y edición.
 * La app no permite dar de baja ni eliminar proveedores (`deleteSupplier` no está en ninguna pantalla), así que el proveedor
 * de este spec queda activo en la empresa QA E2E (ver docs/testing/hallazgos.md).
 */
test.describe('compras: proveedores', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const name = uniq('Prov');
  const cuit = uniqueCuit();
  const bank = 'Banco QA Uno';

  test('alta de un proveedor con cheque y cuenta bancaria lo muestra en el listado', async ({ page }) => {
    await createSupplierViaUi(page, { name, cuit }, async (p) => {
      await p.getByRole('switch').click();
      await p.getByRole('textbox', { name: 'Banco emisor' }).fill('Banco Cheque QA');
      await p.getByRole('button', { name: 'Agregar cuenta bancaria' }).click();
      await p.getByRole('textbox', { name: 'Banco *' }).fill(bank);
      await p.getByRole('textbox', { name: 'Titular *', exact: true }).fill(name);
      await p.getByRole('textbox', { name: 'CUIT del titular *' }).fill(cuit);
      await p.getByRole('textbox', { name: 'Alias' }).fill('qa.e2e.alias');
    });
    await expect(page.getByText('Proveedor creado').first()).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/purchasing\?tab=suppliers/);
    const panel = await gotoPurchasingTab(page, 'suppliers', name);
    await panel.getByRole('button', { name: 'Razón Social' }).first().waitFor();
    const row = panel.getByRole('row').filter({ hasText: name });
    await expect(row).toContainText(cuit);
  });

  test('el detalle muestra los métodos de pago cargados', async ({ page }) => {
    const panel = await gotoPurchasingTab(page, 'suppliers', name);
    await clickHydrated(panel.getByRole('link', { name: new RegExp(name) }));
    await expect(page.getByRole('heading', { name })).toBeVisible();
    await expect(page.getByText('Acepta cheques').first()).toBeVisible();
    await expect(page.getByText(bank)).toBeVisible();
    await expect(page.getByText('qa.e2e.alias')).toBeVisible();
  });

  test('se puede editar el proveedor y su cuenta bancaria', async ({ page }) => {
    const panel = await gotoPurchasingTab(page, 'suppliers', name);
    await clickHydrated(panel.getByRole('link', { name: new RegExp(name) }));
    await clickHydrated(page.getByRole('link', { name: 'Editar' }));
    const trade = page.getByRole('textbox', { name: 'Nombre de fantasía' });
    await expect(trade).toBeVisible();
    await trade.fill('Fantasia QA editada');
    await page.getByRole('textbox', { name: 'Banco *' }).fill('Banco QA Dos');
    await page.getByRole('button', { name: 'Actualizar' }).click();
    await expect(page.getByText('Proveedor actualizado').first()).toBeVisible();
    await expect(page.getByText('Fantasia QA editada').first()).toBeVisible();
    await expect(page.getByText('Banco QA Dos')).toBeVisible();
  });
});
