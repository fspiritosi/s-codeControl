import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { uniq } from '../../helpers/env';
import { cleanupEquipment, createEquipmentViaUi, newEquipmentData } from '../../helpers/equipment';
import {
  DOCS_URL,
  cleanupDocTypes,
  createDocType,
  docRow,
  pdf,
  uploadEquipmentDoc,
  uploadMultiEquipmentDoc,
} from '../../helpers/documents';
import { openTab } from '../../helpers/employees';

/**
 * Documentos de equipos mensuales y multirecurso. Dos equipos propios: el multirecurso vincula el mismo archivo a ambos.
 */
test.describe('documentos de equipos: mensuales y multirecurso', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000, viewport: { width: 1600, height: 900 } });

  const eqA = newEquipmentData('DocMA');
  const eqB = newEquipmentData('DocMB');
  const monthly = uniq('DocMensual');
  const multi = uniq('DocMulti');
  const monthlyFile = pdf('mensual-equipo-qa');
  const multiFile = pdf('multi-equipo-qa');

  test.afterAll(async ({ browser, baseURL }) => {
    await cleanupEquipment(browser, baseURL, [eqA.intern, eqB.intern]);
    await cleanupDocTypes(browser, baseURL, [monthly, multi]);
  });

  test('preparación: tipos mensual y multirecurso, y dos equipos', async ({ page }) => {
    await createDocType(page, monthly, { appliesTo: 'Equipos', monthly: true });
    await createDocType(page, multi, { appliesTo: 'Equipos', multi: true });
    await createEquipmentViaUi(page, eqA);
    await createEquipmentViaUi(page, eqB);
  });

  test('un documento mensual se carga con su período y aparece en la solapa Documentos mensuales', async ({ page }) => {
    await uploadEquipmentDoc(page, { equipment: new RegExp(eqA.intern), type: monthly, file: monthlyFile, period: true });
    await page.goto(`${DOCS_URL}?tab=equipment&search=${eqA.intern}`);
    const panel = page.getByRole('tabpanel', { name: 'Documentos de equipos' });
    await openTab(page, 'Documentos mensuales');
    const row = docRow(page, eqA.intern, monthly);
    await expect(row).toBeVisible();
    await expect(row).toContainText('presentado');
    // El documento mensual no figura entre los permanentes.
    await openTab(page, 'Documentos permanentes');
    await expect(docRow(page, eqA.intern, monthly)).toHaveCount(0);
  });

  test('un documento multirecurso se carga una vez y queda presentado en los dos equipos', async ({ page }) => {
    await uploadMultiEquipmentDoc(page, {
      equipments: [new RegExp(eqA.intern), new RegExp(eqB.intern)],
      type: multi,
      file: multiFile,
    });
    for (const eq of [eqA, eqB]) {
      await page.goto(`${DOCS_URL}?tab=equipment&search=${eq.intern}`);
      const row = docRow(page, eq.intern, multi);
      await expect(row).toBeVisible();
      await expect(row).toContainText('presentado');
    }
  });

  test('el documento multirecurso se descarga desde su detalle', async ({ page }) => {
    await page.goto(`${DOCS_URL}?tab=equipment&search=${eqA.intern}`);
    const href = await docRow(page, eqA.intern, multi).getByRole('link', { name: 'Ver documento' }).getAttribute('href');
    await page.goto(href ?? '');
    await expect(page.getByRole('tabpanel', { name: 'Documento' })).toContainText('Es multirecurso');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar' }).click();
    expect(await readFile(await (await download).path(), 'utf8')).toBe(multiFile.buffer.toString());
  });
});
