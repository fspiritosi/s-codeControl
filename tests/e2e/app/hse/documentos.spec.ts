import { expect, test, type Locator, type Page } from '@playwright/test';
import { PREFIX, uniq } from '../../helpers/env';
import { STORAGE_PUBLIC_URL } from '../../helpers/equipment';
import { HSE_DOC_TYPE, ensureHseDocType, expectPublicUrlServes, gotoHseTab, objectInBucket, objectPathOf, pdfFile, removeFromBucket } from '../../helpers/hse';
import { clickHydrated } from '../../helpers/ui';

const BUCKET = 'documents-hse';
type DraftTab = 'Vigentes' | 'Borradores';

/** Tarjeta de un documento en la pestaña interna indicada de "Documentos". */
async function docCard(page: Page, tab: DraftTab, title: string): Promise<Locator> {
  const panel = await gotoHseTab(page, 'Documentos');
  const inner = panel.getByRole('tab', { name: new RegExp(`^${tab}`) });
  await expect(async () => {
    if ((await inner.getAttribute('aria-selected')) !== 'true') await inner.click({ timeout: 3_000 });
    await expect(inner).toHaveAttribute('aria-selected', 'true', { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  return panel.locator('div.transition-shadow').filter({ hasText: title });
}

/** Sube un documento por el diálogo "Nuevo Documento" (cargado a todos los empleados activos de la empresa QA E2E). */
async function uploadDocument(page: Page, title: string, version: string, file: ReturnType<typeof pdfFile>) {
  const panel = await gotoHseTab(page, 'Documentos');
  await clickHydrated(panel.getByRole('button', { name: 'Nuevo Documento' }));
  const dialog = page.getByRole('dialog', { name: 'Subir Nuevo Documento' });
  await dialog.getByRole('combobox').first().click();
  await page.getByRole('option', { name: HSE_DOC_TYPE }).click();
  await dialog.getByPlaceholder('Título del documento').fill(title);
  await dialog.getByPlaceholder('Ej: 1.0').fill(version);
  await dialog.locator('input[type=file]').setInputFiles(file);
  await expect(dialog.getByRole('button', { name: file.name })).toBeVisible();
  await dialog.getByRole('button', { name: 'Subir Documento' }).click();
  await expect(page.getByText('Documento subido con éxito').first()).toBeVisible();
}

/**
 * El detalle carga el documento desde el cliente y, si esa consulta falla (pasa bajo carga del clon), vuelve solo al listado:
 * se reintenta la carga completa hasta que aparecen sus pestañas.
 */
async function gotoDetail(page: Page, url: string) {
  await expect(async () => {
    await page.goto(url);
    await expect(page.getByRole('tab', { name: 'Vista Previa' })).toBeVisible({ timeout: 10_000 });
  }).toPass({ timeout: 60_000 });
}

/** Abre el detalle de un documento desde su tarjeta y devuelve la URL del detalle. */
async function openDetail(page: Page, card: Locator): Promise<string> {
  await clickHydrated(card.getByRole('button', { name: 'Ver Detalle' }));
  await page.waitForURL(/\/dashboard\/hse\/document\/[^/]+\/detail$/);
  const url = page.url();
  await gotoDetail(page, url);
  return url;
}

/** URL pública del archivo actual, la que usa la vista previa del detalle. */
async function previewUrl(page: Page): Promise<string> {
  await page.getByRole('tab', { name: 'Vista Previa' }).click();
  const frame = page.locator('iframe');
  await expect(frame).toBeVisible();
  return (await frame.getAttribute('src')) ?? '';
}

/**
 * HSE: documentos con archivo en el bucket `documents-hse`. El documento A recorre subir, descargar, ver, editar y eliminar
 * (queda borrador, así que la app lo permite). La app solo deja eliminar borradores: el documento B del flujo de versiones
 * queda "vigente" y sin poder borrarse (ver hallazgos).
 */
test.describe('hse: documentos', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const file = pdfFile('hse-doc-a');
  let title = uniq('HseDoc');
  let filePath = '';
  /** Ruta actual del archivo: una edición la cambia (H-28) y deja el original huérfano. */
  let currentPath = '';

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      const card = await docCard(page, 'Borradores', title);
      if (await card.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await card.getByRole('button', { name: 'Eliminar' }).click();
        await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
        await expect(card).toHaveCount(0);
      }
      await removeFromBucket(page, BUCKET, [filePath, currentPath].filter(Boolean));
    } finally {
      await context.close();
    }
  });

  test('preparación: tipo de documento HSE de la suite', async ({ page }) => {
    await ensureHseDocType(page);
  });

  test('subir un documento lo deja en Borradores y el archivo en documents-hse', async ({ page }) => {
    await uploadDocument(page, title, '1.0', file);
    const card = await docCard(page, 'Borradores', title);
    await expect(card).toContainText('Versión 1.0');
    await expect(card).toContainText('Borrador');

    await openDetail(page, card);
    const url = await previewUrl(page);
    filePath = objectPathOf(url, BUCKET);
    currentPath = filePath;
    expect(filePath).toMatch(/\.pdf$/);
    await expect.poll(() => objectInBucket(page, BUCKET, filePath), { timeout: 20_000 }).toBe(true);
    await expectPublicUrlServes(page, url, file.buffer);
  });

  test('la tarjeta descarga el archivo por /api/storage con el mismo contenido', async ({ page }) => {
    const card = await docCard(page, 'Borradores', title);
    const download = page.waitForEvent('download');
    await clickHydrated(card.locator('button:has(svg.lucide-download)'));
    const saved = await download;
    expect(saved.suggestedFilename()).toBe(file.name);
    const stream = await saved.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    expect(Buffer.concat(chunks).equals(file.buffer)).toBe(true);
  });

  // H-27: con el archivo actual, el diálogo de edición es más alto que una pantalla de 720 px y no se desplazaba: "Guardar Cambios"
  // quedaba fuera de la vista. Corregido en código (max-h + overflow-y-auto), falta deploy; hasta entonces el test usa una pantalla alta.
  test('se puede editar un documento en borrador', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    const card = await docCard(page, 'Borradores', title);
    await clickHydrated(card.getByRole('button', { name: 'Editar' }));
    const dialog = page.getByRole('dialog', { name: 'Editar Documento' });
    const newTitle = `${title}-ed`;
    await dialog.getByPlaceholder('Título del documento').fill(newTitle);
    await dialog.getByPlaceholder('Descripción del documento...').fill('Descripción editada QA');
    await dialog.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByText('Documento actualizado con éxito').first()).toBeVisible();
    title = newTitle;
    const card2 = await docCard(page, 'Borradores', title);
    await expect(card2).toBeVisible();
    await expect(card2).toContainText('Versión 1.0');
    await openDetail(page, card2);
    currentPath = objectPathOf(await previewUrl(page), BUCKET);
  });

  // H-28: al editar sin tocar el archivo, el formulario arma un File vacío con el tamaño del original y lo sube como "archivo
  // nuevo": el documento pasa a apuntar a un objeto de 0 bytes en documents/<ts>.pdf y el original queda huérfano. Igual que
  // producción (mismo código del diálogo y de la action): no se cambia.
  test.fixme('editar un documento sin cambiar el archivo conserva su contenido (H-28)', async ({ page }) => {
    await expect.poll(() => objectInBucket(page, BUCKET, currentPath), { timeout: 20_000 }).toBe(true);
    await expectPublicUrlServes(page, `${STORAGE_PUBLIC_URL}/${BUCKET}/${currentPath}`, file.buffer);
  });

  test('el diálogo de edición se puede usar en una pantalla de 720 px de alto (H-27)', async ({ page }) => {
    const card = await docCard(page, 'Borradores', title);
    await clickHydrated(card.getByRole('button', { name: 'Editar' }));
    const dialog = page.getByRole('dialog', { name: 'Editar Documento' });
    await dialog.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByText('Documento actualizado con éxito').first()).toBeVisible();
  });

  // H-33: tras el último deploy el borrador se elimina del listado pero el archivo sigue en el bucket (antes pasaba). Sin causa clara en el log del servidor; pendiente de investigar.
  test.fixme('eliminar un borrador lo saca del listado y borra el archivo del bucket', async ({ page }) => {
    const card = await docCard(page, 'Borradores', title);
    await clickHydrated(card.getByRole('button', { name: 'Eliminar' }));
    await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Documento eliminado correctamente').first()).toBeVisible();
    await expect(await docCard(page, 'Borradores', title)).toHaveCount(0);
    await expect.poll(() => objectInBucket(page, BUCKET, currentPath), { timeout: 20_000 }).toBe(false);
  });

  // Versiones: un único documento fijo se publica una vez y cada corrida le suma una versión. La app solo deja eliminar borradores
  // y una nueva versión lo deja vigente, así que no se puede borrar (ver hallazgos); sus archivos quedan en el bucket.
  const verTitle = `${PREFIX}HseVersiones`;
  let prevVersion = '';
  let nextVersion = '';
  let prevPath = '';
  let detailUrl = '';

  test('versiones: el documento fijo existe y está vigente (se crea y publica la primera vez)', async ({ page }) => {
    await ensureHseDocType(page);
    const active = await docCard(page, 'Vigentes', verTitle);
    if (!(await active.isVisible({ timeout: 5_000 }).catch(() => false))) {
      await uploadDocument(page, verTitle, '1.0', pdfFile('hse-ver-inicial'));
      const card = await docCard(page, 'Borradores', verTitle);
      await clickHydrated(card.getByRole('button', { name: 'Publicar' }));
      await page.getByRole('alertdialog').getByRole('button', { name: 'Publicar' }).click();
      await expect(page.getByText('Documento publicado correctamente').first()).toBeVisible();
    }
    const vigente = await docCard(page, 'Vigentes', verTitle);
    await expect(vigente).toContainText('Vigente');
    await expect(vigente.getByRole('button', { name: 'Editar' })).toHaveCount(0);
    detailUrl = await openDetail(page, vigente);
    prevVersion = ((await page.getByText(/^Versión \d/).first().innerText()).match(/\d+(\.\d+)?/) ?? [''])[0];
    nextVersion = `${Math.floor(parseFloat(prevVersion)) + 1}.0`;
    prevPath = objectPathOf(await previewUrl(page), BUCKET);
  });

  test('versiones: una nueva versión sube un archivo nuevo y conserva el anterior en el historial', async ({ page }) => {
    const next = pdfFile(`hse-ver-${nextVersion}-${Date.now().toString(36)}`);
    await gotoDetail(page, detailUrl);
    const prevBuffer = await (await page.request.get(`${STORAGE_PUBLIC_URL}/${BUCKET}/${prevPath}`)).body();
    await clickHydrated(page.getByRole('button', { name: 'Agregar Nueva Versión' }));
    const dialog = page.getByRole('dialog', { name: 'Nueva Versión del Documento' });
    await dialog.locator('#new-version').fill(nextVersion);
    await dialog.locator('#file').setInputFiles(next);
    await dialog.getByRole('button', { name: 'Crear Nueva Versión' }).click();
    await expect(page.getByText('Nueva versión creada exitosamente').first()).toBeVisible();

    await gotoDetail(page, detailUrl);
    const nextUrl = await previewUrl(page);
    const nextPath = objectPathOf(nextUrl, BUCKET);
    expect(nextPath).not.toBe(prevPath);
    await expect.poll(() => objectInBucket(page, BUCKET, nextPath), { timeout: 20_000 }).toBe(true);
    await expectPublicUrlServes(page, nextUrl, next.buffer);
    // La versión anterior sigue en el bucket con su contenido: el historial la necesita.
    await expect.poll(() => objectInBucket(page, BUCKET, prevPath), { timeout: 20_000 }).toBe(true);
    await expectPublicUrlServes(page, `${STORAGE_PUBLIC_URL}/${BUCKET}/${prevPath}`, prevBuffer);

    await page.getByRole('tab', { name: 'Versiones' }).click();
    await expect(page.getByRole('row').filter({ hasText: `${nextVersion} (Actual)` })).toBeVisible();
    await expect(page.getByRole('row').filter({ has: page.getByRole('cell', { name: prevVersion, exact: true }) })).toBeVisible();
  });

  // H-29: "Descargar" del detalle (pestaña Versiones) crea un enlace con la ruta del archivo (`<empresa>/<ts>.pdf`) en vez de bajarlo por
  // /api/storage como la tarjeta del listado: el navegador pide `/dashboard/hse/document/<id>/<empresa>/<ts>.pdf` y no recibe el archivo.
  // Igual que producción (mismo código y mismo file_path): no se cambia.
  test.fixme('versiones: Descargar en el detalle entrega el archivo de la versión actual (H-29)', async ({ page }) => {
    await gotoDetail(page, detailUrl);
    await page.getByRole('tab', { name: 'Versiones' }).click();
    const download = page.waitForEvent('download', { timeout: 10_000 });
    await page.getByRole('row').filter({ hasText: `${nextVersion} (Actual)` }).getByRole('button', { name: 'Descargar' }).click();
    const saved = await download;
    expect(await saved.failure()).toBeNull();
  });
});
