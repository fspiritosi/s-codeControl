import { expect, test, type Page } from '@playwright/test';
import { PREFIX, uniq } from '../../helpers/env';
import { STORAGE_PUBLIC_URL } from '../../helpers/equipment';
import { clickHydrated, createTrainingViaUi, expectPublicUrlServes, gotoTrainingStatus, objectInBucket, objectPathOf, pdfFile, removeFromBucket, trainingCard } from '../../helpers/hse';

const BUCKET = 'training-materials';

/** Abre el detalle de una capacitación en borrador desde su tarjeta. */
async function openTraining(page: Page, title: string, status: 'Borrador' | 'Publicado' | 'Archivado' = 'Borrador'): Promise<string> {
  const panel = await gotoTrainingStatus(page, status);
  await clickHydrated(trainingCard(panel, title).getByRole('button', { name: 'Administrar' }));
  await page.waitForURL(/\/dashboard\/hse\/detail\/[^/]+$/);
  await expect(page.getByRole('tab', { name: 'Materiales' })).toBeVisible();
  return page.url();
}

/** Agrega un material PDF por el formulario de la pestaña Materiales y guarda la lista. */
async function addMaterial(page: Page, name: string, file: ReturnType<typeof pdfFile>) {
  await page.getByRole('tab', { name: 'Materiales' }).click();
  await page.getByLabel('Nombre del Material').fill(name);
  await page.locator('#new-material-file-input').setInputFiles(file);
  await page.getByRole('button', { name: 'Agregar a la Lista' }).click();
  await expect(page.getByPlaceholder('Nombre del material').last()).toHaveValue(name);
  await page.getByRole('button', { name: 'Guardar Cambios' }).click();
  await expect(page.getByText('Capacitación actualizada correctamente').first()).toBeVisible();
}

