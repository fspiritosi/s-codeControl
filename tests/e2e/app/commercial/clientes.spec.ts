import { expect, test, type Page } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { CUSTOMERS_URL, createCustomerViaUi, uniqueCustomerCuit } from '../../helpers/sales';
import { clickHydrated, hydrated } from '../../helpers/ui';

/**
 * Comercial > Clientes: alta con datos fiscales, detalle con servicios y contactos, edición y baja.
 * La app no permite borrar clientes (solo dar de baja), así que el cliente de este spec termina dado de baja.
 * Cotizaciones es una pantalla "en desarrollo" (sin funciones): solo se comprueba el mensaje.
 */
test.describe('comercial: clientes', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const name = uniq('cli-com');
  const cuit = uniqueCustomerCuit();
  let customerId = '';

  const rowOf = (page: Page) => page.getByRole('row').filter({ hasText: name });

  async function openDetail(page: Page) {
    await page.goto(`${CUSTOMERS_URL}/${customerId}`);
    await expect(page.getByRole('heading', { name })).toBeVisible();
  }

  test.afterAll(async ({ browser, baseURL }) => {
    // Si algún paso falló antes de la baja, el cliente queda dado de baja igual.
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      await page.goto(CUSTOMERS_URL);
      await expect(page.getByRole('table')).toBeVisible();
      if (await rowOf(page).isVisible({ timeout: 3_000 }).catch(() => false)) await deactivate(page);
    } finally {
      await context.close();
    }
  });

  async function deactivate(page: Page) {
    await rowOf(page).getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: 'Dar de baja Cliente' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Dar de baja Cliente' });
    await dialog.getByPlaceholder('Escribe el motivo').fill('Cierre de prueba E2E');
    await dialog.getByRole('button', { name: /Fecha de Baja/i }).click();
    await page.getByRole('button', { name: /^Today,/ }).click();
    await dialog.getByRole('button', { name: 'Dar de Baja' }).click();
    await expect(page.getByText('Cliente eliminado').first()).toBeVisible();
  }

  test('alta de un cliente con condición de IVA lo deja en el listado', async ({ page }) => {
    await createCustomerViaUi(page, { name, cuit, taxCondition: 'Monotributo' });
    const row = rowOf(page);
    await expect(row).toContainText(cuit);
    await expect(row).toContainText('cliente-ventas@codecontrol.test');
    const href = await row.getByRole('link', { name }).getAttribute('href');
    customerId = href!.split('/').pop()!;
  });

  test('el detalle muestra los datos y permite agregar un servicio y un contacto', async ({ page }) => {
    await openDetail(page);
    await expect(page.getByText('Activo', { exact: true })).toBeVisible();
    const panel = page.getByRole('tabpanel', { name: 'Servicios e Ítems' });
    await hydrated(panel.getByRole('button', { name: 'Agregar servicio' }));
    await panel.getByRole('textbox', { name: 'Nombre del servicio' }).fill('Servicio QA');
    await panel.getByRole('button', { name: 'Agregar servicio' }).click();
    await expect(page.getByText('Servicio agregado').first()).toBeVisible();
    await expect(panel.getByText('Servicio QA')).toBeVisible();

    await clickHydrated(page.getByRole('tab', { name: 'Contactos' }));
    const contacts = page.getByRole('tabpanel', { name: 'Contactos' });
    await contacts.getByRole('button').first().click();
    await contacts.getByPlaceholder('Nombre').fill('Contacto QA');
    await contacts.getByPlaceholder('Cargo').fill('Compras');
    await contacts.getByPlaceholder('Email').fill('contacto-qa@codecontrol.test');
    await contacts.getByPlaceholder('Teléfono').fill('1133334444');
    await contacts.getByRole('row').filter({ has: page.getByPlaceholder('Nombre') }).getByRole('button').first().click();
    await expect(page.getByText('Contacto agregado').first()).toBeVisible();
    await expect(contacts.getByRole('row').filter({ hasText: 'Contacto QA' })).toContainText('Compras');
  });

  test('editar el teléfono desde "Editar datos" se ve en el detalle', async ({ page }) => {
    await openDetail(page);
    await clickHydrated(page.getByRole('link', { name: 'Editar datos' }));
    const phone = page.getByPlaceholder('1155551234');
    await expect(phone).toHaveValue('1144440000');
    await phone.fill('1166665555');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Cliente actualizado').first()).toBeVisible();
    await openDetail(page);
    await expect(page.getByText('1166665555').first()).toBeVisible();
  });

  test('dar de baja el cliente lo saca del listado', async ({ page }) => {
    await page.goto(CUSTOMERS_URL);
    await expect(rowOf(page)).toBeVisible();
    await deactivate(page);
    await page.goto(CUSTOMERS_URL);
    await expect(page.getByRole('table')).toBeVisible();
    await expect(rowOf(page)).toHaveCount(0);
  });

  test('Cotizaciones avisa que el módulo está en desarrollo', async ({ page }) => {
    await page.goto('/dashboard/commercial/quotes');
    await expect(page.getByText('Cotizaciones').first()).toBeVisible();
    await expect(page.getByText(/está en desarrollo/)).toBeVisible();
  });
});
