import { expect, test } from '@playwright/test';
import {
  clickRowMenuItem,
  createEmployeeViaUi,
  deactivateFromList,
  employeeRow,
  fillTerminationDialog,
  filterByLastname,
  newEmployeeData,
  openTab,
} from '../../helpers/employees';

/**
 * Baja y reintegro de un empleado. El sistema no permite borrar empleados: la limpieza es dejarlos dados de baja
 * (el DNI de prueba es 99.xxx.xxx, no colisiona con personas reales).
 */
test.describe('empleados: baja y reintegro', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });
  const emp = newEmployeeData('baja');

  test('el alta del empleado de prueba deja la fila en el listado de activos', async ({ page }) => {
    await createEmployeeViaUi(page, emp);
    await filterByLastname(page, emp.lastname);
    await expect(employeeRow(page, emp.lastname)).toContainText(emp.cuil);
  });

  test('dar de baja desde el listado lo mueve a empleados inactivos', async ({ page }) => {
    await deactivateFromList(page, emp.lastname);
    await page.goto('/dashboard/employee');
    await filterByLastname(page, emp.lastname);
    await expect(employeeRow(page, emp.lastname)).toHaveCount(0);

    await openTab(page, 'Empleados inactivos');
    await filterByLastname(page, emp.lastname, 'Empleados inactivos');
    const inactivePanel = page.getByRole('tabpanel', { name: 'Empleados inactivos' });
    await expect(inactivePanel.getByRole('row').filter({ hasText: emp.lastname })).toBeVisible();
  });

  test('el detalle del empleado dado de baja es solo lectura y muestra la etiqueta', async ({ page }) => {
    await page.goto('/dashboard/employee');
    await openTab(page, 'Empleados inactivos');
    await filterByLastname(page, emp.lastname, 'Empleados inactivos');
    const row = page.getByRole('tabpanel', { name: 'Empleados inactivos' }).getByRole('row').filter({ hasText: emp.lastname });
    await clickRowMenuItem(page, row, 'Ver empleado');
    await expect(page).toHaveURL(/action=view/);
    await expect(page.getByText('Dado de baja')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Habilitar edición' })).toHaveCount(0);
  });

  test('reintegrar mantiene la fecha original y vuelve a activos', async ({ page }) => {
    await page.goto('/dashboard/employee');
    await openTab(page, 'Empleados inactivos');
    await filterByLastname(page, emp.lastname, 'Empleados inactivos');
    const panel = page.getByRole('tabpanel', { name: 'Empleados inactivos' });
    await clickRowMenuItem(page, panel.getByRole('row').filter({ hasText: emp.lastname }), 'Reintegrar Empleado');
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Reintegrar empleado');
    await expect(dialog).toContainText('Mantener fecha original');
    await dialog.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Empleado reintegrado').first()).toBeVisible();

    await page.goto('/dashboard/employee');
    await filterByLastname(page, emp.lastname);
    await expect(employeeRow(page, emp.lastname)).toBeVisible();
  });

  test('dar de baja desde el detalle (Habilitar edición > Dar de baja)', async ({ page }) => {
    await page.goto('/dashboard/employee');
    await filterByLastname(page, emp.lastname);
    await clickRowMenuItem(page, employeeRow(page, emp.lastname), 'Ver empleado');
    await page.getByRole('button', { name: 'Habilitar edición' }).click();
    await page.getByRole('button', { name: 'Dar de baja' }).click();
    await fillTerminationDialog(page, 'Fin de contrato');
    await expect(page.getByText('Emplead@ eliminado')).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/employee$/);
  });

});
