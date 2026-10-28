import { expect, type Browser, type Locator, type Page } from '@playwright/test';
import { clickHydrated, hydrated } from './ui';

export const DOCS_URL = '/dashboard/document';
export const DOC_TYPES_URL = `${DOCS_URL}?tab=types`;

export type DocScope = 'Persona' | 'Equipos' | 'Empresa';
export type DocTypeOptions = {
  appliesTo: DocScope;
  expires?: boolean;
  monthly?: boolean;
  multi?: boolean;
  termination?: boolean;
  vtv?: boolean;
  description?: string;
};

/** Contenido distinguible de un PDF mínimo para comprobar que lo descargado es lo subido. */
export const pdf = (marker: string) => ({
  name: `${marker}.pdf`,
  mimeType: 'application/pdf',
  buffer: Buffer.from(`%PDF-1.4\n% ${marker}\n%%EOF`),
});

export const typeRow = (page: Page, name: string) => page.getByRole('row').filter({ hasText: name });

/** Crea un tipo de documento (siempre NO obligatorio: uno obligatorio contamina a las demás suites). */
export async function createDocType(page: Page, name: string, opts: DocTypeOptions) {
  await page.goto(DOC_TYPES_URL);
  await clickHydrated(page.getByRole('button', { name: 'Crear nuevo' }));
  const dialog = page.getByRole('dialog', { name: 'Nuevo Tipo de Documento' });
  await dialog.getByRole('textbox', { name: 'Nombre *' }).fill(name);
  await dialog.getByRole('combobox').click();
  await page.getByRole('option', { name: opts.appliesTo, exact: true }).click();
  if (opts.expires) await dialog.getByRole('checkbox', { name: 'Tiene vencimiento' }).check();
  if (opts.monthly) await dialog.getByRole('checkbox', { name: 'Es mensual' }).check();
  if (opts.multi) await dialog.getByRole('checkbox', { name: 'Multi recurso' }).check();
  if (opts.vtv) await dialog.getByRole('checkbox', { name: /Es VTV/ }).check();
  if (opts.termination) await dialog.getByRole('checkbox', { name: 'Documento de baja' }).check();
  if (opts.description) await dialog.getByRole('textbox', { name: 'Descripción' }).fill(opts.description);
  await dialog.getByRole('button', { name: 'Crear', exact: true }).click();
  await expect(page.getByText('Tipo de documento creado').first()).toBeVisible();
  await expect(typeRow(page, name)).toBeVisible();
}

/** Abre el menú de la fila de un tipo y elige una opción (reintenta: el menú se cierra si la tabla se repinta). */
export async function clickTypeMenuItem(page: Page, name: string, item: string) {
  const menuItem = page.getByRole('menuitem', { name: item });
  await expect(async () => {
    if (!(await menuItem.isVisible())) await typeRow(page, name).getByRole('button', { name: 'Abrir menú' }).click({ timeout: 3_000 });
    await expect(menuItem).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await menuItem.click();
}

/** Desactiva un tipo (con documentos cargados la app no deja eliminarlo). Tolerante si no existe o ya está inactivo. */
export async function deactivateDocType(page: Page, name: string) {
  await page.goto(DOC_TYPES_URL);
  await hydrated(page.getByRole('button', { name: 'Crear nuevo' }));
  if (!(await typeRow(page, name).isVisible({ timeout: 5_000 }).catch(() => false))) return;
  await clickTypeMenuItem(page, name, 'Desactivar');
  await expect(page.getByText('Tipo de documento desactivado').first()).toBeVisible();
}

/** Limpieza de fin de grupo: desactiva tipos de documento de prueba en un contexto propio. */
export async function cleanupDocTypes(browser: Browser, baseURL: string | undefined, names: string[]) {
  const context = await browser.newContext({
    baseURL,
    storageState: 'tests/e2e/.auth/user.json',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
  });
  const page = await context.newPage();
  try {
    for (const name of names) await deactivateDocType(page, name);
  } finally {
    await context.close();
  }
}

/** Año calendario del próximo año: las fechas de vencimiento de prueba quedan siempre en el futuro. */
export const nextYear = () => new Date().getFullYear() + 1;

/** Elige el día 15 de un año en un calendario con selector de año (cierra el calendario). */
export async function pickDocDate(page: Page, trigger: Locator, year: number) {
  await trigger.click();
  const popover = page.getByRole('dialog').last();
  await popover.getByRole('combobox').first().click();
  await page.getByRole('option', { name: String(year), exact: true }).click();
  await popover.getByRole('button', { name: new RegExp(`, 15 de \\S+ de ${year}`) }).click();
  if (await popover.isVisible()) await page.keyboard.press('Escape');
}

/** Cierra las listas desplegables que quedaron abiertas dentro del diálogo y verifica que no tapen el botón de archivo. */
export async function closeDropdowns(page: Page, dialog: Locator, names: string[]) {
  for (const name of names) {
    const combo = dialog.getByRole('combobox', { name });
    if ((await combo.getAttribute('aria-expanded')) === 'true') await page.keyboard.press('Escape');
    await expect(combo).toHaveAttribute('aria-expanded', 'false');
  }
}

export async function chooseFile(page: Page, dialog: Locator, file: ReturnType<typeof pdf>) {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    dialog.getByRole('button', { name: 'Seleccionar archivo' }).click(),
  ]);
  await chooser.setFiles(file);
}

