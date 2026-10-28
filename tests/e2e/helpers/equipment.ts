import { expect, type Browser, type Locator, type Page } from '@playwright/test';
import { PREFIX } from './env';
import { TINY_PNG } from './employees';

export const EQUIPMENT_URL = '/dashboard/equipment';
/** Base pública del storage (RustFS) del clon; los buckets se llaman como en el código pero con `-`. */
export const STORAGE_PUBLIC_URL = process.env.E2E_STORAGE_URL ?? 'https://cc-s3.31.97.42.82.sslip.io';

export type NewEquipment = { intern: string; serie: string };

let counter = 0;
/** Número interno único por ejecución/worker (el campo es el identificador visible del equipo sin dominio). */
export function newEquipmentData(tag: string): NewEquipment {
  counter += 1;
  const id = `${Date.now().toString(36)}${counter}`;
  return { intern: `${PREFIX}${tag}-${id}`, serie: `${PREFIX}S-${id}` };
}

/** Elige una opción de una lista desplegable y la cierra (si queda abierta tapa el resto del formulario). */
async function pick(page: Page, combobox: string | RegExp, option: string) {
  const trigger = page.getByRole('combobox', { name: combobox });
  await trigger.click();
  await page.getByRole('option', { name: option, exact: true }).click();
  if ((await trigger.getAttribute('aria-expanded')) === 'true') await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
}

/** Completa el formulario de alta de un equipo de tipo "Otros" (sin dominio). */
export async function fillEquipmentForm(page: Page, e: NewEquipment, opts: { photo?: boolean } = {}) {
  await expect(page.getByRole('combobox', { name: /Tipo de equipo/ })).toBeVisible();
  await pick(page, /Tipo de equipo/, 'Otros');
  await pick(page, 'Marca *', 'Fiat');
  // Los modelos se cargan al elegir la marca.
  await expect(async () => {
    await page.getByRole('combobox', { name: 'Modelo *' }).click({ timeout: 3_000 });
    await expect(page.getByRole('option', { name: 'Cronos', exact: true })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await page.getByRole('option', { name: 'Cronos', exact: true }).click();
  if ((await page.getByRole('combobox', { name: 'Modelo *' }).getAttribute('aria-expanded')) === 'true') await page.keyboard.press('Escape');
  await page.getByRole('textbox', { name: 'Ano' }).fill('2020');
  await page.getByRole('textbox', { name: 'Ingrese el tipo de motor' }).fill('Motor QA');
  await pick(page, 'Tipo *', 'Tractor');
  await page.getByRole('textbox', { name: 'Ingrese la serie' }).fill(e.serie);
  await page.getByRole('textbox', { name: 'Ingrese el numero interno' }).fill(e.intern);
  if (opts.photo) await page.locator('input[type=file]').setInputFiles({ name: 'equipo.png', mimeType: 'image/png', buffer: TINY_PNG });
}

/** Alta completa por UI; termina en el listado de equipos. */
export async function createEquipmentViaUi(page: Page, e: NewEquipment, opts: { photo?: boolean } = {}) {
  await page.goto(`${EQUIPMENT_URL}/action?action=new`);
  await fillEquipmentForm(page, e, opts);
  await page.getByRole('button', { name: 'Agregar equipo' }).click();
  await expect(page).toHaveURL(/\/dashboard\/equipment$/);
}

/** Abre el listado (activos o inactivos) filtrado por la búsqueda global; devuelve la fila del equipo. */
export async function gotoEquipmentList(page: Page, intern: string, inactive = false): Promise<Locator> {
  await page.goto(`${EQUIPMENT_URL}?search=${encodeURIComponent(intern)}${inactive ? '&subtab=inactive' : ''}`);
  return page.getByRole('row').filter({ hasText: intern });
}

/** Id del equipo, tomado del enlace de su número interno en el listado. */
export async function equipmentIdOf(page: Page, intern: string): Promise<string> {
  const row = await gotoEquipmentList(page, intern);
  const href = await row.getByRole('link', { name: intern }).getAttribute('href');
  const id = new URL(href ?? '', 'http://x').searchParams.get('id');
  if (!id) throw new Error(`No se encontró el equipo ${intern} en el listado`);
  return id;
}

/** Abre el menú de la fila y elige una opción (reintenta: el menú se cierra si la tabla se vuelve a pintar). */
export async function clickEquipmentMenuItem(page: Page, row: Locator, item: string | RegExp) {
  const menuItem = page.getByRole('menuitem', { name: item });
  await expect(async () => {
    if (!(await menuItem.isVisible())) await row.getByRole('button', { name: 'Open menu' }).click({ timeout: 3_000 });
    await expect(menuItem).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await menuItem.click();
}

/** Da de baja un equipo desde el menú de su fila. Es también la limpieza de todos los tests. */
export async function deactivateEquipment(page: Page, intern: string) {
  const row = await gotoEquipmentList(page, intern);
  await expect(row).toBeVisible();
  await clickEquipmentMenuItem(page, row, 'Dar de baja equipo');
  const dialog = page.getByRole('dialog').filter({ hasText: 'Dar de baja Equipo' });
  await dialog.getByRole('combobox', { name: 'Motivo de Baja' }).click();
  await page.getByRole('option', { name: 'Fundido' }).click();
  await dialog.getByRole('button', { name: 'Fecha de Baja' }).click();
  await page.getByRole('button', { name: /^Today,/ }).click();
  if (await dialog.getByRole('button', { name: 'Fecha de Baja' }).getAttribute('aria-expanded') === 'true') await page.keyboard.press('Escape');
  await dialog.getByRole('button', { name: 'Dar de Baja' }).click();
  await expect(page.getByText('Equipo eliminado').first()).toBeVisible();
}

/** Limpieza de fin de grupo: da de baja los equipos de prueba que sigan activos (tolerante si no llegaron a crearse). */
export async function cleanupEquipment(browser: Browser, baseURL: string | undefined, interns: string[]) {
  const context = await browser.newContext({
    baseURL,
    storageState: 'tests/e2e/.auth/user.json',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
  });
  const page = await context.newPage();
  try {
    for (const intern of interns) {
      // Un fallo suelto (menú cerrado por un repintado, etc.) no debe dejar el equipo activo: se reintenta una vez.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const row = await gotoEquipmentList(page, intern);
        if (!(await row.first().isVisible({ timeout: 5_000 }).catch(() => false))) break;
        await deactivateEquipment(page, intern).catch(() => undefined);
      }
    }
  } finally {
    await context.close();
  }
}
