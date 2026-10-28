import { expect, test, type Page } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { SALES_URL, createPointOfSaleViaUi } from '../../helpers/sales';
import { clickHydrated } from '../../helpers/ui';

/**
 * Ventas > Puntos de venta: alta, edición (nombre y estado), configuración de la numeración y eliminación.
 * El punto de venta de prueba no emite comprobantes, así que la app deja eliminarlo.
 */
test.describe('ventas: puntos de venta', () => {
  test.describe.configure({ mode: 'serial', timeout: 90_000 });
  test.use({ actionTimeout: 15_000 });

  // Número en 8000-8899: no choca con el punto de venta fijo de las facturas (9901).
  const number = 8000 + Math.floor(Math.random() * 900);
  const name = uniq('PV');
  const renamed = `${name}-ed`;
  const label = String(number).padStart(4, '0');

  const rowOf = (page: Page, text: string) => page.getByRole('row').filter({ hasText: text });

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      await page.goto(`${SALES_URL}/points-of-sale`);
      await expect(page.getByRole('table')).toBeVisible();
      const row = rowOf(page, label);
      if (await row.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await clickHydrated(row.getByRole('button', { name: 'Eliminar' }));
        await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
        await expect(row).toHaveCount(0);
      }
    } finally {
      await context.close();
    }
  });

  test('alta de un punto de venta lo muestra activo en el listado', async ({ page }) => {
    await createPointOfSaleViaUi(page, { number, name });
    await expect(page.getByText('Punto de venta creado').first()).toBeVisible();
    const row = rowOf(page, name);
    await expect(row).toContainText(label);
    await expect(row).toContainText('Activo');
  });

  test('editar el nombre y desactivarlo se refleja en el listado', async ({ page }) => {
    await page.goto(`${SALES_URL}/points-of-sale`);
    await clickHydrated(rowOf(page, name).getByRole('button', { name: 'Editar' }));
    const dialog = page.getByRole('dialog', { name: 'Editar punto de venta' });
    await dialog.getByRole('textbox', { name: 'Nombre *' }).fill(renamed);
    await dialog.getByRole('switch', { name: 'Activo' }).click();
    await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Punto de venta actualizado').first()).toBeVisible();
    const row = rowOf(page, renamed);
    await expect(row).toContainText('Inactivo');
  });

  test('configurar la numeración guarda el número inicial de un tipo de comprobante', async ({ page }) => {
    await page.goto(`${SALES_URL}/points-of-sale`);
    await clickHydrated(rowOf(page, renamed).getByRole('button', { name: 'Configurar numeración' }));
    const dialog = page.getByRole('dialog', { name: 'Configurar numeración' });
    await dialog.getByLabel('Factura A', { exact: true }).fill('50');
    await dialog.getByRole('button', { name: /^Guardar/ }).click();
    await expect(page.getByText('Numeración actualizada').first()).toBeVisible();
    // Se reabre el diálogo: el valor quedó guardado.
    await clickHydrated(rowOf(page, renamed).getByRole('button', { name: 'Configurar numeración' }));
    await expect(page.getByRole('dialog', { name: 'Configurar numeración' }).getByLabel('Factura A', { exact: true })).toHaveValue('50');
  });

  test('eliminar un punto de venta sin comprobantes lo saca del listado', async ({ page }) => {
    await page.goto(`${SALES_URL}/points-of-sale`);
    await clickHydrated(rowOf(page, renamed).getByRole('button', { name: 'Eliminar' }));
    await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Punto de venta eliminado').first()).toBeVisible();
    await expect(rowOf(page, renamed)).toHaveCount(0);
  });
});
