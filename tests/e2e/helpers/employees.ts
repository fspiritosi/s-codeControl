import { expect, type Browser, type Locator, type Page } from '@playwright/test';
import { PREFIX } from './env';
import { TREE } from './company';

/** Dígito verificador del CUIL (mismo algoritmo que `validarCUIL` de la app). */
export function cuilFor(dni: string, prefix = '20'): string {
  const base = `${prefix}${dni}`;
  const coef = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = [...base].reduce((acc, d, i) => acc + Number(d) * coef[i], 0);
  let dv = 11 - (suma % 11);
  if (dv === 11) dv = 0;
  // dv = 10 no tiene CUIL válido con ese prefijo: el llamador reintenta con otro DNI.
  return dv === 10 ? '' : `${base}${dv}`;
}

let counter = 0;
/** DNI de 8 dígitos y legajo únicos por ejecución/worker, con un CUIL válido que lo contiene. */
export function uniqueIdentity() {
  for (;;) {
    counter += 1;
    const seed = Date.now() + counter * 7919 + Math.floor(Math.random() * 1000);
    // Rango 99.xxx.xxx: no existe en la vida real. La edición del legajo actualiza por DNI sin filtrar
    // por empresa (hallazgo H-03), así que un DNI real de otra empresa podría pisarse.
    const dni = String(99_000_000 + (seed % 1_000_000));
    const cuil = cuilFor(dni);
    if (!cuil) continue;
    return { dni, cuil, file: String(seed % 1_000_000_000) };
  }
}

export type NewEmployee = {
  firstname: string;
  lastname: string;
  dni: string;
  cuil: string;
  file: string;
  fullName: string;
};

export function newEmployeeData(tag: string): NewEmployee {
  const id = uniqueIdentity();
  const firstname = `${PREFIX}${tag}`;
  const lastname = `Prueba${id.dni.slice(-4)}`;
  return { firstname, lastname, ...id, fullName: `${lastname} ${firstname}` };
}

async function pick(page: Page, combobox: string | RegExp, option: string | RegExp) {
  await page.getByRole('combobox', { name: combobox }).click();
  await page.getByRole('option', { name: option }).first().click();
}

/**
 * Elige una fecha de un datepicker: año en el combo del popover y el día 15 del mes que muestre el calendario
 * (cada datepicker abre en un mes distinto tras elegir el año; el día 15 nunca es un día "de relleno" de otro mes).
 */
export async function pickDate(page: Page, trigger: string | RegExp, year: number) {
  await page.getByRole('button', { name: trigger }).click();
  const popover = page.getByRole('dialog').last();
  await popover.getByRole('combobox').click();
  await page.getByRole('option', { name: String(year), exact: true }).click();
  await popover.getByRole('button', { name: new RegExp(`, 15 de \\S+ de ${year}`) }).click();
  if (await popover.isVisible()) await page.keyboard.press('Escape');
}

export async function fillPersonal(page: Page, e: NewEmployee) {
  await page.getByRole('tab', { name: 'Datos Personales' }).click();
  await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(e.firstname);
  await page.getByRole('textbox', { name: 'Apellido' }).fill(e.lastname);
  await pick(page, 'Nacionalidad *', 'Argentina');
  await pickDate(page, /Fecha de nacimiento/, 1990);
  await page.getByRole('textbox', { name: 'CUIL' }).fill(e.cuil);
  await pick(page, 'Tipo de documento *', 'DNI');
  await page.getByRole('textbox', { name: 'Numero de documento' }).fill(e.dni);
  await pick(page, 'País de nacimiento *', 'Argentina');
  await pick(page, 'Sexo *', 'Masculino');
  await pick(page, 'Estado civil *', 'Soltero');
  await pick(page, 'Nivel de instrucción *', 'Secundario');
}

export async function fillContact(page: Page) {
  await page.getByRole('tab', { name: 'Datos de Contacto' }).click();
  await page.getByRole('textbox', { name: 'Calle' }).fill('Calle de Prueba');
  await page.getByRole('textbox', { name: 'Altura' }).fill('123');
  await pick(page, 'Provincia *', 'Buenos Aires');
  await page.getByRole('combobox', { name: 'Ciudad *' }).click();
  await page.getByRole('option', { name: '25 de Mayo' }).click();
  await page.getByRole('textbox', { name: 'Codigo postal' }).fill('1900');
  await page.getByRole('textbox', { name: 'Teléfono' }).fill('1155550000');
  await page.getByRole('textbox', { name: 'Email' }).fill('qa-e2e-empleado@codecontrol.test');
}

export async function fillLabor(page: Page, e: NewEmployee) {
  await page.getByRole('tab', { name: 'Datos Laborales' }).click();
  await page.getByRole('spinbutton', { name: 'Legajo' }).fill(e.file);
  await pick(page, 'Puesto Jerarquico *', 'Operativo');
  await page.getByRole('textbox', { name: 'Puesto en la empresa' }).fill('Operador QA');
  await pick(page, 'Diagrama de trabajo *', 'Lunes a Viernes');
  await page.getByRole('spinbutton', { name: 'Horas normales' }).fill('8');
  await pick(page, 'Tipo de contrato *', 'A tiempo indeterminado');
  await pickDate(page, /Fecha de ingreso/, 2024);
}

