import { expect, test } from '@playwright/test';
import { gotoCompanyTab } from '../../helpers/company';
import { QA_USER } from '../../helpers/env';

/**
 * Usuarios de la empresa, invitados y portal de empleados.
 * Invitar o crear usuarios envía mails y crea perfiles reales: estos tests llegan hasta el formulario y su validación,
 * jamás envían una invitación a otra casilla.
 */
test.describe('empresa: usuarios e invitados', () => {
  test.use({ actionTimeout: 15_000 });

  test('la tabla de empleados-usuarios muestra al dueño con rol Propietario y sin poder eliminarlo', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Usuarios');
    await expect(panel.getByText('Usuarios de la empresa', { exact: true })).toBeVisible();
    const row = panel.getByRole('row').filter({ hasText: QA_USER });
    await expect(row).toBeVisible();
    await expect(row.getByRole('combobox')).toContainText('Propietario');
    await expect(row.getByRole('combobox')).toBeDisabled();
    await expect(row.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
  });

  test('la pestaña Invitados lista a los invitados (vacía para la empresa QA)', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Usuarios');
    await page.getByRole('tab', { name: 'Invitados' }).click();
    await expect(panel.getByRole('tabpanel', { name: 'Invitados' }).getByText('No se encontraron resultados.')).toBeVisible();
  });

  test('"Agregar Usuario" abre el diálogo para compartir acceso con sus dos modos', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Usuarios');
    await expect(async () => {
      await panel.getByRole('button', { name: 'Agregar Usuario' }).click({ timeout: 3_000 });
      await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Compartir acceso a la empresa');
    await expect(dialog.getByRole('tab', { name: 'Crear usuario' })).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'Invitar usuario' })).toBeVisible();
    await dialog.getByRole('button', { name: /Cancel/ }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('"Agregar Invitado" ofrece crear o invitar a un invitado', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Usuarios');
    await expect(async () => {
      await panel.getByRole('button', { name: 'Agregar Invitado' }).click({ timeout: 3_000 });
      await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
    await expect(page.getByRole('alertdialog').getByRole('tab', { name: 'Crear Invitado' })).toBeVisible();
  });

  test('crear un usuario sin completar el formulario muestra los errores y no envía nada', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Usuarios');
    await expect(async () => {
      await panel.getByRole('button', { name: 'Agregar Usuario' }).click({ timeout: 3_000 });
      await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
    const dialog = page.getByRole('alertdialog');
    await dialog.getByRole('tab', { name: 'Crear usuario' }).click();
    await dialog.getByRole('button', { name: 'Agregar' }).click();
    await expect(dialog.locator('[id$="form-item-message"]').first()).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('no se puede compartir la empresa con el propio dueño', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Usuarios');
    await expect(async () => {
      await panel.getByRole('button', { name: 'Agregar Usuario' }).click({ timeout: 3_000 });
      await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
    const dialog = page.getByRole('alertdialog');
    await dialog.getByRole('tab', { name: 'Invitar usuario' }).click();
    await dialog.getByPlaceholder('ejemplo@correo.com').fill(QA_USER);
    await dialog.getByRole('button', { name: 'Agregar' }).click();
    await expect(page.getByText('No puedes compartir la empresa contigo mismo').first()).toBeVisible();
  });
});

test.describe('empresa: portal de empleados', () => {
  test.use({ actionTimeout: 15_000 });

  test('el portal muestra sus contadores y las dos solapas (sin solicitudes en la empresa QA)', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Portal de Empleados');
    await expect(panel.getByText('Configuración del portal de empleados')).toBeVisible();
    for (const label of ['Solicitudes Pendientes', 'Usuarios Activos', 'Usuarios Bloqueados', 'Total Empleados']) {
      await expect(panel.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(panel.getByRole('tab', { name: /Solicitudes Pendientes \(0\)/ })).toBeVisible();
    await expect(panel.getByRole('tab', { name: /Administrar Acceso \(0\)/ })).toBeVisible();
    await expect(panel.getByText('No hay solicitudes pendientes')).toBeVisible();
  });

  test('"Administrar Acceso" muestra su estado vacío', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Portal de Empleados');
    await expect(async () => {
      await panel.getByRole('tab', { name: /Administrar Acceso/ }).click({ timeout: 3_000 });
      await expect(panel.getByRole('tab', { name: /Administrar Acceso/ })).toHaveAttribute('aria-selected', 'true', { timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    await expect(panel.getByRole('tabpanel', { name: /Administrar Acceso/ })).toBeVisible();
  });
});