/** URL pública del material guardado: la que usa el visor de la pestaña Materiales. */
async function materialUrl(page: Page, name: string): Promise<string> {
  await page.getByRole('tab', { name: 'Materiales' }).click();
  const card = page.locator('div.rounded-xl, div.rounded-lg').filter({ hasText: name }).filter({ has: page.getByRole('button', { name: 'Ver Material' }) }).last();
  await clickHydrated(card.getByRole('button', { name: 'Ver Material' }));
  const frame = page.getByRole('dialog').locator('iframe');
  await expect(frame).toBeVisible();
  const src = (await frame.getAttribute('src')) ?? '';
  return src.replace(/#page=\d+$/, '');
}

test.describe('hse: capacitaciones', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  let title = uniq('Cap');
  const m1 = pdfFile('hse-material-1');
  const m2 = pdfFile('hse-material-2');
  let detailUrl = '';
  let path1 = '';
  let path2 = '';

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      const panel = await gotoTrainingStatus(page, 'Borrador');
      const card = trainingCard(panel, title);
      if (await card.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await card.getByRole('button', { name: 'Eliminar' }).click();
        await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
        await expect(card).toHaveCount(0);
      }
      await removeFromBucket(page, BUCKET, [path1, path2].filter(Boolean));
    } finally {
      await context.close();
    }
  });

  test('crear una capacitación la deja en Borrador', async ({ page }) => {
    await createTrainingViaUi(page, title, 'Capacitación de prueba QA');
    const panel = await gotoTrainingStatus(page, 'Borrador');
    const card = trainingCard(panel, title);
    await expect(card).toContainText('Capacitación de prueba QA');
    await expect(card).toContainText('Borrador');
    detailUrl = await openTraining(page, title);
    await expect(page.getByText('Estado:').locator('..')).toContainText('Borrador');
  });

  test('subir un material lo guarda en training-materials y se ve y descarga desde la app', async ({ page }) => {
    await page.goto(detailUrl);
    await addMaterial(page, 'QA-E2E-Material-1', m1);
    await page.reload();
    const url = await materialUrl(page, 'QA-E2E-Material-1');
    expect(url.startsWith(STORAGE_PUBLIC_URL)).toBe(true);
    path1 = objectPathOf(url, BUCKET);
    await expect.poll(() => objectInBucket(page, BUCKET, path1), { timeout: 20_000 }).toBe(true);
    await expectPublicUrlServes(page, url, m1.buffer);

    // "Descargar" del visor abre la URL pública en otra pestaña (el navegador de prueba la baja en vez de mostrarla): se intercepta
    // window.open para comprobar a qué URL apunta.
    await page.evaluate(() => {
      (window as unknown as { opened: string[] }).opened = [];
      window.open = (target) => {
        (window as unknown as { opened: string[] }).opened.push(String(target));
        return null;
      };
    });
    await page.getByRole('dialog').getByRole('button', { name: 'Descargar' }).click();
    expect(await page.evaluate(() => (window as unknown as { opened: string[] }).opened)).toEqual([url]);
  });

  test('un segundo material se suma a la lista y su archivo queda en el bucket', async ({ page }) => {
    await page.goto(detailUrl);
    await page.getByRole('tab', { name: 'Materiales' }).click();
    await page.getByRole('button', { name: 'Habilitar Edición' }).click();
    await addMaterial(page, 'QA-E2E-Material-2', m2);
    await page.reload();
    const url = await materialUrl(page, 'QA-E2E-Material-2');
    path2 = objectPathOf(url, BUCKET);
    await expect.poll(() => objectInBucket(page, BUCKET, path2), { timeout: 20_000 }).toBe(true);
    await expectPublicUrlServes(page, url, m2.buffer);
  });

  // H-30: al guardar la lista, updateTrainingMaterials borra del bucket TODOS los archivos de los materiales que ya existían (también
  // los que no se reemplazan) y vuelve a insertar sus filas con la misma URL: el material 1 queda con la fila pero sin archivo.
  // Igual que producción (mismo código): no se cambia.
  test.fixme('guardar un material nuevo conserva el archivo de los materiales anteriores (H-30)', async ({ page }) => {
    await expect.poll(() => objectInBucket(page, BUCKET, path1), { timeout: 20_000 }).toBe(true);
    await expectPublicUrlServes(page, `${STORAGE_PUBLIC_URL}/${BUCKET}/${path1}`, m1.buffer);
  });

  test('se puede crear una pregunta de evaluación con sus opciones', async ({ page }) => {
    await page.goto(detailUrl);
    await page.getByRole('tab', { name: 'Evaluación' }).click();
    await page.getByRole('button', { name: 'Agregar Primera Pregunta' }).click();
    await page.getByPlaceholder('Escribe la pregunta').fill('¿Pregunta de prueba QA?');
    await page.getByPlaceholder('Opción 1').fill('Respuesta correcta');
    await page.getByPlaceholder('Opción 2').fill('Respuesta incorrecta');
    await page.locator('#passing-score').first().fill('1');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByText('Evaluación guardada correctamente').first()).toBeVisible();

    await page.reload();
    await page.getByRole('tab', { name: 'Evaluación' }).click();
    await expect(page.getByText('1 preguntas')).toBeVisible();
    await expect(page.getByPlaceholder('Escribe la pregunta')).toHaveValue('¿Pregunta de prueba QA?');
  });

  test('se puede editar el título y la descripción de la capacitación', async ({ page }) => {
    await page.goto(detailUrl);
    await clickHydrated(page.getByRole('button', { name: 'Editar Capacitación' }));
    const dialog = page.getByRole('dialog', { name: 'Editar Capacitación' });
    const newTitle = `${title}-ed`;
    await dialog.locator('#title').fill(newTitle);
    await dialog.locator('#description').fill('Descripción editada QA');
    await dialog.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByText('Capacitación actualizada correctamente').first()).toBeVisible();
    title = newTitle;
    const panel = await gotoTrainingStatus(page, 'Borrador');
    await expect(trainingCard(panel, title)).toContainText('Descripción editada QA');
  });

  test('eliminar una capacitación en borrador la saca del listado', async ({ page }) => {
    const panel = await gotoTrainingStatus(page, 'Borrador');
    await clickHydrated(trainingCard(panel, title).getByRole('button', { name: 'Eliminar' }));
    await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Capacitación eliminada').first()).toBeVisible();
    await expect(trainingCard(await gotoTrainingStatus(page, 'Borrador'), title)).toHaveCount(0);
  });

  // H-31: deleteTraining intenta borrar los archivos de los materiales en el bucket `documents` y con la URL completa en vez de la
  // ruta; los objetos de `training-materials` quedan huérfanos para siempre. Igual que producción (mismo código): no se cambia.
  test.fixme('eliminar la capacitación borra sus materiales del bucket training-materials (H-31)', async ({ page }) => {
    await expect.poll(() => objectInBucket(page, BUCKET, path2), { timeout: 20_000 }).toBe(false);
  });
});