/** Sindicato > Convenio > Categoría de prueba (deben existir: `ensureCovenantTree`). */
export async function fillCovenant(page: Page) {
  await page.getByRole('tab', { name: 'Datos Laborales' }).click();
  for (const [label, value] of [['Sindicato', TREE.guild], ['Convenio', TREE.covenant], ['Categoria', TREE.category]] as const) {
    await page.getByRole('combobox', { name: label }).click();
    await page.getByRole('option', { name: value }).click();
  }
}

export async function fillEmployeeForm(page: Page, e: NewEmployee, opts: { covenant?: boolean } = {}) {
  await fillPersonal(page, e);
  await fillContact(page);
  await fillLabor(page, e);
  if (opts.covenant) await fillCovenant(page);
}

/** Alta completa por UI; termina en el listado. */
export async function createEmployeeViaUi(page: Page, e: NewEmployee, opts: { covenant?: boolean } = {}) {
  await page.goto('/dashboard/employee/action?action=new');
  await expect(page.getByRole('tab', { name: 'Datos Personales' })).toBeVisible();
  await fillEmployeeForm(page, e, opts);
  await page.getByRole('button', { name: 'Agregar empleado' }).click();
  await expect(page.getByText('Empleado agregado correctamente')).toBeVisible();
  // Tras el alta la app vuelve sola al formulario vacío (hallazgo H-01): se va al listado explícitamente.
  await page.goto('/dashboard/employee');
  await expect(page.getByRole('tab', { name: 'Empleados activos' })).toBeVisible();
}

/** Cambia de pestaña reintentando: un clic previo a la hidratación de React se pierde sin aviso. */
export async function openTab(page: Page, name: string | RegExp) {
  const tab = page.getByRole('tab', { name });
  await expect(async () => {
    if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click({ timeout: 3_000 });
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

/** Filtra el listado (pestaña activos o inactivos) por apellido con el filtro de texto de la barra. */
export async function filterByLastname(page: Page, lastname: string, tab = 'Empleados activos') {
  const panel = page.getByRole('tabpanel', { name: tab });
  const input = page.getByRole('textbox', { name: 'Buscar apellido...' });
  const tabTrigger = page.getByRole('tab', { name: tab, exact: true });
  // La página termina de cargar sus datos después de pintarse y en ese momento vuelve a la pestaña "activos" y
  // recompone la barra (cierra el popover): se reintenta toda la secuencia, incluida la pestaña.
  await expect(async () => {
    if ((await tabTrigger.getAttribute('aria-selected')) !== 'true') await tabTrigger.click({ timeout: 3_000 });
    if (!(await input.isVisible())) await panel.getByRole('button', { name: 'Apellido' }).click({ timeout: 3_000 });
    await input.fill(lastname, { timeout: 3_000 });
    await page.getByRole('button', { name: 'Aplicar' }).click({ timeout: 3_000 });
    await expect(panel.getByRole('button', { name: 'Apellido' })).toContainText(lastname, { timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
  await page.keyboard.press('Escape');
}

/** Fila del listado de empleados por apellido (el apellido de prueba es único por empleado). */
export const employeeRow = (page: Page, lastname: string) => page.getByRole('row').filter({ hasText: lastname });

/** Abre el menú de la fila y elige una opción (reintenta el clic: el menú se cierra si la tabla se vuelve a pintar). */
export async function clickRowMenuItem(page: Page, row: Locator, item: string | RegExp) {
  const menuItem = page.getByRole('menuitem', { name: item });
  await expect(async () => {
    if (!(await menuItem.isVisible())) await row.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(menuItem).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await menuItem.click();
}

/** Completa el diálogo "Dar de baja" (motivo + fecha). Sirve para el del listado y el del detalle. */
export async function fillTerminationDialog(page: Page, reason = 'Renuncia') {
  const dialog = page.getByRole('dialog').filter({ hasText: 'Dar de baja' });
  await dialog.getByRole('combobox').first().click();
  await page.getByRole('option', { name: reason }).click();
  await pickDate(page, /Fecha de baja/, new Date().getFullYear() - 1);
  await dialog.getByRole('button', { name: 'Eliminar' }).click();
}

/** Da de baja desde el menú de la fila del listado de activos. Es también la limpieza de todos los tests. */
export async function deactivateFromList(page: Page, lastname: string) {
  await page.goto('/dashboard/employee');
  await filterByLastname(page, lastname);
  const row = employeeRow(page, lastname);
  await clickRowMenuItem(page, row, 'Dar de baja');
  await fillTerminationDialog(page);
  await expect(page.getByText('Emplead@ eliminado').or(page.getByText('Empleado eliminado'))).toBeVisible();
}

/**
 * Limpieza de fin de grupo: deja dados de baja a los empleados de prueba que sigan activos. Abre su propio contexto
 * (los hooks `afterAll` no reciben `page`). Es tolerante: si el empleado no llegó a crearse, lo saltea.
 */
export async function cleanupEmployees(browser: Browser, baseURL: string | undefined, lastnames: string[]) {
  const context = await browser.newContext({
    baseURL,
    storageState: 'tests/e2e/.auth/user.json',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
  });
  const page = await context.newPage();
  try {
    for (const lastname of lastnames) {
      await page.goto('/dashboard/employee');
      await filterByLastname(page, lastname);
      const row = employeeRow(page, lastname);
      if (!(await row.first().isVisible({ timeout: 3_000 }).catch(() => false))) continue;
      await clickRowMenuItem(page, row, 'Dar de baja');
      await fillTerminationDialog(page);
      await expect(page.getByText('Empleado eliminado')).toBeVisible();
    }
  } finally {
    await context.close();
  }
}

/** PNG de 1x1 píxel para probar la subida de fotos. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