/** Carga un documento "no multirecurso" a un equipo desde la pestaña Documentos de equipos. */
export async function uploadEquipmentDoc(
  page: Page,
  o: { equipment: string | RegExp; type: string; file: ReturnType<typeof pdf>; expiryYear?: number; period?: boolean; vtv?: boolean },
) {
  await page.goto(`${DOCS_URL}?tab=equipment`);
  await clickHydrated(page.getByRole('button', { name: 'Documento No Multirecurso' }));
  const dialog = page.getByRole('alertdialog', { name: 'Cargar documento' });
  await dialog.getByRole('tab', { name: 'Equipos' }).click();
  await dialog.getByRole('combobox', { name: 'Equipo' }).click();
  await page.getByRole('option', { name: o.equipment }).click();
  await page.keyboard.press('Escape'); // cierra la lista de equipos (queda abierto el diálogo)
  await dialog.getByRole('combobox', { name: 'Tipo de documento' }).click();
  await page.getByRole('option', { name: o.type, exact: true }).click();
  await closeDropdowns(page, dialog, ['Tipo de documento', 'Equipo']);
  if (o.expiryYear) await pickDocDate(page, dialog.getByRole('button', { name: 'Selecciona una fecha' }), o.expiryYear);
  if (o.period) await pickPeriod(page, dialog);
  await chooseFile(page, dialog, o.file);
  await dialog.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Documento cargado correctamente').first()).toBeVisible();
}

/** Fila del listado de documentos (de empleados o equipos) por recurso y tipo. */
export const docRow = (page: Page, resource: string | RegExp, type: string) =>
  page.getByRole('row').filter({ hasText: resource }).filter({ hasText: type });

