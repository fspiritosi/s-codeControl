import { expect, test, type Locator, type Page } from '@playwright/test';
import { cuilFor, uniqueIdentity } from '../../helpers/employees';
import { deactivateCustomerIfActive, gotoCompanyTab } from '../../helpers/company';
import { hydrated } from '../../helpers/ui';
import { uniq } from '../../helpers/env';

/** CUIT de empresa (prefijo 30) con dígito verificador válido; si el dígito da 10 se prueba con otro número. */
const newCuit = () => {
  for (;;) {
    const cuit = cuilFor(uniqueIdentity().dni, '30');
    if (cuit) return cuit;
  }
};

async function openNewCustomerForm(page: Page) {
  // Se navega directo a la URL del enlace "Registrar Cliente" (se verifica aparte): el clic sobre el enlace compite con
  // el refresco de la pestaña y, con carga, a veces vuelve a la lista.
  await page.goto('/dashboard/company/actualCompany/customers/action?action=new');
  await expect(page.getByRole('textbox', { name: 'Nombre de la compañía' })).toBeVisible();
}

type Customer = { name: string; cuit: string; email?: string };

async function fillCustomerOnce(page: Page, c: Customer) {
  await page.getByRole('textbox', { name: 'Nombre de la compañía' }).fill(c.name, { timeout: 4_000 });
  await page.getByRole('textbox', { name: 'CUIT de la compañía' }).fill(c.cuit, { timeout: 4_000 });
  await page.getByRole('textbox', { name: 'Email' }).fill(c.email ?? 'cliente-qa@codecontrol.test', { timeout: 4_000 });
  await page.getByRole('textbox', { name: 'Número de teléfono' }).fill('1144445555', { timeout: 4_000 });
  await page.getByRole('textbox', { name: 'Dirección', exact: true }).fill('Calle Cliente 456', { timeout: 4_000 });
}

/**
 * Llena el formulario y lo envía una sola vez. Con varios workers la pantalla vuelve a montar el formulario mientras
 * termina de cargar y se pierde lo escrito: el llenado (idempotente) se reintenta hasta que los valores quedan, y recién
 * entonces se envía. Así no se reenvía un alta que ya entró.
 */
