import { expect, test } from '@playwright/test';
import { ensureCovenantTree } from '../../helpers/company';
import {
  cleanupEmployees,
  clickRowMenuItem,
  createEmployeeViaUi,
  employeeRow,
  filterByLastname,
  newEmployeeData,
} from '../../helpers/employees';

/** Detalle (solo lectura) y edición del legajo. Un único empleado de prueba para todo el grupo. */
test.describe('empleados: detalle y edición', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });
  const emp = newEmployeeData('edicion');

  test.afterAll(async ({ browser, baseURL }) => {
    await cleanupEmployees(browser, baseURL, [emp.lastname]);
  });

  const openRowAction = async (page: import('@playwright/test').Page, item: string) => {
    await page.goto('/dashboard/employee');
    await filterByLastname(page, emp.lastname);
    await clickRowMenuItem(page, employeeRow(page, emp.lastname), item);
  };

  test('preparación: se crea el empleado de prueba con sindicato, convenio y categoría', async ({ page }) => {
    // H-02: un empleado sin sindicato/convenio/categoría no se puede guardar al editarlo (ver test.fixme del final).
    await ensureCovenantTree(page);
    await createEmployeeViaUi(page, emp, { covenant: true });
    await filterByLastname(page, emp.lastname);
    await expect(employeeRow(page, emp.lastname)).toBeVisible();
  });

  test('el detalle abre en solo lectura con sus cinco pestañas', async ({ page }) => {
    await openRowAction(page, 'Ver empleado');
    await expect(page).toHaveURL(/action=view&employee_id=/);
    await expect(page.getByText(emp.fullName).first()).toBeVisible();
    for (const tab of ['Datos Personales', 'Datos de Contacto', 'Datos Laborales', 'Documentación', 'Diagramas']) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible();
    }
    await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toBeDisabled();
    await expect(page.getByRole('textbox', { name: 'CUIL' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Habilitar edición' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Volver' })).toBeVisible();
  });

  test('"Volver" regresa al listado de empleados', async ({ page }) => {
    await openRowAction(page, 'Ver empleado');
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page).toHaveURL(/\/dashboard\/employee(\?.*)?$/);
    await expect(page.getByRole('tab', { name: 'Empleados activos' })).toBeVisible();
  });

  test('habilitar edición y guardar cambios en las tres pestañas', async ({ page }) => {
    await openRowAction(page, 'Ver empleado');
    await page.getByRole('button', { name: 'Habilitar edición' }).click();
    await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Dar de baja' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(`${emp.firstname}-ed`);
    await page.getByRole('tab', { name: 'Datos de Contacto' }).click();
    await page.getByRole('textbox', { name: 'Teléfono' }).fill('1166667777');
    await page.getByRole('tab', { name: 'Datos Laborales' }).click();
    await page.getByRole('textbox', { name: 'Puesto en la empresa' }).fill('Supervisor QA');
    await page.getByRole('spinbutton', { name: 'Horas normales' }).fill('6');
    await expect(async () => {
      await page.getByRole('button', { name: 'Guardar cambios' }).click({ timeout: 3_000 });
      await expect(page.getByText('Empleado actualizado correctamente')).toBeVisible({ timeout: 6_000 });
    }).toPass({ timeout: 40_000 });

    // Se relee desde el listado: los cambios quedaron persistidos.
    await page.goto('/dashboard/employee');
    await filterByLastname(page, emp.lastname);
    const row = employeeRow(page, emp.lastname);
    await expect(row).toContainText(`${emp.firstname}-ed`);
    await expect(row).toContainText('Supervisor QA');
    await clickRowMenuItem(page, row, 'Ver empleado');
    await expect(page.getByRole('textbox', { name: 'Nombre', exact: true })).toHaveValue(`${emp.firstname}-ed`);
    await page.getByRole('tab', { name: 'Datos de Contacto' }).click();
    await expect(page.getByRole('textbox', { name: 'Teléfono' })).toHaveValue('1166667777');
    await page.getByRole('tab', { name: 'Datos Laborales' }).click();
    await expect(page.getByRole('spinbutton', { name: 'Horas normales' })).toHaveValue('6');
  });

  test('"Editar empleado" del menú abre el formulario ya editable', async ({ page }) => {
    await openRowAction(page, 'Editar empleado');
    await expect(page).toHaveURL(/action=edit&employee_id=/);
    await expect(page.getByRole('textbox', { name: 'Apellido' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dar de baja' })).toBeVisible();
  });

  test('al editar, los campos obligatorios vacíos impiden guardar', async ({ page }) => {
    await openRowAction(page, 'Editar empleado');
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill('');
    await page.getByRole('tab', { name: 'Datos de Contacto' }).click();
    await page.getByRole('textbox', { name: 'Calle' }).fill('');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('La calle debe tener al menos 2 caracteres.')).toBeVisible();
    await page.getByRole('tab', { name: 'Datos Personales' }).click();
    await expect(page.getByText('El nombre debe tener al menos 2 caracteres.')).toBeVisible();
    await expect(page).toHaveURL(/action=edit/);
  });

  test('guardar sin tocar CUIL ni legajo no choca con el propio empleado y vuelve al listado', async ({ page }) => {
    await openRowAction(page, 'Editar empleado');
    await page.getByRole('tab', { name: 'Datos Laborales' }).click();
    // Las validaciones de duplicado excluyen al propio empleado: guardar sin cambios de identidad funciona.
    await expect(async () => {
      await page.getByRole('button', { name: 'Guardar cambios' }).click({ timeout: 3_000 });
      await expect(page.getByText('Empleado actualizado correctamente')).toBeVisible({ timeout: 6_000 });
    }).toPass({ timeout: 40_000 });
    // La edición (a diferencia del alta, H-01) deja al usuario en el listado.
    await expect(page).toHaveURL(/\/dashboard\/employee(\?.*)?$/);
    await expect(page.getByRole('tab', { name: 'Empleados activos' })).toBeVisible();
    await expect(page).not.toHaveURL(/action=/);
  });

  // H-02: el esquema de edición exige string en sindicato/convenio/categoría y el legajo trae null: cualquier empleado
  // sin sindicato falla con "Expected string, received null" y no se puede guardar. Corregido en schemas.ts
  // (guild_id/covenants_id/category_id: nullish); pendiente de deploy para quitar el fixme.
  test.fixme('un empleado sin sindicato se puede editar y guardar', async ({ page, browser, baseURL }) => {
    const sinSindicato = newEmployeeData('sinsind');
    try {
      await createEmployeeViaUi(page, sinSindicato);
      await page.goto('/dashboard/employee');
      await filterByLastname(page, sinSindicato.lastname);
      await clickRowMenuItem(page, employeeRow(page, sinSindicato.lastname), 'Editar empleado');
      await page.getByRole('tab', { name: 'Datos Laborales' }).click();
      await page.getByRole('textbox', { name: 'Puesto en la empresa' }).fill('Puesto nuevo');
      await expect(async () => {
        await page.getByRole('button', { name: 'Guardar cambios' }).click({ timeout: 3_000 });
        await expect(page.getByText('Empleado actualizado correctamente')).toBeVisible({ timeout: 6_000 });
      }).toPass({ timeout: 40_000 });
    } finally {
      await cleanupEmployees(browser, baseURL, [sinSindicato.lastname]);
    }
  });
});
