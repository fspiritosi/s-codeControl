import { expect, test } from '@playwright/test';
import { cuilFor, uniqueIdentity } from '../../helpers/employees';
import { deactivateCustomerIfActive, gotoCompanyTab } from '../../helpers/company';
import { uniq } from '../../helpers/env';

/**
 * Contactos de la empresa. En el sistema desplegado el alta de contactos está rota (H-06 y H-07, ver
 * docs/testing/hallazgos.md): los tests del flujo completo están como `test.fixme` con la corrección ya hecha en el código
 * y se activan al desplegarla.
 */
test.describe('empresa: contactos', () => {
  test.use({ actionTimeout: 15_000 });

  test('la pestaña Contactos muestra la tabla y las opciones de la lista', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Contactos');
    await expect(panel.getByText('Contactos de la empresa', { exact: true })).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Registrar Contacto' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Ver dados de baja' })).toBeVisible();
    for (const col of ['Nombre', 'Email', 'Teléfono', 'Cargo', 'Cliente']) {
      await expect(panel.getByRole('button', { name: col, exact: true }).first()).toBeVisible();
    }
  });

  // H-06: el enlace "Registrar Contacto" apunta a /dashboard/company/contact/action, una ruta que no existe (404).
  // Corregido en app/dashboard/company/actualCompany/page.tsx; pendiente de deploy.
  test.fixme('"Registrar Contacto" abre el formulario de alta', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Contactos');
    await panel.getByRole('link', { name: 'Registrar Contacto' }).click();
    await expect(page.getByRole('heading', { name: /Registrar Contacto/ }).or(page.getByText('Registrar Contacto').first())).toBeVisible();
    await expect(page.getByText('Pagina no encontrada')).toHaveCount(0);
  });

  // H-07: el formulario de contacto se rompe al cargar ("R?.find is not a function"): fetchCustomersByCompany devuelve
  // { data, error } y el componente lo trata como arreglo. Corregido en ContactComponent y RegisterWithRole; pendiente de deploy.
  test.fixme('alta, edición, baja y reintegro de un contacto de un cliente', async ({ page }) => {
    test.slow();
    const customer = uniq('cli-contacto');
    const contact = uniq('contacto');

    try {
      await test.step('preparación: un cliente al que asociar el contacto', async () => {
        await page.goto('/dashboard/company/actualCompany/customers/action?action=new');
        await page.getByRole('textbox', { name: 'Nombre de la compañía' }).fill(customer);
        let cuit = '';
        while (!cuit) cuit = cuilFor(uniqueIdentity().dni, '30');
        await page.getByRole('textbox', { name: 'CUIT de la compañía' }).fill(cuit);
        await page.getByRole('textbox', { name: 'Email' }).fill('cliente-qa@codecontrol.test');
        await page.getByRole('textbox', { name: 'Número de teléfono' }).fill('1144445555');
        await page.getByRole('textbox', { name: 'Dirección', exact: true }).fill('Calle Cliente 456');
        await page.getByRole('button', { name: 'Registrar', exact: true }).click();
        await expect(page.getByText('Cliente creado satisfactoriamente!').first()).toBeVisible();
      });

      await test.step('alta del contacto', async () => {
        await page.goto('/dashboard/company/actualCompany/contact/action?action=new');
        await page.getByRole('textbox', { name: 'Nombre del Contacto' }).fill(contact);
        await page.getByRole('textbox', { name: 'Email' }).fill('contacto-qa@codecontrol.test');
        await page.getByRole('textbox', { name: 'Número de teléfono' }).fill('1133334444');
        await page.getByRole('combobox', { name: 'Seleccione un cliente' }).click();
        await page.getByRole('option', { name: customer }).click();
        await page.getByRole('textbox', { name: 'Cargo' }).fill('Compras');
        await page.getByRole('button', { name: 'Registrar Contacto' }).click();
        await expect(page.getByText('Contacto creado satisfactoriamente!').first()).toBeVisible();
      });

      await test.step('aparece en la tabla con su cliente', async () => {
        const panel = await gotoCompanyTab(page, 'Contactos');
        const row = panel.getByRole('row').filter({ hasText: contact });
        await expect(row).toContainText(customer);
        await expect(row).toContainText('Compras');
      });
    } finally {
      // Al dar de baja el cliente también se dan de baja sus contactos.
      await deactivateCustomerIfActive(page, customer);
    }
  });

  test.fixme('el formulario de contacto valida nombre, teléfono y cliente', async ({ page }) => {
    await page.goto('/dashboard/company/actualCompany/contact/action?action=new');
    await page.getByRole('button', { name: 'Registrar Contacto' }).click();
    await expect(page.getByText('El nombre debe tener al menos 2 caracteres.')).toBeVisible();
    await expect(page.getByText('El teléfono debe tener al menos 4 caracteres.')).toBeVisible();
  });
});