/**
 * Publicar y archivar: la app solo deja eliminar borradores, así que una capacitación publicada queda para siempre. Por eso se usa
 * una sola, fija, que en cada corrida pasa de Archivado (o de Borrador la primera vez) a Publicado y vuelve a Archivado.
 */
test.describe('hse: capacitación publicada y archivada', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const title = `${PREFIX}CapCiclo`;
  type Status = 'Borrador' | 'Publicado' | 'Archivado';
  const STATUSES: Status[] = ['Borrador', 'Publicado', 'Archivado'];

  async function currentStatus(page: Page): Promise<Status | null> {
    for (const status of STATUSES) {
      const panel = await gotoTrainingStatus(page, status);
      if (await trainingCard(panel, title).isVisible({ timeout: 3_000 }).catch(() => false)) return status;
    }
    return null;
  }

  test('preparación: existe la capacitación fija con los datos del acta completos', async ({ page }) => {
    if ((await currentStatus(page)) === null) await createTrainingViaUi(page, title, 'Capacitación fija de prueba QA', true);
    expect(await currentStatus(page)).not.toBeNull();
  });

  test('publicar la capacitación la pasa a Publicado y deja de poder eliminarse', async ({ page }) => {
    const status = await currentStatus(page);
    await openTraining(page, title, status ?? 'Archivado');
    if (status === 'Borrador') {
      await page.getByRole('button', { name: 'Publicar Capacitación' }).click();
      await expect(page.getByText('Capacitación publicada exitosamente').first()).toBeVisible();
    } else if (status === 'Archivado') {
      await clickHydrated(page.getByRole('button', { name: 'Editar Capacitación' }));
      const dialog = page.getByRole('dialog', { name: 'Editar Capacitación' });
      await dialog.getByRole('combobox').first().click();
      await page.getByRole('option', { name: 'Publicado' }).click();
      await dialog.getByRole('button', { name: 'Guardar Cambios' }).click();
      await expect(page.getByText('Capacitación actualizada correctamente').first()).toBeVisible();
    }
    const panel = await gotoTrainingStatus(page, 'Publicado');
    const card = trainingCard(panel, title);
    await expect(card).toBeVisible();
    await expect(card.getByRole('button', { name: 'Eliminar' })).toHaveCount(0);
  });

  test('archivar la capacitación publicada la pasa a Archivado', async ({ page }) => {
    await openTraining(page, title, 'Publicado');
    await page.getByRole('button', { name: 'Marcar como Archivada' }).click();
    await expect(page.getByText('Capacitación archivada exitosamente').first()).toBeVisible();
    const panel = await gotoTrainingStatus(page, 'Archivado');
    await expect(trainingCard(panel, title)).toBeVisible();
    await expect(trainingCard(await gotoTrainingStatus(page, 'Publicado'), title)).toHaveCount(0);
  });
});
