import { expect, test } from '@playwright/test';
import {
  cleanupEmployees,
  clickRowMenuItem,
  createEmployeeViaUi,
  employeeRow,
  filterByLastname,
  newEmployeeData,
  openTab,
} from '../../helpers/employees';

test.describe('empleados: listado (estructura, sin datos propios)', () => {
  test.use({ actionTimeout: 15_000 });

  test('la pantalla muestra sus cinco pestañas y el acceso al alta', async ({ page }) => {
    await page.goto('/dashboard/employee');
    for (const tab of ['Empleados', 'Documentos de empleados', 'Diagramas', 'Tipos de documentos', 'Convenios colectivos de trabajo']) {
      await expect(page.getByRole('tab', { name: tab, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('tab', { name: 'Empleados activos' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Empleados inactivos' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agregar nuevo empleado' })).toHaveAttribute('href', '/dashboard/employee/action?action=new');
  });

  test('"Agregar nuevo empleado" abre el formulario de alta', async ({ page }) => {
    await page.goto('/dashboard/employee');
    await expect(page.getByRole('tab', { name: 'Empleados activos' })).toBeVisible();
    await page.getByRole('link', { name: 'Agregar nuevo empleado' }).click();
    await expect(page).toHaveURL(/action=new/);
    await expect(page.getByRole('heading', { name: 'Agregar empleado' })).toBeVisible();
  });

  test('un apellido inexistente deja la tabla sin resultados', async ({ page }) => {
    await page.goto('/dashboard/employee');
    await filterByLastname(page, 'QA-E2E-NoExiste-Zzz');
    await expect(page.getByText('No se encontraron empleados.')).toBeVisible();
  });

  test('el filtro de apellido queda en la URL y se conserva al recargar', async ({ page }) => {
    await page.goto('/dashboard/employee');
    await filterByLastname(page, 'QA-E2E-NoExiste-Yyy');
    await expect(page).toHaveURL(/lastname=QA-E2E-NoExiste-Yyy/);
    await page.reload();
    await expect(page.getByRole('tabpanel', { name: 'Empleados activos' }).getByRole('button', { name: 'Apellido' })).toContainText('QA-E2E-NoExiste-Yyy');
  });

  test('el menú de filtros ofrece las columnas filtrables', async ({ page }) => {
    await page.goto('/dashboard/employee');
    await expect(async () => {
      await page.getByRole('tabpanel', { name: 'Empleados activos' }).getByRole('button', { name: 'Filtros' }).click();
      await expect(page.getByRole('option', { name: 'Género' })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    for (const f of ['Apellido', 'Estado', 'Provincia', 'CUIL', 'Legajo', 'Fecha de ingreso']) {
      await expect(page.getByRole('option', { name: f, exact: true })).toBeVisible();
    }
  });

  test('la pestaña Convenios colectivos de trabajo muestra el árbol de sindicatos de la empresa', async ({ page }) => {
    await page.goto('/dashboard/employee?tab=covenant');
    await openTab(page, 'Convenios colectivos de trabajo');
    const panel = page.getByRole('tabpanel', { name: 'Convenios colectivos de trabajo' });
    await expect(panel.getByText('Sindicatos', { exact: true })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Nuevo sindicato' })).toBeVisible();
  });

  test('la pestaña de inactivos tiene su propia tabla', async ({ page }) => {
    await page.goto('/dashboard/employee');
    await openTab(page, 'Empleados inactivos');
    await expect(page.getByRole('tabpanel', { name: 'Empleados inactivos' }).getByRole('table')).toBeVisible();
  });
});

test.describe('empleados: listado con un empleado de prueba', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });
  const emp = newEmployeeData('listado');

  test.afterAll(async ({ browser, baseURL }) => {
    await cleanupEmployees(browser, baseURL, [emp.lastname]);
  });

  test('preparación: se crea el empleado de prueba', async ({ page }) => {
    await createEmployeeViaUi(page, emp);
  });

  test('filtrar por apellido muestra solo ese empleado con sus datos', async ({ page }) => {
    await page.goto('/dashboard/employee');
    await filterByLastname(page, emp.lastname);
    const row = employeeRow(page, emp.lastname);
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(emp.cuil);
    await expect(row).toContainText(emp.dni);
    await expect(row).toContainText('DNI');
    await expect(row).toContainText('Operativo');
    await expect(row).toContainText('8');
  });

  test('filtrar por nombre y por estado', async ({ page }) => {
    await page.goto('/dashboard/employee');
    const panel = page.getByRole('tabpanel', { name: 'Empleados activos' });
    const nombre = panel.getByRole('button', { name: /^Nombre(?! completo)/ });
    await expect(async () => {
      if (!(await page.getByRole('textbox', { name: 'Buscar nombre...' }).isVisible())) await nombre.click({ timeout: 3_000 });
      await page.getByRole('textbox', { name: 'Buscar nombre...' }).fill(emp.firstname, { timeout: 3_000 });
      await page.getByRole('button', { name: 'Aplicar' }).click({ timeout: 3_000 });
      await expect(nombre).toContainText(emp.firstname, { timeout: 3_000 });
    }).toPass({ timeout: 25_000 });
    await page.keyboard.press('Escape');
    await expect(employeeRow(page, emp.lastname)).toHaveCount(1);

    await expect(async () => {
      if (!(await page.getByRole('option', { name: /No_avalado/ }).isVisible())) {
        await panel.getByRole('button', { name: /^Estado/ }).first().click({ timeout: 3_000 });
      }
      await page.getByRole('option', { name: /No_avalado/ }).click({ timeout: 3_000 });
    }).toPass({ timeout: 25_000 });
    await page.keyboard.press('Escape');
    await expect(employeeRow(page, emp.lastname)).toHaveCount(1);
  });

  test('la tabla muestra el contador de registros y los controles de paginación', async ({ page }) => {
    await page.goto(`/dashboard/employee?lastname=${emp.lastname}`);
    const panel = page.getByRole('tabpanel', { name: 'Empleados activos' });
    await expect(employeeRow(page, emp.lastname)).toHaveCount(1);
    await expect(panel.getByText('Mostrando 1 a 1 de 1 registros')).toBeVisible();
    await expect(panel.getByText('Filas por pagina')).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Ir a pagina siguiente' })).toBeDisabled();
  });

  // Con la tabla vacía el botón Excel no descarga nada: se prueba con el empleado de prueba en pantalla.
  test('el botón Excel descarga empleados.xlsx', async ({ page }) => {
    await page.goto(`/dashboard/employee?lastname=${emp.lastname}`);
    const panel = page.getByRole('tabpanel', { name: 'Empleados activos' });
    await expect(employeeRow(page, emp.lastname)).toHaveCount(1);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      panel.getByRole('button', { name: 'Excel' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('empleados.xlsx');
    expect(await download.path()).toBeTruthy();
  });

  test('"Limpiar" quita los filtros aplicados', async ({ page }) => {
    await page.goto(`/dashboard/employee?lastname=${emp.lastname}`);
    const panel = page.getByRole('tabpanel', { name: 'Empleados activos' });
    await expect(employeeRow(page, emp.lastname)).toHaveCount(1);
    await panel.getByRole('button', { name: 'Limpiar' }).click();
    await expect(panel.getByRole('button', { name: 'Apellido', exact: true })).not.toContainText(emp.lastname);
  });

  test('ocultar una columna desde "Columnas"', async ({ page }) => {
    await page.goto(`/dashboard/employee?lastname=${emp.lastname}`);
    const panel = page.getByRole('tabpanel', { name: 'Empleados activos' });
    await expect(panel.getByRole('columnheader', { name: 'Cuil' })).toBeVisible();
    await expect(async () => {
      await panel.getByRole('button', { name: 'Columnas' }).click();
      await page.getByRole('option', { name: 'Cuil' }).click({ timeout: 3_000 });
      await expect(panel.getByRole('columnheader', { name: 'Cuil' })).toHaveCount(0, { timeout: 3_000 });
    }).toPass({ timeout: 25_000 });
  });

  test('el menú de la fila ofrece ver, editar y dar de baja', async ({ page }) => {
    await page.goto(`/dashboard/employee?lastname=${emp.lastname}`);
    const row = employeeRow(page, emp.lastname);
    await clickRowMenuItem(page, row, 'Ver empleado');
    await expect(page).toHaveURL(/action=view&employee_id=/);
    await page.goBack();
    await clickRowMenuItem(page, employeeRow(page, emp.lastname), 'Editar empleado');
    await expect(page).toHaveURL(/action=edit&employee_id=/);
  });

  test('el nombre de la fila enlaza al detalle', async ({ page }) => {
    await page.goto(`/dashboard/employee?lastname=${emp.lastname}`);
    await employeeRow(page, emp.lastname).getByRole('link', { name: emp.fullName }).click();
    await expect(page).toHaveURL(/action=view&employee_id=/);
  });
});
