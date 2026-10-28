import { expect, test } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { cleanupCustomerTree, createCustomerViaUi, createItemViaApi, createItemViaUi, createServiceViaUi, gotoServicesTab } from '../../helpers/operations';
import { clickHydrated } from '../../helpers/ui';

/**
 * Servicios de la empresa (módulo de mantenimiento): alta de servicio e ítem de un cliente, edición y baja.
 * La app no borra servicios ni ítems: la baja (desactivar) es también la limpieza.
 */
test.describe('servicios: servicios e ítems', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const customer = uniq('ClienteSrv');
  const service = uniq('Servicio');
  const renamed = `${service}-ed`;
  const item = uniq('Item');
  let serviceName = service;

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' });
    const page = await context.newPage();
    try {
      await cleanupCustomerTree(page, { item, service: serviceName, customer });
    } finally {
      await context.close();
    }
  });

  test('alta de un cliente y de un servicio lo muestra activo en la tabla', async ({ page }) => {
    await createCustomerViaUi(page, customer);
    await createServiceViaUi(page, customer, service);
    const panel = await gotoServicesTab(page, 'Cargar Servicio');
    const row = panel.getByRole('row').filter({ hasText: service });
    await expect(row).toContainText('Activo');
    await expect(row).toContainText(customer);
  });

  test('se puede editar el nombre del servicio', async ({ page }) => {
    const panel = await gotoServicesTab(page, 'Cargar Servicio');
    await clickHydrated(panel.getByRole('row').filter({ hasText: service }).getByRole('button', { name: 'Editar' }));
    const name = panel.getByRole('textbox', { name: 'Nombre del Servicio' });
    await expect(name).toHaveValue(service);
    await name.fill(renamed);
    await panel.locator('form').getByRole('button', { name: 'Editar', exact: true }).click();
    await expect(page.getByText('Servicio actualizado correctamente').first()).toBeVisible();
    serviceName = renamed;
    const fresh = await gotoServicesTab(page, 'Cargar Servicio');
    await expect(fresh.getByRole('row').filter({ hasText: renamed })).toContainText('Activo');
  });

  // H-20: el formulario "Cargar Items" no lista ningún servicio (lee `responseData.services` y la API responde `{ data: { services } }`),
  // así que no se puede crear un ítem. Igual que producción: el código es idéntico al de origin/dev y no se cambia.
  test.fixme('alta de un ítem del servicio por el formulario lo muestra en la tabla de ítems', async ({ page }) => {
    await createItemViaUi(page, customer, renamed, item);
    const panel = await gotoServicesTab(page, 'Cargar Items');
    await expect(panel.getByRole('row').filter({ hasText: item })).toContainText('Activo');
  });

  test('un ítem del servicio se ve en la tabla de ítems con sus datos', async ({ page }) => {
    await createItemViaApi(page, renamed, item);
    const panel = await gotoServicesTab(page, 'Cargar Items');
    const row = panel.getByRole('row').filter({ hasText: item });
    await expect(row).toContainText('Activo');
    await expect(row).toContainText('Ítem de prueba QA');
    await expect(row).toContainText('Metro');
    await expect(row).toContainText(customer);
  });

  // H-21: al guardar la edición de un ítem el formulario manda la unidad de medida como texto ("1") y la API (Prisma) la rechaza
  // con 500 ("Failed to update service item"). Igual que producción: el código es idéntico al de origin/dev y no se cambia.
  test.fixme('se puede editar la descripción del ítem', async ({ page }) => {
    const panel = await gotoServicesTab(page, 'Cargar Items');
    await clickHydrated(panel.getByRole('row').filter({ hasText: item }).getByRole('button', { name: 'Editar' }));
    const description = panel.getByRole('textbox', { name: 'Descripcion del Item' });
    await description.fill('Ítem de prueba QA editado');
    await panel.locator('form').getByRole('button', { name: 'Editar', exact: true }).click();
    await expect(page.getByText('Item actualizado correctamente').first()).toBeVisible();
    const fresh = await gotoServicesTab(page, 'Cargar Items');
    await expect(fresh.getByRole('row').filter({ hasText: item })).toContainText('Ítem de prueba QA editado');
  });

  test('dar de baja el ítem y el servicio los pasa a inactivos', async ({ page }) => {
    const items = await gotoServicesTab(page, 'Cargar Items');
    await clickHydrated(items.getByRole('row').filter({ hasText: item }).getByRole('button', { name: 'Editar' }));
    await items.getByRole('button', { name: 'Dar de Baja' }).click();
    await expect(page.getByText('Item desactivado correctamente').first()).toBeVisible();

    const services = await gotoServicesTab(page, 'Cargar Servicio');
    await clickHydrated(services.getByRole('row').filter({ hasText: renamed }).getByRole('button', { name: 'Editar' }));
    await services.getByRole('button', { name: 'Dar de Baja' }).click();
    await expect(page.getByText('Servicio desactivado correctamente').first()).toBeVisible();
    // La tabla filtra por "Activos": ya no aparecen.
    const fresh = await gotoServicesTab(page, 'Cargar Servicio');
    await expect(fresh.getByRole('row').filter({ hasText: renamed })).toHaveCount(0);
  });
});
