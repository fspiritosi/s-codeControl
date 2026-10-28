import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { uniq } from '../../helpers/env';
import { cleanupEmployees, createEmployeeViaUi, deactivateFromList, newEmployeeData, openTab } from '../../helpers/employees';
import {
  DOCS_URL,
  cleanupDocTypes,
  clickDocMenuItem,
  createDocType,
  deactivateDocType,
  docRow,
  pdf,
  uploadEmployeeDoc,
  uploadMultiEmployeeDoc,
} from '../../helpers/documents';
import { clickHydrated } from '../../helpers/ui';

/**
 * Documentos de empleados que no cubre `documentos-legajo.spec.ts`: mensuales, multirecurso, historial, reemplazo,
 * eliminación y documentos de baja. Dos empleados propios; los tipos se desactivan al final.
 */
test.describe('documentos de empleados: mensuales, multirecurso, reemplazo y baja', () => {
  test.describe.configure({ mode: 'serial', timeout: 150_000 });
  test.use({ actionTimeout: 15_000, viewport: { width: 1600, height: 900 } });

  const empA = newEmployeeData('docA');
  const empB = newEmployeeData('docB');
  const permanent = uniq('DocPerm');
  const monthly = uniq('DocMens');
  const multi = uniq('DocMulti');
  const original = pdf('original-empleado-qa');
  const replacement = pdf('reemplazo-empleado-qa');
  const multiFile = pdf('multi-empleado-qa');
  let docUrl = '';

  test.afterAll(async ({ browser, baseURL }) => {
    await cleanupEmployees(browser, baseURL, [empA.lastname, empB.lastname]);
    await cleanupDocTypes(browser, baseURL, [permanent, monthly, multi]);
  });

  test('preparación: tipos de documento (permanente, mensual, multirecurso) y dos empleados', async ({ page }) => {
    await createDocType(page, permanent, { appliesTo: 'Persona' });
    await createDocType(page, monthly, { appliesTo: 'Persona', monthly: true });
    await createDocType(page, multi, { appliesTo: 'Persona', multi: true });
    await createEmployeeViaUi(page, empA);
    await createEmployeeViaUi(page, empB);
  });

  test('un documento mensual se carga con su período y aparece en la solapa Documentos mensuales', async ({ page }) => {
    await uploadEmployeeDoc(page, { lastname: empA.lastname, type: monthly, file: pdf('mensual-empleado-qa'), period: true });
    await page.goto(`${DOCS_URL}?search=${empA.lastname}`);
    const panel = page.getByRole('tabpanel', { name: 'Documentos de empleados' });
    await openTab(page, 'Documentos mensuales');
    const row = docRow(page, empA.lastname, monthly);
    await expect(row).toBeVisible();
    await expect(row).toContainText('presentado');
  });

  test('un documento multirecurso se carga una vez y queda presentado en los dos empleados', async ({ page }) => {
    await uploadMultiEmployeeDoc(page, { lastnames: [empA.lastname, empB.lastname], type: multi, file: multiFile });
    for (const emp of [empA, empB]) {
      await page.goto(`${DOCS_URL}?search=${emp.lastname}`);
      const row = docRow(page, emp.lastname, multi);
      await expect(row).toBeVisible();
      await expect(row).toContainText('presentado');
    }
    await page.goto(`${DOCS_URL}?search=${empA.lastname}`);
    const href = await docRow(page, empA.lastname, multi).getByRole('link', { name: 'Ver documento' }).getAttribute('href');
    await page.goto(href ?? '');
    await expect(page.getByRole('tabpanel', { name: 'Documento' })).toContainText('Es multirecurso');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar' }).click();
    expect(await readFile(await (await download).path(), 'utf8')).toBe(multiFile.buffer.toString());
  });

  test('cargar un documento permanente y abrir su historial desde el menú', async ({ page }) => {
    await uploadEmployeeDoc(page, { lastname: empA.lastname, type: permanent, file: original });
    await page.goto(`${DOCS_URL}?search=${empA.lastname}`);
    const row = docRow(page, empA.lastname, permanent);
    await expect(row).toContainText('presentado');
    docUrl = (await row.getByRole('link', { name: 'Ver documento' }).getAttribute('href')) ?? '';
    expect(docUrl).toMatch(/\/dashboard\/document\/[0-9a-f-]{36}\?resource=Persona/);
    await clickDocMenuItem(page, row, 'Ver historial');
    const dialog = page.getByRole('dialog', { name: 'Historial de Modificaciones' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cerrar' }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('reemplazar el documento sube el archivo nuevo', async ({ page }) => {
    await page.goto(docUrl);
    await clickHydrated(page.getByRole('tab', { name: 'Actualizar', exact: true }));
    await page.getByRole('button', { name: 'Reemplazar' }).click();
    const dialog = page.getByRole('dialog', { name: 'Reemplazar documento' });
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), dialog.getByRole('button', { name: 'Nuevo Documento' }).click()]);
    await chooser.setFiles(replacement);
    await dialog.getByRole('button', { name: 'Reemplazar' }).click();
    await expect(page.getByText('Documento reemplazado correctamente').first()).toBeVisible();

    await page.goto(docUrl);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar' }).click();
    expect(await readFile(await (await download).path(), 'utf8')).toBe(replacement.buffer.toString());
  });

  test('eliminar el documento lo devuelve a pendiente', async ({ page }) => {
    await page.goto(docUrl);
    await clickHydrated(page.getByRole('tab', { name: 'Actualizar', exact: true }));
    await page.getByRole('button', { name: 'Eliminar' }).click();
    const dialog = page.getByRole('dialog', { name: 'Eliminar documento' });
    await dialog.getByRole('textbox').fill('ELIMINAR');
    await dialog.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Documento eliminado correctamente').first()).toBeVisible();

    await page.goto(`${DOCS_URL}?search=${empA.lastname}`);
    await expect(docRow(page, empA.lastname, permanent)).toContainText('pendiente');
  });

  // Un tipo "Documento de baja" es siempre obligatorio (el formulario lo fuerza) y genera pendientes: se crea y se desactiva
  // dentro del mismo test (aunque falle) para no contaminar a otras suites.
  test('un tipo de documento de baja aparece en la solapa Documentos de baja del empleado dado de baja', async ({ page }) => {
    const baja = uniq('DocBaja');
    try {
      // Los pendientes del tipo se generan al crearlo, para los empleados activos: B debe estar activo en ese momento.
      await createDocType(page, baja, { appliesTo: 'Persona', termination: true });
      await deactivateFromList(page, empB.lastname);
      await page.goto(`${DOCS_URL}?search=${empB.lastname}`);
      const panel = page.getByRole('tabpanel', { name: 'Documentos de empleados' });
      await expect(panel.getByRole('tab', { name: 'Documentos permanentes' })).toBeVisible();
      await expect(docRow(page, empB.lastname, baja)).toHaveCount(0);
      await openTab(page, 'Documentos de baja');
      const row = docRow(page, empB.lastname, baja);
      await expect(row).toBeVisible();
      await expect(row).toContainText('pendiente');
    } finally {
      await deactivateDocType(page, baja);
    }
  });
});
