import { expect, test, type Page } from '@playwright/test';
import { PREFIX } from '../../helpers/env';
import { cleanupEmployees, createEmployeeViaUi, employeeRow, filterByLastname, newEmployeeData, clickRowMenuItem } from '../../helpers/employees';
import { hydrated } from '../../helpers/ui';

/** Novedad fija de la empresa QA: la pantalla no ofrece borrar novedades, por eso se reutiliza entre corridas. */
const NOVEDAD = `${PREFIX}Novedad`;
const NOVEDAD_CORTA = 'QAN';
const DIAGRAMS_URL = '/dashboard/employee?tab=diagrams';

const dayLabel = (offsetDays: number) =>
  new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })
    .format(new Date(Date.now() + offsetDays * 86_400_000));
const dmy = (offsetDays: number) =>
  new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })
    .format(new Date(Date.now() + offsetDays * 86_400_000));

async function openSubTab(page: Page, name: string) {
  const tab = page.getByRole('tab', { name, exact: true });
  await expect(async () => {
    if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click({ timeout: 3_000 });
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

async function gotoCompanyDiagrams(page: Page) {
  await page.goto(DIAGRAMS_URL);
  await expect(page.getByRole('tab', { name: 'Diagrama Cargados' })).toBeVisible();
}

/** Crea la novedad de prueba si todavía no existe (se detecta mirando las opciones del selector "Tipo de diagrama"). */
async function ensureNovedad(page: Page) {
  await gotoCompanyDiagrams(page);
  await openSubTab(page, 'Cargar Diagrama');
  await page.getByRole('combobox', { name: 'Tipo de diagrama' }).click();
  const exists = await page.getByRole('option', { name: NOVEDAD, exact: true }).isVisible();
  await page.keyboard.press('Escape');
  if (exists) return;

  await openSubTab(page, 'Tipos de Novedades');
  await hydrated(page.getByRole('button', { name: 'Limpiar formulario' }));
  // La pantalla abre en modo "Editar Novedad" con el formulario vacío: se limpia para volver a "Cargar novedad".
  await page.getByRole('button', { name: 'Limpiar formulario' }).click();
  await page.getByPlaceholder('Ingresa un nombre para la novedad').fill(NOVEDAD);
  await page.getByPlaceholder('Ingresa una descripción corta, ej: TD').fill(NOVEDAD_CORTA);
  await page.locator('input[type="color"]').fill('#ff0000');
  await page.getByRole('button', { name: 'Cargar novedad' }).click();
  await expect(page.getByText(`Novedad ${NOVEDAD} cargada con éxito`).first()).toBeVisible();
}

test.describe('empleados: diagramas de trabajo (novedades)', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const emp = newEmployeeData('diagrama');

  test.afterAll(async ({ browser, baseURL }) => {
    await cleanupEmployees(browser, baseURL, [emp.lastname]);
  });

  test('la pestaña Diagramas muestra la grilla de novedades y exige elegir empleados', async ({ page }) => {
    await gotoCompanyDiagrams(page);
    const panel = page.getByRole('tabpanel', { name: 'Diagramas' });
    await expect(panel.getByText('Diagramas de personal')).toBeVisible();
    await expect(panel.getByText('Selecciona al menos 1 recurso para ver su diagrama.')).toBeVisible();
    await expect(panel.getByText('La selección maxima es de 30 días')).toBeVisible();
    for (const sub of ['Diagrama Cargados', 'Cargar Diagrama', 'Tipos de Novedades']) {
      await expect(page.getByRole('tab', { name: sub, exact: true })).toBeVisible();
    }
  });

  test('la novedad exige nombre, descripción corta y color', async ({ page }) => {
    await gotoCompanyDiagrams(page);
    await openSubTab(page, 'Tipos de Novedades');
    await hydrated(page.getByRole('button', { name: 'Limpiar formulario' }));
    await page.getByRole('button', { name: 'Limpiar formulario' }).click();
    await expect(page.getByRole('button', { name: 'Cargar novedad' })).toBeVisible();
    await page.getByRole('button', { name: 'Cargar novedad' }).click();
    await expect(page.getByText('El nombre de la novedad no puede estar vacío')).toBeVisible();
    await expect(page.getByText('La descripción dorta no puede estar vacía')).toBeVisible();
  });

  test('se crea la novedad y queda disponible como "Tipo de diagrama"', async ({ page }) => {
    await ensureNovedad(page);
    await gotoCompanyDiagrams(page);
    await openSubTab(page, 'Cargar Diagrama');
    await page.getByRole('combobox', { name: 'Tipo de diagrama' }).click();
    await expect(page.getByRole('option', { name: NOVEDAD, exact: true })).toBeVisible();
  });

  // H-10: la tabla de "Tipos de Novedades" nunca lista las novedades (aunque la API responde 201 y aparecen como "Tipo de diagrama").
  test.fixme('la novedad creada aparece en la tabla de Tipos de Novedades', async ({ page }) => {
    await ensureNovedad(page);
    await gotoCompanyDiagrams(page);
    await openSubTab(page, 'Tipos de Novedades');
    await expect(page.getByRole('table', { name: 'Lista de novedades de diagrama' }).getByRole('row').filter({ hasText: NOVEDAD })).toBeVisible();
  });

  test('preparación: se crea el empleado al que se le cargará el diagrama', async ({ page }) => {
    await createEmployeeViaUi(page, emp);
  });

  test('cargar un diagrama desde el detalle del empleado genera los días y los crea', async ({ page }) => {
    await page.goto(`/dashboard/employee?lastname=${emp.lastname}`);
    await filterByLastname(page, emp.lastname);
    await clickRowMenuItem(page, employeeRow(page, emp.lastname), 'Ver empleado');
    await page.getByRole('tab', { name: 'Diagramas' }).click();
    await openSubTab(page, 'Nuevo Diagrama');

    const panel = page.getByRole('tabpanel', { name: 'Nuevo Diagrama' });
    await expect(panel.getByRole('combobox', { name: 'Empleado' })).toBeDisabled();
    await panel.getByRole('combobox', { name: 'Tipo de diagrama' }).click();
    await page.getByRole('option', { name: NOVEDAD, exact: true }).click();
    await panel.getByRole('button', { name: 'Selecciona un rango de fechas' }).click();
    await page.getByRole('button', { name: new RegExp(`^(Today, )?${dayLabel(0)}`) }).first().click();
    await page.getByRole('button', { name: new RegExp(`^${dayLabel(1)}`) }).first().click();
    await page.keyboard.press('Escape');
    await panel.getByRole('button', { name: 'Generar diagramas' }).click();

    await expect(panel.getByText('Diagramas correctos')).toBeVisible();
    await expect(panel.getByRole('row').filter({ hasText: dmy(0) })).toBeVisible();
    await expect(panel.getByRole('row').filter({ hasText: dmy(1) })).toBeVisible();
    await panel.getByRole('button', { name: 'Crear Todos' }).click();
    await expect(page.getByText('Diagramas creados correctamente').first()).toBeVisible();
  });

  test('los diagramas creados se listan en la pestaña Diagramas del empleado', async ({ page }) => {
    await page.goto(`/dashboard/employee?lastname=${emp.lastname}`);
    await filterByLastname(page, emp.lastname);
    await clickRowMenuItem(page, employeeRow(page, emp.lastname), 'Ver empleado');
    await page.getByRole('tab', { name: 'Diagramas' }).click();
    const panel = page.getByRole('tabpanel', { name: 'Diagramas' }).first();
    await expect(panel.getByRole('row').filter({ hasText: NOVEDAD }).first()).toBeVisible();
  });

  // H-11: la grilla "Diagrama Cargados" nunca muestra filas: agrupa los diagramas con `emp.id === diagram.employee_id`, pero
  // `employee_id` llega como objeto (así lo usa DiagramFormUpdated: `diagram.employee_id?.id`) y la comparación no coincide.
  // Se ve con el empleado seleccionado ("1 empleados seleccionados") y la grilla vacía.
  test.fixme('la grilla de diagramas de personal muestra la novedad del empleado en sus días', async ({ page }) => {
    await gotoCompanyDiagrams(page);
    const panel = page.getByRole('tabpanel', { name: 'Diagramas' });
    await expect(async () => {
      await panel.getByRole('combobox').filter({ hasText: 'empleados seleccionados' }).click({ timeout: 3_000 });
      await page.getByRole('option', { name: new RegExp(emp.lastname) }).click({ timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
    await page.keyboard.press('Escape');
    const row = panel.getByRole('row').filter({ hasText: emp.lastname });
    await expect(row).toBeVisible();
    await expect(row).toContainText(NOVEDAD_CORTA);
  });

  // H-12: el rango de fechas de la grilla se rotula "28/10/02026 - 27/11/02026" (año con cinco dígitos).
  test.fixme('el rango de fechas de la grilla se muestra con años de cuatro dígitos', async ({ page }) => {
    await gotoCompanyDiagrams(page);
    const panel = page.getByRole('tabpanel', { name: 'Diagramas' });
    await expect(panel.getByRole('button', { name: /\d{2}\/\d{2}\/\d{4} - \d{2}\/\d{2}\/\d{4}$/ })).toBeVisible();
  });
});
