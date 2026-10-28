import { expect, test } from '@playwright/test';
import { COSTOS_URL, clickHydrated, hydrated, rowIconButtons } from '../../helpers/costos';
import { PREFIX, uniq } from '../../helpers/env';
import { cleanupEquipment, createEquipmentViaUi, newEquipmentData } from '../../helpers/equipment';
import { pickSearchable } from '../../helpers/purchasing';

/**
 * Costos: catálogo de conceptos de equipo, costo por tipo de equipo y costo por equipo.
 * La app no ofrece borrar el costo de un tipo ni el costo de un equipo: el tipo de los equipos de prueba ("Tractor") queda costeado y
 * el equipo de prueba (que se da de baja) conserva su costo.
 */
test.describe('costos: conceptos, tipos de equipo y equipos', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const concept = uniq('Concepto');
  const vehicle = newEquipmentData('CostoEq');
  const TYPE = 'Tractor';

  test.afterAll(async ({ browser, baseURL }) => {
    // Red de seguridad: borra los conceptos de prueba que haya dejado un test que falló a medio camino.
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      await page.goto(`${COSTOS_URL}/conceptos`);
      await hydrated(page.getByRole('button', { name: 'Nuevo concepto' }));
      const leftovers = page.getByRole('row').filter({ hasText: `${PREFIX}Concepto-` });
      for (let left = await leftovers.count(); left > 0; left = await leftovers.count()) {
        page.once('dialog', (d) => void d.accept());
        await rowIconButtons(leftovers.first()).last().click();
        // Un concepto todavía asociado a un tipo no se puede borrar: se deja de intentar en vez de ensuciar el resultado.
        if (!(await expect(leftovers).toHaveCount(left - 1, { timeout: 5_000 }).then(() => true, () => false))) break;
      }
    } finally {
      await context.close();
    }
    await cleanupEquipment(browser, baseURL, [vehicle.intern]);
  });

  test('crear un concepto del catálogo, editarlo y eliminarlo', async ({ page }) => {
    await page.goto(`${COSTOS_URL}/conceptos`);
    await clickHydrated(page.getByRole('button', { name: 'Nuevo concepto' }));
    const dialog = page.getByRole('dialog', { name: 'Nuevo concepto' });
    await dialog.locator('#concepto_nombre').fill(concept);
    await dialog.locator('#concepto_cantidad').fill('2');
    await dialog.locator('#concepto_precio').fill('1500');
    await dialog.getByRole('button', { name: 'Crear concepto' }).click();
    const row = page.getByRole('row').filter({ hasText: concept });
    await expect(row).toContainText('Mantenimiento');

    await rowIconButtons(row).first().click();
    const edit = page.getByRole('dialog', { name: 'Editar concepto' });
    await edit.locator('#concepto_precio').fill('2500');
    await edit.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(edit).toBeHidden();
    await expect(page.getByRole('row').filter({ hasText: concept })).toContainText(/2\.500|2500/);

    page.once('dialog', (d) => void d.accept());
    await rowIconButtons(page.getByRole('row').filter({ hasText: concept })).last().click();
    await expect(page.getByText('Concepto eliminado').first()).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: concept })).toHaveCount(0);
  });

  test('costear el tipo de equipo, asociarle un concepto y sacarlo', async ({ page }) => {
    // Un concepto nuevo para asociar (se elimina al final de este test).
    await page.goto(`${COSTOS_URL}/conceptos`);
    await clickHydrated(page.getByRole('button', { name: 'Nuevo concepto' }));
    const created = page.getByRole('dialog', { name: 'Nuevo concepto' });
    await created.locator('#concepto_nombre').fill(concept);
    await created.locator('#concepto_cantidad').fill('1');
    await created.locator('#concepto_precio').fill('1000');
    await created.getByRole('button', { name: 'Crear concepto' }).click();
    await expect(page.getByRole('row').filter({ hasText: concept })).toBeVisible();

    await page.goto(`${COSTOS_URL}/tipos-equipo`);
    const create = page.getByRole('button', { name: 'Crear costo de equipo' });
    await hydrated(create);
    if (await create.isEnabled()) {
      await create.click();
      const dialog = page.getByRole('dialog', { name: 'Crear costo de equipo' });
      await pickSearchable(page, dialog.getByRole('combobox'), new RegExp(`^${TYPE}`));
      await dialog.getByRole('button', { name: 'Crear', exact: true }).click();
      await expect(page.getByText('Costo del tipo creado').first()).toBeVisible();
    }
    const row = page.getByRole('row').filter({ hasText: TYPE });
    await expect(row).toBeVisible();
    await row.getByRole('link', { name: 'Ver' }).click();
    await page.waitForURL(/\/tipos-equipo\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { name: TYPE })).toBeVisible();

    await clickHydrated(page.getByRole('button', { name: 'Asociar concepto' }).last());
    const associate = page.getByRole('dialog', { name: /Asociar/ });
    await associate.locator('div.px-3').filter({ hasText: concept }).getByRole('button', { name: 'Asociar' }).click();
    await expect(page.getByText('Concepto asociado').first()).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: concept })).toBeVisible();

    page.once('dialog', (d) => void d.accept());
    await page.getByRole('row').filter({ hasText: concept }).getByRole('button', { name: 'Sacar del tipo' }).click();
    await expect(page.getByText('Concepto desasociado').first()).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: concept })).toHaveCount(0);

    await page.goto(`${COSTOS_URL}/conceptos`);
    page.once('dialog', (d) => void d.accept());
    await rowIconButtons(page.getByRole('row').filter({ hasText: concept })).last().click();
    await expect(page.getByRole('row').filter({ hasText: concept })).toHaveCount(0);
  });

  test('cargar el costo de un equipo lo muestra con su costo mensual', async ({ page }) => {
    await createEquipmentViaUi(page, vehicle);
    await page.goto(`${COSTOS_URL}/equipos`);
    const row = page.getByRole('row').filter({ hasText: vehicle.intern });
    await expect(row).toContainText('Sin costo');
    await clickHydrated(row);
    await page.waitForURL(/\/costos\/equipos\/[0-9a-f-]{36}$/);
    await page.locator('#valor_compra').fill('10000000');
    await page.locator('#valor_residual_pct').fill('10');
    await page.locator('#anios_amortizacion').fill('5');
    await page.locator('#km_anuales').fill('50000');
    await page.getByRole('button', { name: 'Crear costo de equipo' }).click();
    await expect(page.getByText('Costo de equipo guardado').first()).toBeVisible();

    await page.goto(`${COSTOS_URL}/equipos`);
    const saved = page.getByRole('row').filter({ hasText: vehicle.intern });
    await expect(saved).not.toContainText('Sin costo');
    await expect(saved).toContainText(/10\.000\.000/);
  });

  test('editar el costo del equipo actualiza el valor de compra', async ({ page }) => {
    await page.goto(`${COSTOS_URL}/equipos`);
    await clickHydrated(page.getByRole('row').filter({ hasText: vehicle.intern }));
    await page.waitForURL(/\/costos\/equipos\/[0-9a-f-]{36}$/);
    await page.locator('#valor_compra').fill('12000000');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Costo de equipo guardado').first()).toBeVisible();
    await page.goto(`${COSTOS_URL}/equipos`);
    await expect(page.getByRole('row').filter({ hasText: vehicle.intern })).toContainText(/12\.000\.000/);
  });
});
