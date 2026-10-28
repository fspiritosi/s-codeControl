import { expect, type Locator, type Page } from '@playwright/test';
import { QA_COMPANY_ID } from './env';
import { clickHydrated, hydrated } from './ui';

export const HSE_URL = '/dashboard/hse';
/** Tipo de documento HSE fijo de la suite: la app no permite eliminar tipos, así que se crea una vez y se reutiliza. */
export const HSE_DOC_TYPE = 'QA-E2E-HSE-Tipo';

/** Contenido distinguible de un PDF mínimo, para comprobar que lo guardado es lo subido. */
export const pdfFile = (marker: string) => ({
  name: `${marker}.pdf`,
  mimeType: 'application/pdf',
  buffer: Buffer.from(`%PDF-1.4\n% ${marker}\n%%EOF`),
});

/** Abre una pestaña principal de HSE ("Capacitaciones", "Documentos", "Tipos de Documentos"). */
export async function gotoHseTab(page: Page, name: string): Promise<Locator> {
  await page.goto(HSE_URL);
  const tab = page.getByRole('tab', { name, exact: true });
  await expect(async () => {
    if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click({ timeout: 3_000 });
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  // El panel no tiene nombre accesible; el externo es el primero (las pestañas internas anidan paneles propios).
  return page.getByRole('tabpanel').first();
}

/** Crea el tipo de documento HSE de la suite si todavía no existe. */
export async function ensureHseDocType(page: Page) {
  const panel = await gotoHseTab(page, 'Tipos de Documentos');
  await hydrated(panel.getByRole('button', { name: 'Crear', exact: true }));
  if (await panel.getByRole('row').filter({ hasText: HSE_DOC_TYPE }).isVisible({ timeout: 3_000 }).catch(() => false)) return;
  await panel.getByRole('textbox', { name: 'Nombre del Documento' }).fill(HSE_DOC_TYPE);
  await panel.getByRole('textbox', { name: 'Descripción corta' }).fill('Tipo de prueba QA');
  await panel.getByRole('button', { name: 'Crear', exact: true }).click();
  await expect(panel.getByRole('row').filter({ hasText: HSE_DOC_TYPE })).toBeVisible({ timeout: 20_000 });
}

/** Ruta de un objeto dentro del bucket, a partir de su URL pública (`<storage>/<bucket>/<ruta...>`). */
export const objectPathOf = (url: string, bucket: string) => decodeURIComponent(new URL(url).pathname.replace(`/${bucket}/`, ''));

/** ¿Está el objeto en el bucket? Lo consulta la API de storage de la app (la misma que usa la interfaz). */
export async function objectInBucket(page: Page, bucket: string, path: string): Promise<boolean> {
  const slash = path.lastIndexOf('/');
  const dir = slash < 0 ? '' : path.slice(0, slash);
  const name = path.slice(slash + 1);
  const res = await page.request.post('/api/storage', { multipart: { op: 'list', bucket, path: dir, options: '{}' } });
  if (!res.ok()) return false;
  const objects = (await res.json()) as { name: string }[];
  return objects.some((o) => o.name === name);
}

/** Borra objetos de un bucket por la API de storage (limpieza). */
export async function removeFromBucket(page: Page, bucket: string, paths: string[]) {
  if (paths.length === 0) return;
  await page.request.post('/api/storage', { multipart: { op: 'remove', bucket, paths: JSON.stringify(paths) } });
}

/** Comprueba que la URL pública de un objeto responde 200 con exactamente el contenido esperado. */
export async function expectPublicUrlServes(page: Page, url: string, content: Buffer) {
  const res = await page.request.get(url);
  expect(res.status()).toBe(200);
  expect((await res.body()).equals(content)).toBe(true);
}

/** Capacitador fijo de la suite: es un catálogo de la empresa sin borrado, así que se crea una vez y se reutiliza. */
export const HSE_INSTRUCTOR = 'QA-E2E-Capacitador';

/** Pestaña interna de capacitaciones ("Publicado", "Borrador" o "Archivado"): devuelve las tarjetas/filas de la que se abre. */
export async function gotoTrainingStatus(page: Page, status: 'Publicado' | 'Borrador' | 'Archivado'): Promise<Locator> {
  const panel = await gotoHseTab(page, 'Capacitaciones');
  const inner = panel.getByRole('tab', { name: new RegExp(`^${status}`) });
  await expect(async () => {
    if ((await inner.getAttribute('aria-selected')) !== 'true') await inner.click({ timeout: 3_000 });
    await expect(inner).toHaveAttribute('aria-selected', 'true', { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  return panel;
}

/** Tarjeta de una capacitación en el listado (tiene "Administrar" y, solo en borrador, "Eliminar"). */
export const trainingCard = (panel: Locator, title: string) => panel.locator('div.transition-shadow').filter({ hasText: title });

/**
 * Alta de una capacitación por el diálogo "Nueva Capacitación". Con `complete` se llenan también los datos del acta que exige
 * publicarla (fechas, lugar, capacitador, duración, tema, recursos, material entregado y tipo de evaluación).
 */
export async function createTrainingViaUi(page: Page, title: string, description: string, complete = false) {
  const panel = await gotoHseTab(page, 'Capacitaciones');
  await clickHydrated(panel.getByRole('button', { name: 'Nueva Capacitación' }));
  const dialog = page.getByRole('dialog', { name: 'Nueva Capacitación' });
  await dialog.locator('#title').fill(title);
  await dialog.locator('#description').fill(description);
  if (complete) {
    await dialog.locator('#dictated_at').fill('2026-10-28');
    await dialog.locator('#deadline_at').fill('2026-12-31');
    await dialog.locator('#location').fill('Capacitación QA');
    await dialog.locator('#estimated_duration_minutes').fill('30');
    await dialog.getByRole('checkbox', { name: 'Seguridad e higiene' }).click();
    await dialog.locator('#teaching_resources').fill('PDF de prueba QA');
    await dialog.getByRole('radio', { name: 'No' }).click();
    await dialog.getByRole('checkbox', { name: 'Escrita / Oral' }).click();
    // Sin capacitadores el desplegable queda vacío y Escape cerraría todo el diálogo: se decide por el aviso, sin abrirlo.
    if (await dialog.getByText('No hay capacitadores cargados.').isVisible()) {
      await dialog.getByRole('button', { name: 'Nuevo capacitador' }).click();
      await page.locator('#instructor_full_name').fill(HSE_INSTRUCTOR);
      await page.getByRole('button', { name: 'Crear capacitador' }).click();
      await expect(page.getByText('Capacitador creado').first()).toBeVisible();
    } else {
      await dialog.locator('#instructor').click();
      await page.getByRole('option', { name: new RegExp(HSE_INSTRUCTOR) }).click();
    }
    await expect(dialog.locator('#instructor')).toContainText(HSE_INSTRUCTOR);
  }
  await dialog.getByRole('button', { name: 'Crear Capacitación' }).click();
  await expect(page.getByText('Capacitación creada exitosamente').first()).toBeVisible();
  await expect(dialog).toBeHidden();
}

export { QA_COMPANY_ID, clickHydrated };