async function submitCustomer(page: Page, c: Customer, outcome: Locator) {
  await expect(async () => {
    await fillCustomerOnce(page, c);
    await expect(page.getByRole('textbox', { name: 'Nombre de la compañía' })).toHaveValue(c.name, { timeout: 2_000 });
    await expect(page.getByRole('textbox', { name: 'Dirección', exact: true })).toHaveValue('Calle Cliente 456', { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  await expect(outcome).toBeVisible({ timeout: 20_000 });
}

const text = (page: Page, t: string | RegExp) => page.getByText(t).first();

test.describe('empresa: clientes', () => {
  test.use({ actionTimeout: 15_000 });

  test('la pestaña Clientes muestra la tabla y el acceso a "Registrar Cliente"', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Clientes');
    await expect(panel.getByText('Clientes de la empresa', { exact: true })).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Registrar Cliente' })).toHaveAttribute('href', /customers\/action\?action=new/);
    await expect(panel.getByRole('button', { name: 'Ver dados de baja' })).toBeVisible();
    await expect(panel.getByRole('table')).toBeVisible();
  });

  test('el formulario vacío marca los campos obligatorios', async ({ page }) => {
    await openNewCustomerForm(page);
    await expect(async () => {
      await page.getByRole('button', { name: 'Registrar', exact: true }).click({ timeout: 4_000 });
      await expect(text(page, 'El nombre debe tener al menos 2 caracteres.')).toBeVisible({ timeout: 4_000 });
    }).toPass({ timeout: 30_000 });
    await expect(page.getByText('El CUIT debe contener 11 números.').first()).toBeVisible();
    await expect(page.getByText('La dirección debe tener al menos 2 caracteres.').first()).toBeVisible();
    await expect(page.getByText('El teléfono debe tener al menos 4 caracteres.').first()).toBeVisible();
    await expect(page).toHaveURL(/action=new/);
  });

  test('un CUIT con dígito verificador incorrecto y un email inválido se rechazan', async ({ page }) => {
    await openNewCustomerForm(page);
    const cuit = newCuit();
    await submitCustomer(
      page,
      { name: uniq('cli-inval'), cuit: `${cuit.slice(0, 10)}${(Number(cuit[10]) + 1) % 10}`, email: 'no-es-mail' },
      text(page, 'El CUIT es inválido'),
    );
    await expect(text(page, 'Email inválido')).toBeVisible();
  });

  test('el nombre de la compañía admite hasta 40 caracteres', async ({ page }) => {
    await openNewCustomerForm(page);
    await submitCustomer(page, { name: 'X'.repeat(41), cuit: newCuit() }, text(page, /debe tener menos de 40 caracteres/));
  });

  test('alta, edición, baja y reintegro de un cliente', async ({ page }) => {
    test.slow();
    const name = uniq('cliente');
    const cuit = newCuit();
    try {
      await cicloDeVidaDelCliente(page, name, cuit);
    } finally {
      // Si algún paso falló a mitad de camino, el cliente queda dado de baja igual (la UI no permite borrarlo).
      await deactivateCustomerIfActive(page, name);
    }
  });
});

async function cicloDeVidaDelCliente(page: Page, name: string, cuit: string) {
    await test.step('alta', async () => {
      await openNewCustomerForm(page);
      await submitCustomer(page, { name, cuit }, text(page, 'Cliente creado satisfactoriamente!'));
    });

    const rowOf = (panel: ReturnType<Page['locator']>) => panel.getByRole('row').filter({ hasText: name });

    await test.step('aparece en la tabla de clientes con sus datos', async () => {
      const panel = await gotoCompanyTab(page, 'Clientes');
      const row = rowOf(panel);
      await expect(row).toContainText(cuit);
      await expect(row).toContainText('cliente-qa@codecontrol.test');
      await expect(row).toContainText('1144445555');
    });

    await test.step('un cliente repetido (mismos datos) se rechaza', async () => {
      await openNewCustomerForm(page);
      await submitCustomer(page, { name, cuit }, text(page, 'El cliente ya existe en esta empresa'));
    });

    await test.step('editar el teléfono desde el menú de la fila', async () => {
      const panel = await gotoCompanyTab(page, 'Clientes');
      await rowOf(panel).getByRole('button', { name: 'Open menu' }).click();
      await page.getByRole('menuitem', { name: 'Editar Cliente' }).click();
      await expect(page).toHaveURL(/customers\/action\?action=edit&id=/);
      // El formulario de edición es el del módulo Comercial (CustomerDataForm): sus campos se identifican por placeholder.
      const phone = page.getByPlaceholder('1155551234');
      await expect(phone).toHaveValue('1144445555');
      await phone.fill('1166667777');
      await page.getByRole('button', { name: 'Guardar cambios' }).click();
      await expect(async () => {
        const panel2 = await gotoCompanyTab(page, 'Clientes');
        await expect(rowOf(panel2)).toContainText('1166667777', { timeout: 3_000 });
      }).toPass({ timeout: 30_000 });
    });

    await test.step('dar de baja lo saca de la lista y lo muestra en "Ver dados de baja"', async () => {
      const panel = await gotoCompanyTab(page, 'Clientes');
      await rowOf(panel).getByRole('button', { name: 'Open menu' }).click();
      await page.getByRole('menuitem', { name: 'Dar de baja Cliente' }).click();
      const dialog = page.getByRole('dialog').filter({ hasText: 'Dar de baja Cliente' });
      await dialog.getByPlaceholder('Escribe el motivo').fill('Cierre de prueba E2E');
      await dialog.getByRole('button', { name: /Fecha de Baja/i }).click();
      await page.getByRole('button', { name: /^Today,/ }).click();
      await dialog.getByRole('button', { name: 'Dar de Baja' }).click();
      await expect(page.getByText('Cliente eliminado').first()).toBeVisible();
    });

    await test.step('queda en "Ver dados de baja" y se puede reintegrar', async () => {
      const panel = await gotoCompanyTab(page, 'Clientes');
      await expect(rowOf(panel)).toHaveCount(0);
      // Un clic anterior a la hidratación se pierde: se repite hasta que la lista de bajas se muestra. El botón alterna la
      // vista, así que la ventana de espera es holgada (8 s) para no apagarla por una carga lenta.
      // Cada intento recarga la pestaña (la pantalla a veces vuelve a General) y alterna la vista de bajas una sola vez.
      await expect(async () => {
        const fresh = await gotoCompanyTab(page, 'Clientes');
        await hydrated(fresh.getByRole('button', { name: 'Ver dados de baja' }));
        await fresh.getByRole('button', { name: 'Ver dados de baja' }).click({ timeout: 3_000 });
        // Los clientes dados de baja de corridas anteriores se acumulan y paginan: se filtra por el nombre único.
        await fresh.getByRole('button', { name: /^Nombre/ }).first().click({ timeout: 3_000 });
        await page.getByRole('textbox', { name: /Buscar nombre/ }).fill(name, { timeout: 3_000 });
        await page.getByRole('button', { name: 'Aplicar' }).click({ timeout: 3_000 });
        await page.keyboard.press('Escape');
        await expect(rowOf(fresh)).toBeVisible({ timeout: 8_000 });
      }).toPass({ timeout: 60_000 });
      const panelBajas = page.getByRole('tabpanel', { name: 'Clientes' });
      await rowOf(panelBajas).getByRole('button', { name: 'Open menu' }).click();
      await page.getByRole('menuitem', { name: 'Reintegrar Cliente' }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Continuar' }).click();
      await expect(page.getByText('Cliente reintegrado').first()).toBeVisible();
    });
}
