import { expect, type Locator, type Page } from '@playwright/test';
import { cuilFor, uniqueIdentity } from './employees';
import { deactivateCustomerIfActive, gotoCompanyTab } from './company';
import { QA_COMPANY_ID } from './env';
import { clickHydrated } from './ui';

/** CUIT de empresa (prefijo 30) con dígito verificador válido. */
export function newCuit(): string {
  for (;;) {
    const cuit = cuilFor(uniqueIdentity().dni, '30');
    if (cuit) return cuit;
  }
}

/** Alta de un cliente por UI (el formulario a veces se vuelve a montar mientras carga: el llenado se reintenta antes de enviar). */
export async function createCustomerViaUi(page: Page, name: string, cuit = newCuit()) {
  await page.goto('/dashboard/company/actualCompany/customers/action?action=new');
  const nameBox = page.getByRole('textbox', { name: 'Nombre de la compañía' });
  const addressBox = page.getByRole('textbox', { name: 'Dirección', exact: true });
  await expect(nameBox).toBeVisible();
  await expect(async () => {
    await nameBox.fill(name, { timeout: 4_000 });
    await page.getByRole('textbox', { name: 'CUIT de la compañía' }).fill(cuit, { timeout: 4_000 });
    await page.getByRole('textbox', { name: 'Email' }).fill('cliente-qa@codecontrol.test', { timeout: 4_000 });
    await page.getByRole('textbox', { name: 'Número de teléfono' }).fill('1144445555', { timeout: 4_000 });
    await addressBox.fill('Calle Cliente 456', { timeout: 4_000 });
    await expect(nameBox).toHaveValue(name, { timeout: 2_000 });
    await expect(addressBox).toHaveValue('Calle Cliente 456', { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  await expect(page.getByText('Cliente creado satisfactoriamente!').first()).toBeVisible({ timeout: 20_000 });
}

/** Elige una opción de un `Select` de shadcn. */
export async function selectOption(page: Page, trigger: Locator, option: string) {
  await clickHydrated(trigger);
  await page.getByRole('option', { name: option, exact: true }).click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
}

/** Abre la pestaña Servicios de la empresa y una de sus dos solapas ("Cargar Servicio" o "Cargar Items"). */
export async function gotoServicesTab(page: Page, inner: 'Cargar Servicio' | 'Cargar Items'): Promise<Locator> {
  await gotoCompanyTab(page, 'Servicios');
  const trigger = page.getByRole('tab', { name: inner, exact: true });
  await expect(async () => {
    if ((await trigger.getAttribute('aria-selected')) !== 'true') await trigger.click({ timeout: 3_000 });
    await expect(trigger).toHaveAttribute('aria-selected', 'true', { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  return page.getByRole('tabpanel', { name: inner });
}

/** Día 15 de un mes relativo al actual (UTC), para elegirlo en un calendario. */
export function day15OfMonth(monthOffset: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 15));
}

/**
 * Crea un servicio de un cliente vigente desde el día 15 del mes anterior hasta el día 15 de dos meses más adelante: así sirve
 * para partes diarios de fechas cercanas (pasadas y futuras) y no figura como vencido.
 */
export async function createServiceViaUi(page: Page, customer: string, service: string) {
  const panel = await gotoServicesTab(page, 'Cargar Servicio');
  await selectOption(page, panel.getByRole('combobox', { name: 'Cliente' }), customer);
  await panel.getByRole('textbox', { name: 'Nombre del Servicio' }).fill(service);
  const dates = panel.getByRole('button', { name: /^\d{1,2}\/\d{1,2}\/\d{4}$/ });
  await pickCalendarDate(page, dates.nth(0), day15OfMonth(-1));
  await pickCalendarDate(page, dates.nth(1), day15OfMonth(2));
  await panel.getByRole('button', { name: 'Cargar', exact: true }).click();
  await expect(page.getByText('Servicio creado correctamente').first()).toBeVisible();
}

/** Crea un ítem de un servicio. */
export async function createItemViaUi(page: Page, customer: string, service: string, item: string) {
  const panel = await gotoServicesTab(page, 'Cargar Items');
  await selectOption(page, panel.getByRole('combobox', { name: 'Cliente' }), customer);
  await selectOption(page, panel.getByRole('combobox', { name: 'Servicio' }), service);
  await panel.getByRole('textbox', { name: 'Nombre del Item' }).fill(item);
  await panel.getByRole('textbox', { name: 'Descripcion del Item' }).fill('Ítem de prueba QA');
  await panel.getByRole('spinbutton', { name: 'Precio del Item' }).fill('100');
  const unit = panel.getByRole('combobox', { name: 'Unidad de Medida' });
  await clickHydrated(unit);
  await page.getByRole('option').first().click();
  await expect(unit).toHaveAttribute('aria-expanded', 'false');
  await panel.getByRole('button', { name: 'Cargar', exact: true }).click();
  await expect(page.getByText('Item creado correctamente').first()).toBeVisible();
}

/** Da de baja un servicio o ítem desde "Editar" de su fila (limpieza: la app solo permite desactivar). Tolerante si no existe. */
export async function deactivateServiceRow(page: Page, inner: 'Cargar Servicio' | 'Cargar Items', name: string) {
  const panel = await gotoServicesTab(page, inner);
  const row = panel.getByRole('row').filter({ hasText: name });
  if (!(await row.first().isVisible({ timeout: 5_000 }).catch(() => false))) return;
  await row.getByRole('button', { name: 'Editar' }).click();
  await panel.getByRole('button', { name: 'Dar de Baja' }).click();
  await expect(page.getByText(/desactivado correctamente/).first()).toBeVisible();
}

/** Limpieza completa de un cliente de prueba: ítem, servicio y cliente quedan dados de baja. */
export async function cleanupCustomerTree(page: Page, names: { item?: string; service?: string; customer: string }) {
  if (names.item) await deactivateServiceRow(page, 'Cargar Items', names.item);
  if (names.service) await deactivateServiceRow(page, 'Cargar Servicio', names.service);
  await deactivateCustomerIfActive(page, names.customer);
}

/**
 * Crea un ítem por la API de la app (la misma que usa el formulario). Es el atajo de preparación mientras el formulario
 * "Cargar Items" no deja elegir el servicio (H-20). Devuelve el id del ítem.
 */
export async function createItemViaApi(page: Page, service: string, item: string): Promise<string> {
  const list = await page.request.get(`/api/services?actual=${QA_COMPANY_ID}`);
  const { data } = (await list.json()) as { data: { services: { id: string; service_name: string }[] } };
  const serviceId = data.services.find((s) => s.service_name === service)?.id;
  if (!serviceId) throw new Error(`No se encontró el servicio ${service}`);
  const res = await page.request.post(`/api/services/items?actual=${QA_COMPANY_ID}`, {
    data: { customer_service_id: serviceId, item_name: item, item_description: 'Ítem de prueba QA', item_measure_units: 1, item_price: 100 },
  });
  expect(res.status()).toBe(201);
  const body = (await res.json()) as { data: { items: { id: string } } };
  return body.data.items.id;
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Fecha (dd/MM/yyyy) y valor ISO (yyyy-MM-dd) de un día, sin depender de la zona horaria del proceso. */
export function dayParts(date: Date) {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return { display: `${d}/${m}/${y}`, iso: `${y}-${m}-${d}` };
}

/**
 * Fecha tal como la muestra el listado de partes diarios en Argentina: la app interpreta "yyyy-MM-dd" como medianoche UTC y la
 * pinta en hora local, así que se ve un día antes que el elegido (H-22).
 */
export function listedDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Primer día libre (sin parte diario) entre 5 días atrás y 60 días adelante. Un parte solo se puede editar si su fecha no es
 * anterior a 6 días, y el servicio de prueba vale desde el mes anterior hasta dos meses adelante.
 */
export async function findFreeReportDate(page: Page): Promise<Date> {
  const today = new Date();
  for (let offset = -5; offset <= 60; offset += 1) {
    const candidate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + offset));
    const res = await page.request.get(`/api/daily-report/check-date?date=${dayParts(candidate).iso}&company_id=${QA_COMPANY_ID}`);
    const body = (await res.json()) as { data?: { exists?: boolean } };
    if (body.data?.exists === false) return candidate;
  }
  throw new Error('No hay fechas libres para crear un parte diario de prueba (la app no permite borrar partes)');
}

/** Elige un día en el calendario de un datepicker abierto desde `trigger` (el calendario abre en el mes actual; se navega hasta el día). */
export async function pickCalendarDate(page: Page, trigger: Locator, target: Date) {
  const calendar = page.getByRole('dialog').last();
  // Un clic anterior a la hidratación se pierde: se reintenta hasta que el calendario queda abierto.
  await expect(async () => {
    if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click({ timeout: 3_000 });
    await expect(calendar.getByRole('grid')).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  const now = new Date();
  const monthsAhead = (target.getUTCFullYear() - now.getUTCFullYear()) * 12 + target.getUTCMonth() - now.getUTCMonth();
  // El botón de mes queda tapado por una celda del calendario (el clic real cae en un día): se dispara el evento.
  // Según el calendario, el botón se llama en inglés o en español.
  const nav = calendar.getByRole('button', { name: monthsAhead >= 0 ? /Next Month|mes siguiente/i : /Previous Month|mes anterior/i });
  for (let i = 0; i < Math.abs(monthsAhead); i += 1) await nav.dispatchEvent('click');
  const label = new RegExp(`\\b${target.getUTCDate()} de ${MONTHS[target.getUTCMonth()]} de ${target.getUTCFullYear()}$`);
  await calendar.getByRole('button', { name: label }).click();
}
