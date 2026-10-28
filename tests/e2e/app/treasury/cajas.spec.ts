import { expect, test } from '@playwright/test';
import { uniq } from '../../helpers/env';
import {
  closeCashSession,
  createCashRegisterViaUi,
  deactivateCashRegisterIfActive,
  gotoTreasuryTab,
  newCashCode,
  openCashRegisterDetail,
  openCashSession,
} from '../../helpers/treasury';
import { clickHydrated } from '../../helpers/ui';

/**
 * Tesorería > Cajas físicas: alta, edición, sesión de caja (abrir, registrar un ingreso, cerrar) y desactivación.
 * La app no permite borrar cajas: la de prueba termina inactiva en la empresa QA E2E.
 */
test.describe('tesorería: cajas físicas', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const code = newCashCode();
  const name = uniq('Caja');
  const renamed = `${name}-ed`;

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      // Una sesión abierta impide desactivar la caja: se cierra primero si quedó abierta.
      await openCashRegisterDetail(page, code).catch(() => undefined);
      if (await page.getByRole('button', { name: 'Cerrar sesión' }).isVisible({ timeout: 2_000 }).catch(() => false)) await closeCashSession(page);
      await deactivateCashRegisterIfActive(page, code);
    } finally {
      await context.close();
    }
  });

  test('alta de una caja la muestra activa en el listado', async ({ page }) => {
    await createCashRegisterViaUi(page, code, name, 'Oficina QA');
    const row = (await gotoTreasuryTab(page, 'cash-registers')).getByRole('row').filter({ hasText: code });
    await expect(row).toContainText(name);
    await expect(row).toContainText('Oficina QA');
    await expect(row).toContainText('Activa');
  });

  test('editar el nombre de la caja se refleja en el listado', async ({ page }) => {
    const panel = await gotoTreasuryTab(page, 'cash-registers');
    await clickHydrated(panel.getByRole('row').filter({ hasText: code }).getByRole('button', { name: 'Editar' }));
    const dialog = page.getByRole('dialog', { name: 'Editar caja' });
    await dialog.getByPlaceholder('Caja principal').fill(renamed);
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Caja actualizada').first()).toBeVisible();
    await expect((await gotoTreasuryTab(page, 'cash-registers')).getByRole('row').filter({ hasText: code })).toContainText(renamed);
  });

  test('abrir una sesión, registrar un ingreso y cerrarla deja el historial', async ({ page }) => {
    await openCashRegisterDetail(page, code);
    await openCashSession(page, 1000);
    await expect(page.getByText('$1000.00').first()).toBeVisible();

    await clickHydrated(page.getByRole('button', { name: 'Nuevo movimiento' }));
    const dialog = page.getByRole('dialog', { name: 'Nuevo movimiento' });
    await dialog.getByPlaceholder('0.00').fill('500');
    await dialog.getByRole('textbox').first().fill('Ingreso QA E2E');
    await dialog.getByRole('button', { name: 'Registrar' }).click();
    await expect(page.getByText('Movimiento registrado').first()).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Ingreso QA E2E' })).toContainText('$500.00');
    await expect(page.getByText('$1500.00').first()).toBeVisible();

    await closeCashSession(page);
    const history = page.getByRole('row').filter({ hasText: /Cerrada/ });
    await expect(history.first()).toBeVisible();
  });

  test('desactivar la caja la marca como inactiva', async ({ page }) => {
    await deactivateCashRegisterIfActive(page, code);
    const row = (await gotoTreasuryTab(page, 'cash-registers')).getByRole('row').filter({ hasText: code });
    await expect(row).toContainText('Inactiva');
  });
});
