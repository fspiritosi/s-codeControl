import { deflateSync } from 'node:zlib';
import { expect, type Locator, type Page } from '@playwright/test';
import { PREFIX } from './env';
import { clickHydrated } from './ui';

export const MAINTENANCE_URL = '/dashboard/maintenance';

/** Abre la pantalla de mantenimiento en una de sus pestañas internas y devuelve el panel visible. */
export async function gotoMaintenanceTab(
  page: Page,
  tab: 'Solicitudes activas' | 'Solicitud de mantenimiento' | 'Tipos de reparaciones creados',
): Promise<Locator> {
  await page.goto(MAINTENANCE_URL);
  const trigger = page.getByRole('tab', { name: tab, exact: true });
  await expect(async () => {
    if ((await trigger.getAttribute('aria-selected')) !== 'true') await trigger.click({ timeout: 3_000 });
    await expect(trigger).toHaveAttribute('aria-selected', 'true', { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  return page.getByRole('tabpanel', { name: tab });
}

/** Elige una opción de un `Select` de shadcn (el menú se cierra solo al elegir). */
async function selectOption(page: Page, trigger: Locator, option: string) {
  await clickHydrated(trigger);
  await page.getByRole('option', { name: option, exact: true }).click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
}

/** Crea un tipo de reparación desde la pestaña "Tipos de reparaciones creados" y espera a verlo en la tabla. */
export async function createRepairType(page: Page, name: string, description: string) {
  const panel = await gotoMaintenanceTab(page, 'Tipos de reparaciones creados');
  await clickHydrated(panel.getByRole('textbox', { name: 'Ingresar nombre' }));
  await panel.getByRole('textbox', { name: 'Ingresar nombre' }).fill(name);
  await panel.getByRole('textbox', { name: 'Ingresa una descripción' }).fill(description);
  await selectOption(page, panel.getByRole('combobox', { name: 'Nivel de criticidad' }), 'Media');
  await selectOption(page, panel.getByRole('combobox', { name: 'Tipo de mantenimiento' }), 'Correctivo');
  await panel.getByRole('button', { name: 'Crear tipo de reparación' }).click();
  await expect(page.getByText('Tipo de reparación creado con éxito').first()).toBeVisible();
  await expect(panel.getByRole('row').filter({ hasText: name })).toBeVisible();
}

/** Elimina un tipo de reparación desde "Modificar" (limpieza). Tolerante si no existe. */
export async function deleteRepairTypeIfExists(page: Page, name: string) {
  const panel = await gotoMaintenanceTab(page, 'Tipos de reparaciones creados');
  const row = panel.getByRole('row').filter({ hasText: name });
  if (!(await row.first().isVisible({ timeout: 5_000 }).catch(() => false))) return;
  await clickHydrated(row.getByRole('button', { name: 'Modificar' }));
  await panel.getByRole('button', { name: 'Eliminar' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.getByText('Tipo de reparación eliminado con éxito').first()).toBeVisible();
}

export type NewVehicle = { intern: string; serie: string; domain: string; chassis: string };

let vehicleCounter = 0;
/** Datos únicos de un vehículo de prueba. El dominio (AA000AA, válido para años desde 2017) es único en toda la base. */
export function newVehicleData(tag: string): NewVehicle {
  vehicleCounter += 1;
  const stamp = Date.now() + vehicleCounter * 7919 + Math.floor(Math.random() * 1000);
  const letter = (n: number) => String.fromCharCode(65 + (n % 26));
  const domain = `Q${letter(stamp)}${String(stamp % 1000).padStart(3, '0')}${letter(Math.floor(stamp / 26))}${letter(Math.floor(stamp / 676))}`;
  const id = `${stamp.toString(36)}${vehicleCounter}`;
  return { intern: `${PREFIX}${tag}-${id}`, serie: `${PREFIX}S-${id}`, domain, chassis: `${PREFIX}CH-${id}` };
}

async function pickCombo(page: Page, combobox: string | RegExp, option: string | RegExp) {
  const trigger = page.getByRole('combobox', { name: combobox });
  await trigger.click();
  await page.getByRole('option', { name: option }).first().click();
  if ((await trigger.getAttribute('aria-expanded')) === 'true') await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
}

/**
 * Alta por UI de un equipo de tipo "Vehículos" con kilometraje. Las solicitudes de reparación necesitan que el equipo
 * tenga kilometraje: con un equipo "Otros" (kilometraje nulo) el formulario no deja agregar la reparación (H-18).
 */
export async function createVehicleViaUi(page: Page, v: NewVehicle, kilometer = '1000') {
  await page.goto('/dashboard/equipment/action?action=new');
  await pickCombo(page, /Tipo de equipo/, 'Vehículos');
  await pickCombo(page, 'Marca *', 'Fiat');
  // Los modelos se cargan al elegir la marca y la lista se repinta: se reintenta abrir, elegir y comprobar.
  const model = page.getByRole('combobox', { name: 'Modelo *' });
  await expect(async () => {
    if ((await model.getAttribute('aria-expanded')) !== 'true') await model.click({ timeout: 3_000 });
    await page.getByRole('option', { name: 'Cronos', exact: true }).click({ timeout: 3_000 });
    await expect(model).toContainText('Cronos', { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  if ((await model.getAttribute('aria-expanded')) === 'true') await page.keyboard.press('Escape');
  await page.getByRole('textbox', { name: 'Ano' }).fill('2020');
  await page.getByRole('textbox', { name: 'Kilometraje' }).fill(kilometer);
  await page.getByRole('textbox', { name: 'Ingrese el tipo de motor' }).fill('Motor QA');
  await pickCombo(page, 'Tipo *', /./);
  await page.getByRole('textbox', { name: 'Ingrese el chasis' }).fill(v.chassis);
  await page.getByRole('textbox', { name: 'Ingrese el dominio' }).fill(v.domain);
  await page.getByRole('textbox', { name: 'Ingrese el numero interno' }).fill(v.intern);
  await page.getByRole('button', { name: 'Agregar equipo' }).click();
  await expect(page).toHaveURL(/\/dashboard\/equipment$/);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/**
 * PNG de un solo color de `size` x `size` píxeles, generado en el test. Con una imagen de 1x1 el optimizador de imágenes
 * de Next devuelve un archivo que el navegador no decodifica, así que las pruebas de "carga en pantalla" usan una más grande.
 */
export function solidPng(size = 48, rgb: [number, number, number] = [220, 38, 38]): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.writeUInt8(8, 8); // profundidad de bits
  header.writeUInt8(2, 9); // color verdadero RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: size }, () => rgb).flat())]);
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}
