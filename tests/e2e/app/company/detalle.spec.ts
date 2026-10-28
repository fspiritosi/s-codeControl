import { expect, test } from '@playwright/test';
import { COMPANY_URL, gotoCompanyTab } from '../../helpers/company';
import { QA_COMPANY_ID } from '../../helpers/env';

test.describe('empresa: detalle', () => {
  test.use({ actionTimeout: 15_000 });

  test('la pestaña General muestra los datos de la empresa QA', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'General');
    await expect(panel.getByText('Datos generales de la empresa')).toBeVisible();
    await expect(panel.getByText('Razón Social: QA E2E')).toBeVisible();
    await expect(panel.getByText('CUIT: 30999999990')).toBeVisible();
    await expect(panel.getByText('Dirección: Calle Falsa 123')).toBeVisible();
    await expect(panel.getByText('Industria: Software')).toBeVisible();
    await expect(panel.getByText('Email de contacto: qa-e2e@codecontrol.test')).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Editar Compañía' })).toBeVisible();
  });

  test('el detalle tiene las ocho pestañas y cada una se abre con ?tab=', async ({ page }) => {
    await page.goto(COMPANY_URL);
    for (const tab of ['General', 'Documentación', 'Usuarios', 'Clientes', 'Contactos', 'Convenios', 'Servicios', 'Portal de Empleados']) {
      await expect(page.getByRole('tab', { name: tab, exact: true })).toBeVisible();
    }
    for (const [tab, panelTitle] of [
      ['Documentación', 'Documentos de la empresa'],
      ['Usuarios', 'Usuarios de la empresa'],
      ['Clientes', 'Clientes de la empresa'],
      ['Contactos', 'Contactos de la empresa'],
      ['Convenios', 'Convenios colectivos de trabajo'],
      ['Servicios', 'Servicios de la empresa'],
      ['Portal de Empleados', 'Portal de Empleados'],
    ] as const) {
      const panel = await gotoCompanyTab(page, tab);
      await expect(panel.getByText(panelTitle, { exact: true }).first()).toBeVisible();
    }
  });

  test('la pestaña Documentación lista los documentos de la empresa (vacía para la empresa QA)', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Documentación');
    await expect(panel.getByText('Lista de documentos a nombre de la empresa')).toBeVisible();
    for (const col of ['Nombre del documento', 'Subido por', 'Rol', 'Subido el', 'Acceso', 'Vencimiento']) {
      await expect(panel.getByRole('button', { name: col }).first()).toBeVisible();
    }
    await expect(panel.getByText('No se encontraron resultados.')).toBeVisible();
  });

  test('"Editar Compañía" abre el formulario con los datos actuales', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'General');
    await panel.getByRole('button', { name: 'Editar Compañía' }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/company/${QA_COMPANY_ID}$`));
    await expect(page.getByRole('textbox', { name: 'Nombre de la compañía' })).toHaveValue('QA E2E');
    await expect(page.getByRole('textbox', { name: 'CUIT' })).toHaveValue('30999999990');
    await expect(page.getByRole('textbox', { name: 'Teléfono' })).toHaveValue('1100000000');
    await expect(page.getByRole('textbox', { name: 'Dirección' })).toHaveValue('Calle Falsa 123');
    await expect(page.getByRole('combobox', { name: 'Industria' })).toContainText('Software');
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeVisible();
  });

  // No se guarda nada: el CUIT del seed (30999999990) no pasa la validación del formulario y la empresa QA no tiene
  // provincia, así que la edición nunca llega a enviarse. Se verifica que el formulario lo advierta.
  test('guardar la edición con datos inválidos muestra los errores y no envía', async ({ page }) => {
    await page.goto(`/dashboard/company/${QA_COMPANY_ID}`);
    await expect(async () => {
      await page.getByRole('textbox', { name: 'Sitio web' }).fill('https://qa-e2e.example.test', { timeout: 3_000 });
      await page.getByRole('button', { name: 'Guardar Cambios' }).click({ timeout: 3_000 });
      await expect(page.getByText('El CUIT es inválido')).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 25_000 });
    await expect(page).toHaveURL(new RegExp(`/dashboard/company/${QA_COMPANY_ID}$`));
  });

  test('"Cancelar" en la edición vuelve al detalle sin guardar', async ({ page }) => {
    await page.goto(`/dashboard/company/${QA_COMPANY_ID}`);
    await expect(page.getByRole('textbox', { name: 'Nombre de la compañía' })).toHaveValue('QA E2E');
    await page.getByRole('textbox', { name: 'Teléfono' }).fill('999');
    await expect(async () => {
      await page.getByRole('button', { name: 'Cancelar' }).click({ timeout: 3_000 });
      await expect(page).not.toHaveURL(new RegExp(`/dashboard/company/${QA_COMPANY_ID}$`), { timeout: 3_000 });
    }).toPass({ timeout: 25_000 });
    const panel = await gotoCompanyTab(page, 'General');
    await expect(panel.getByText('Teléfono de contacto: 1100000000')).toBeVisible();
  });

  test('la zona peligrosa pide confirmación y se puede cerrar sin eliminar', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'General');
    await expect(panel.getByText('ZONA PELIGROSA')).toBeVisible();
    await panel.getByRole('button', { name: 'Eliminar Empresa' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Confirmar eliminación de la empresa');
    await expect(dialog).toContainText('Por favor escribe QA E2E para confirmar.');
    // Solo "Cerrar": jamás se pulsa "Eliminar" sobre la empresa de pruebas.
    await dialog.getByRole('button', { name: 'Cerrar' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(panel.getByText('Razón Social: QA E2E')).toBeVisible();
  });
});