/** Abre el menú de acciones de una fila de documentos y elige una opción. */
export async function clickDocMenuItem(page: Page, row: Locator, item: string | RegExp) {
  const menuItem = page.getByRole('menuitem', { name: item });
  await expect(async () => {
    if (!(await menuItem.isVisible())) await row.getByRole('button', { name: 'Abrir menu' }).click({ timeout: 3_000 });
    await expect(menuItem).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await menuItem.click();
}

/** Elige el período (año/mes) del selector de documentos mensuales: al fijar el año queda el mes actual. */
export async function pickPeriod(page: Page, scope: Locator) {
  await scope.getByRole('button', { name: 'Selecciona un período' }).click();
  const popover = page.getByRole('dialog').last();
  await popover.getByRole('combobox').first().click();
  await page.getByRole('option', { name: String(new Date().getFullYear()), exact: true }).click();
  if (await popover.isVisible()) await page.keyboard.press('Escape');
  await expect(scope).not.toContainText('Selecciona un período');
}

/** Carga un documento multirecurso a varios equipos (mínimo dos) desde la pestaña Documentos de equipos. */
export async function uploadMultiEquipmentDoc(
  page: Page,
  o: { equipments: (string | RegExp)[]; type: string; file: ReturnType<typeof pdf> },
) {
  await page.goto(`${DOCS_URL}?tab=equipment`);
  await clickHydrated(page.getByRole('button', { name: 'Documento Multirecurso', exact: true }));
  const dialog = page.getByRole('alertdialog', { name: 'Cargar documento multirecurso' });
  await dialog.getByRole('tab', { name: 'Equipos' }).click();
  await dialog.getByRole('combobox', { name: 'Tipo de documento' }).click();
  await page.getByRole('option', { name: o.type, exact: true }).click();
  await closeDropdowns(page, dialog, ['Tipo de documento']);
  const resources = dialog.getByRole('combobox').nth(1);
  await resources.click();
  for (const equipment of o.equipments) await page.getByRole('option', { name: equipment }).click();
  if ((await resources.getAttribute('aria-expanded')) === 'true') await page.keyboard.press('Escape');
  await expect(resources).toHaveAttribute('aria-expanded', 'false');
  await chooseFile(page, dialog, o.file);
  await dialog.getByRole('button', { name: 'Enviar' }).click();
  // El formulario multirecurso no muestra aviso: al terminar de subir cierra el diálogo.
  await expect(dialog).toHaveCount(0);
}

/** Carga un documento "no multirecurso" a un empleado desde Documentos de empleados. */
export async function uploadEmployeeDoc(
  page: Page,
  o: { lastname: string; type: string; file: ReturnType<typeof pdf>; period?: boolean },
) {
  await page.goto(DOCS_URL);
  await clickHydrated(page.getByRole('button', { name: 'Documento No Multirecurso' }));
  const dialog = page.getByRole('alertdialog', { name: 'Cargar documento' });
  await dialog.getByRole('combobox', { name: 'Empleado' }).click();
  await page.getByRole('option', { name: new RegExp(o.lastname) }).click();
  await page.keyboard.press('Escape'); // cierra la lista de empleados (queda abierto el diálogo)
  await dialog.getByRole('combobox', { name: 'Tipo de documento' }).click();
  await page.getByRole('option', { name: o.type, exact: true }).click();
  await closeDropdowns(page, dialog, ['Tipo de documento', 'Empleado']);
  if (o.period) await pickPeriod(page, dialog);
  await chooseFile(page, dialog, o.file);
  await dialog.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Documento cargado correctamente').first()).toBeVisible();
}

/** Carga un documento multirecurso a varios empleados (mínimo dos). */
export async function uploadMultiEmployeeDoc(
  page: Page,
  o: { lastnames: string[]; type: string; file: ReturnType<typeof pdf> },
) {
  await page.goto(DOCS_URL);
  await clickHydrated(page.getByRole('button', { name: 'Documento Multirecurso', exact: true }));
  const dialog = page.getByRole('alertdialog', { name: 'Cargar documento multirecurso' });
  await dialog.getByRole('combobox', { name: 'Tipo de documento' }).click();
  await page.getByRole('option', { name: o.type, exact: true }).click();
  await closeDropdowns(page, dialog, ['Tipo de documento']);
  const resources = dialog.getByRole('combobox').nth(1);
  await resources.click();
  for (const lastname of o.lastnames) await page.getByRole('option', { name: new RegExp(lastname) }).click();
  if ((await resources.getAttribute('aria-expanded')) === 'true') await page.keyboard.press('Escape');
  await expect(resources).toHaveAttribute('aria-expanded', 'false');
  await chooseFile(page, dialog, o.file);
  await dialog.getByRole('button', { name: 'Enviar' }).click();
  await expect(dialog).toHaveCount(0);
}
