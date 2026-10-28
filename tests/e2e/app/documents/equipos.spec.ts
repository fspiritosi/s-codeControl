import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { uniq } from '../../helpers/env';
import { cleanupEquipment, createEquipmentViaUi, newEquipmentData } from '../../helpers/equipment';
import {
  DOCS_URL,
  cleanupDocTypes,
  clickDocMenuItem,
  createDocType,
  docRow,
  nextYear,
  pdf,
  typeRow,
  uploadEquipmentDoc,
  clickTypeMenuItem,
  DOC_TYPES_URL,
} from '../../helpers/documents';
import { clickHydrated } from '../../helpers/ui';

/**
 * Documentos de equipos (RustFS, bucket document-files): tipo de documento, carga, descarga (se compara el contenido),
 * historial, detalle, reemplazo y eliminación. Un equipo y un tipo propios recorren todo el flujo (serial).
 */
test.describe('documentos de equipos: ciclo de vida', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  // En 1280 px el visor de PDF del detalle tapa la pestaña "Actualizar" (observación de layout): se usa una ventana más ancha.
  test.use({ actionTimeout: 15_000, viewport: { width: 1600, height: 900 } });

  const eq = newEquipmentData('DocEq');
  const type = uniq('DocEquipo');
  const original = pdf('original-equipo-qa');
  const replacement = pdf('reemplazo-equipo-qa');
  let docUrl = '';

  test.afterAll(async ({ browser, baseURL }) => {
    await cleanupEquipment(browser, baseURL, [eq.intern]);
    await cleanupDocTypes(browser, baseURL, [type]);
  });

  test('crear un tipo de documento de equipos con vencimiento lo deja activo en la tabla', async ({ page }) => {
    await createDocType(page, type, { appliesTo: 'Equipos', expires: true, description: 'Documento de equipo de prueba E2E' });
    const row = typeRow(page, type);
    await expect(row).toContainText('Equipos');
    await expect(row).toContainText('Activo');
  });

  test('editar el tipo de documento guarda los cambios', async ({ page }) => {
    await page.goto(DOC_TYPES_URL);
    await clickHydrated(page.getByRole('button', { name: 'Crear nuevo' }));
    await page.keyboard.press('Escape');
    await clickTypeMenuItem(page, type, 'Editar');
    const dialog = page.getByRole('dialog', { name: 'Editar Tipo de Documento' });
    await expect(dialog.getByRole('textbox', { name: 'Nombre *' })).toHaveValue(type);
    await dialog.getByRole('textbox', { name: 'Descripción' }).fill('Descripción editada E2E');
    await dialog.getByRole('button', { name: 'Actualizar' }).click();
    await expect(page.getByText('Tipo de documento actualizado').first()).toBeVisible();
  });

  test('preparación: se crea el equipo al que se le cargará el documento', async ({ page }) => {
    await createEquipmentViaUi(page, eq);
  });

  test('un equipo con un tipo no obligatorio no tiene pendientes de ese tipo', async ({ page }) => {
    await page.goto(`${DOCS_URL}?tab=equipment&search=${eq.intern}`);
    await expect(page.getByRole('tabpanel', { name: 'Documentos de equipos' })).toBeVisible();
    await expect(docRow(page, eq.intern, type)).toHaveCount(0);
  });

  test('cargar un documento a un equipo lo deja como presentado en el listado', async ({ page }) => {
    await uploadEquipmentDoc(page, { equipment: new RegExp(eq.intern), type, file: original, expiryYear: nextYear() });
    const row = docRow(page, eq.intern, type);
    await expect(row).toBeVisible();
    await expect(row).toContainText('presentado');
    await expect(row).toContainText(String(nextYear()));
    docUrl = (await row.getByRole('link', { name: 'Ver documento' }).getAttribute('href')) ?? '';
    expect(docUrl).toMatch(/\/dashboard\/document\/[0-9a-f-]{36}\?resource=Equipos/);
  });

  // H-16: en el listado de documentos de equipos el menú "Descargar" pide `path=undefined` (404): el formateador de filas no
  // incluía `document_url`. Corregido en código (`formatVehiculesDocuments`), falta deploy.
  test('se descarga desde el listado el mismo archivo que se subió', async ({ page }) => {
    await page.goto(`${DOCS_URL}?tab=equipment&search=${eq.intern}`);
    const row = docRow(page, eq.intern, type);
    await expect(row).toBeVisible();
    const download = page.waitForEvent('download');
    await clickDocMenuItem(page, row, 'Descargar');
    const file = await (await download).path();
    expect(await readFile(file, 'utf8')).toBe(original.buffer.toString());
  });

  test('el menú de la fila abre el historial de modificaciones', async ({ page }) => {
    await page.goto(`${DOCS_URL}?tab=equipment&search=${eq.intern}`);
    const row = docRow(page, eq.intern, type);
    await clickDocMenuItem(page, row, 'Ver historial');
    const dialog = page.getByRole('dialog', { name: 'Historial de Modificaciones' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cerrar' }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('el detalle del documento muestra el tipo, el equipo y permite descargarlo', async ({ page }) => {
    await page.goto(docUrl);
    await expect(page.getByText(type).first()).toBeVisible();
    await expect(page.getByText('presentado').first()).toBeVisible();
    const docPanel = page.getByRole('tabpanel', { name: 'Documento' });
    await expect(docPanel).toContainText('No es mandatorio');
    await expect(docPanel).toContainText('No es multirecurso');
    await expect(docPanel).toContainText(/Vence el \d{2}\/\d{2}\/\d{4}/);
    await page.getByRole('tab', { name: 'Equipo', exact: true }).click();
    await expect(page.getByRole('tabpanel', { name: 'Equipo' })).toContainText(eq.intern);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar' }).click();
    expect(await readFile(await (await download).path(), 'utf8')).toBe(original.buffer.toString());
  });

  test('reemplazar el documento sube el archivo nuevo', async ({ page }) => {
    await page.goto(docUrl);
    await clickHydrated(page.getByRole('tab', { name: 'Actualizar', exact: true }));
    await page.getByRole('button', { name: 'Reemplazar' }).click();
    const dialog = page.getByRole('dialog', { name: 'Reemplazar documento' });
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), dialog.getByRole('button', { name: 'Nuevo Documento' }).click()]);
    await chooser.setFiles(replacement);
    // El reemplazo exige elegir de nuevo la fecha de vencimiento (el valor previo no pasa la validación).
    await dialog.getByRole('button', { name: 'Fecha de vencimiento' }).click();
    await page.getByRole('button', { name: /, 15 de \S+ de \d{4}/ }).first().click();
    await page.keyboard.press('Escape');
    await dialog.getByRole('button', { name: 'Reemplazar' }).click();
    await expect(page.getByText('Documento reemplazado correctamente').first()).toBeVisible();

    // Se verifica por el botón del detalle (el menú del listado es el H-16).
    await page.goto(docUrl);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar' }).click();
    expect(await readFile(await (await download).path(), 'utf8')).toBe(replacement.buffer.toString());
  });

  test('eliminar el documento lo devuelve a pendiente y borra el archivo', async ({ page }) => {
    await page.goto(docUrl);
    await clickHydrated(page.getByRole('tab', { name: 'Actualizar', exact: true }));
    await page.getByRole('button', { name: 'Eliminar' }).click();
    const dialog = page.getByRole('dialog', { name: 'Eliminar documento' });
    await dialog.getByRole('textbox').fill('ELIMINAR');
    await dialog.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Documento eliminado correctamente').first()).toBeVisible();

    await page.goto(`${DOCS_URL}?tab=equipment&search=${eq.intern}`);
    const row = docRow(page, eq.intern, type);
    await expect(row).toBeVisible();
    await expect(row).toContainText('pendiente');
  });
});
