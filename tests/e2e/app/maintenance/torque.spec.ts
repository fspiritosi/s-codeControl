import { expect, test, type Page } from '@playwright/test';
import { cleanupEquipment } from '../../helpers/equipment';
import { clickHydrated } from '../../helpers/ui';
import { createVehicleViaUi, newVehicleData } from '../../helpers/maintenance';

const TORQUE_URL = '/dashboard/maintenance/torque';

/** Campo del formulario por su rótulo (los `Label` del formulario no están asociados al input). */
const field = (page: Page, label: string) =>
  page.locator('div.space-y-1\\.5').filter({ has: page.getByText(label, { exact: true }) }).locator('input, textarea').first();

/** El PDF descargado es un PDF de verdad con el nombre esperado. */
async function expectPdfDownload(download: import('@playwright/test').Download, domain: string) {
  expect(download.suggestedFilename()).toBe(`Certificado_torqueo_${domain}.pdf`);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks);
  expect(body.subarray(0, 5).toString()).toBe('%PDF-');
  expect(body.length).toBeGreaterThan(2_000);
}

/**
 * Certificados de torqueo: alta con descarga del PDF, listado, detalle y reimpresión. La app no permite borrar certificados
 * (son un registro emitido): el de prueba queda asociado a un equipo dado de baja.
 */
test.describe('mantenimiento: certificados de torqueo', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const eq = newVehicleData('Torque');
  let certificateNumber = '';

  test.afterAll(async ({ browser, baseURL }) => {
    await cleanupEquipment(browser, baseURL, [eq.intern]);
  });

  test('el listado de certificados ofrece el acceso al alta', async ({ page }) => {
    await page.goto(TORQUE_URL);
    await expect(page.getByRole('link', { name: /Nuevo certificado/i }).first()).toBeVisible();
    await createVehicleViaUi(page, eq);
  });

  test('crear un certificado descarga el PDF y lo deja en el listado', async ({ page }) => {
    await page.goto(`${TORQUE_URL}/new`);
    await clickHydrated(page.getByRole('combobox').first());
    await page.getByPlaceholder('Buscar por interno, patente o marca...').fill(eq.domain);
    await page.getByRole('option', { name: new RegExp(eq.domain) }).click();
    await expect(field(page, 'Patente')).toHaveValue(eq.domain);
    await expect(field(page, 'N° Interno')).toHaveValue(eq.intern);

    await field(page, 'Conductor').fill('Conductor QA');
    await field(page, 'Mecánico').fill('Mecánico QA');
    await field(page, 'Lugar').fill('Taller QA');
    await field(page, 'Herramienta de Torque (tipo/Modelo)').fill('Torquímetro QA');
    await field(page, 'Torque requerido').fill('450 Nm');
    await field(page, 'Rango de tolerancia').fill('440-460');
    for (const radio of await page.getByRole('radio', { name: 'Sí' }).all()) await radio.click();
    await page.getByRole('radio', { name: 'Seco' }).click();
    await page.getByText('Seleccionar secuencia', { exact: true }).click();
    await page.getByRole('option', { name: '6 tuercas' }).click();

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Guardar y descargar PDF' }).click()]);
    await expectPdfDownload(download, eq.domain);
    await expect(page).toHaveURL(new RegExp(`${TORQUE_URL}$`));

    const row = page.getByRole('row').filter({ hasText: eq.domain });
    await expect(row).toContainText(eq.intern);
    await expect(row).toContainText('Mecánico QA');
    certificateNumber = (await row.getByRole('link').first().innerText()).trim();
    expect(certificateNumber).not.toBe('');
  });

  test('el detalle del certificado muestra lo cargado y permite reimprimir el PDF', async ({ page }) => {
    await page.goto(TORQUE_URL);
    await clickHydrated(page.getByRole('link', { name: certificateNumber, exact: true }));
    await expect(page.getByRole('heading', { name: `Certificado ${certificateNumber}` })).toBeVisible();
    await expect(page.getByText('Conductor QA')).toBeVisible();
    await expect(page.getByText('Taller QA')).toBeVisible();
    await expect(page.getByText('Torquímetro QA')).toBeVisible();
    await expect(page.getByText('450 Nm')).toBeVisible();
    await expect(page.getByText('440-460 Nm')).toBeVisible();
    await expect(page.getByText('6 tuercas')).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Reimprimir PDF' }).click()]);
    await expectPdfDownload(download, eq.domain);
  });
});
