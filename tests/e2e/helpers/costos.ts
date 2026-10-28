import { expect, type Locator, type Page } from '@playwright/test';
import { QA_COMPANY_ID } from './env';
import { STORAGE_PUBLIC_URL } from './equipment';
import { FIXED_CUSTOMER } from './sales';
import { clickHydrated, hydrated } from './ui';

export const COSTOS_URL = '/dashboard/costos';
export const COSTOS_BUCKET = 'costos-pdfs';
/** CCT fijo de la suite: la app no permite borrar convenios, así que se crea una vez y se reutiliza. */
export const FIXED_CCT = { codigo: 'QA-E2E-CCT', nombre: 'QA-E2E-Convenio', vigencia: '2026-01' };
/** Categoría fija del CCT fijo (la usan las asignaciones de mano de obra del servicio fijo). */
export const FIXED_CATEGORY = { codigo: 'QA-FIJA', nombre: 'QA-E2E-Categoria-Fija' };
/** Servicio fijo: la app no ofrece borrar servicios (ni sus composiciones y fórmula), así que se crea una vez y se reutiliza. */
export const FIXED_SERVICE = 'QA-E2E-Servicio';
/** Período fijo de la composición: se genera con upsert por (servicio, período), repetirla no acumula datos. */
export const COMPOSITION_PERIOD = '2026-01';

/** Botones de ícono de una fila de tabla, en orden de aparición (la app no les pone nombre accesible). */
export const rowIconButtons = (row: Locator) => row.getByRole('button');

/** Elige una opción de un `Select` de shadcn y espera a que se cierre. */
export async function selectOption(page: Page, trigger: Locator, option: string | RegExp) {
  await clickHydrated(trigger);
  await page.getByRole('option', { name: option }).first().click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
}

const cctCard = (page: Page) => page.locator('a[href^="?cctId="]').filter({ hasText: FIXED_CCT.codigo });

/** Abre el configurador de CCT con el convenio fijo seleccionado, creándolo si todavía no existe. */
export async function openFixedCct(page: Page): Promise<void> {
  await page.goto(`${COSTOS_URL}/configuracion-cct`);
  const newButton = page.getByRole('button', { name: 'Nuevo CCT' });
  await hydrated(newButton);
  const link = cctCard(page);
  if (!(await link.isVisible({ timeout: 2_000 }).catch(() => false))) {
    await newButton.click();
    const dialog = page.getByRole('dialog', { name: 'Nuevo convenio colectivo' });
    await dialog.locator('#cct_codigo').fill(FIXED_CCT.codigo);
    await dialog.locator('#vigencia_desde').fill(FIXED_CCT.vigencia);
    await dialog.locator('#cct_nombre').fill(FIXED_CCT.nombre);
    await dialog.getByRole('button', { name: 'Crear CCT' }).click();
    await page.waitForURL(/cctId=/);
    await expect(link).toBeVisible();
  }
  await link.click();
  await page.waitForURL(/cctId=/);
  await expect(page.getByRole('tab', { name: 'Categorías' })).toBeVisible();
}

/** Crea la categoría fija del CCT fijo si no existe (deja el configurador abierto en ese convenio). */
export async function ensureFixedCategory(page: Page) {
  await openFixedCct(page);
  if (await page.getByRole('row').filter({ hasText: FIXED_CATEGORY.codigo }).isVisible({ timeout: 2_000 }).catch(() => false)) return;
  await clickHydrated(page.getByRole('button', { name: 'Agregar categoría' }));
  const dialog = page.getByRole('dialog', { name: 'Nueva categoría' });
  await dialog.locator('#cat_codigo').fill(FIXED_CATEGORY.codigo);
  await dialog.locator('#cat_nombre').fill(FIXED_CATEGORY.nombre);
  await dialog.getByRole('button', { name: 'Crear categoría' }).click();
  await expect(page.getByRole('row').filter({ hasText: FIXED_CATEGORY.codigo })).toBeVisible();
}

/** Abre el detalle del servicio fijo y devuelve su id (lo crea si todavía no existe). Requiere el CCT y el cliente fijos. */
export async function openFixedService(page: Page): Promise<string> {
  await page.goto(`${COSTOS_URL}/servicios`);
  const newButton = page.getByRole('button', { name: 'Nuevo servicio' });
  await hydrated(newButton);
  const row = page.getByRole('row').filter({ hasText: FIXED_SERVICE });
  if (!(await row.isVisible({ timeout: 2_000 }).catch(() => false))) {
    await newButton.click();
    const dialog = page.getByRole('dialog', { name: 'Nuevo servicio / contrato' });
    await dialog.locator('#nombre').fill(FIXED_SERVICE);
    await selectOption(page, dialog.getByRole('combobox').nth(0), FIXED_CUSTOMER);
    await selectOption(page, dialog.getByRole('combobox').nth(1), new RegExp(FIXED_CCT.codigo));
    await dialog.locator('#fecha_inicio').fill('2026-01-01');
    await dialog.getByRole('button', { name: 'Crear servicio' }).click();
    await expect(page.getByText('Servicio creado').first()).toBeVisible();
    await expect(row).toBeVisible();
  }
  await row.click();
  await page.waitForURL(/\/costos\/servicios\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('tab', { name: 'General' })).toBeVisible();
  return page.url().split('/').pop() ?? '';
}

/** Ruta del PDF de composición en el bucket privado (la arma la app con la empresa, el servicio y el período). */
export const compositionPdfPath = (serviceId: string, period: string) => `${QA_COMPANY_ID}/composicion/${serviceId}/${period}.pdf`;
export const compositionPdfPublicUrl = (serviceId: string, period: string) => `${STORAGE_PUBLIC_URL}/${COSTOS_BUCKET}/${compositionPdfPath(serviceId, period)}`;

export { clickHydrated, hydrated };
