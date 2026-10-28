import { expect, test, type Page } from '@playwright/test';
import { QA_COMPANY_ID, uniq } from '../../helpers/env';
import { STORAGE_PUBLIC_URL } from '../../helpers/equipment';
import {
  cleanupCustomerTree,
  createCustomerViaUi,
  createItemViaApi,
  createServiceViaUi,
  dayParts,
  findFreeReportDate,
  listedDate,
  pickCalendarDate,
  selectOption,
} from '../../helpers/operations';
import { clickHydrated } from '../../helpers/ui';

const OPERATIONS_URL = '/dashboard/operations';

const DATE_FILTERS = /^\d{1,2} de [a-záéíóú]+ de \d{4}$/;

/**
 * El listado muestra por defecto solo el mes actual y 10 filas por página, y las pruebas anteriores dejan partes (la app no
 * permite borrarlos): se acota el filtro de fechas al día del parte de prueba. Como el listado lo ve un día antes (H-22), el
 * rango va desde el día anterior hasta el elegido.
 */
async function showReportInList(page: Page) {
  await page.goto(OPERATIONS_URL);
  await expect(page.getByRole('button', { name: 'Crear Parte Diario' })).toBeVisible();
  const dayBefore = new Date(reportDate.getTime() - 24 * 3_600_000);
  await pickCalendarDate(page, page.getByRole('button', { name: DATE_FILTERS }).nth(0), dayBefore);
  await pickCalendarDate(page, page.getByRole('button', { name: DATE_FILTERS }).nth(1), reportDate);
}

/** Abre el parte diario de prueba desde el listado ("Ver Completo") y devuelve su diálogo. */
async function openReport(page: Page) {
  await showReportInList(page);
  const row = page.getByRole('row').filter({ hasText: listedDate(reportDate) });
  await clickHydrated(row.getByRole('button', { name: 'Ver Completo' }));
  const dialog = page.getByRole('dialog', { name: 'Parte Diario' });
  await expect(dialog).toBeVisible();
  return dialog;
}

let reportDate = new Date();
let documentPath = '';
const remito = `${Date.now().toString().slice(-8)}`;
/** Contenido único del documento: se compara byte a byte al descargarlo. */
const DOCUMENT = Buffer.from(`%PDF-1.4\n% QA-E2E documento de prueba ${Date.now().toString(36)}\n%%EOF\n`);

/** Ruta del documento que quedó guardada en la fila del parte de prueba (la lee de la API de partes). */
async function savedDocumentPath(page: Page): Promise<string> {
  const res = await page.request.get(`/api/daily-report/table?actual=${QA_COMPANY_ID}`);
  const body = (await res.json()) as { data: { dailyReports: { date: string; dailyreportrows: { description: string; document_path: string | null }[] }[] } };
  const report = body.data.dailyReports.find((r) => r.date.startsWith(dayParts(reportDate).iso));
  return report?.dailyreportrows.find((r) => r.description === 'Fila de prueba QA')?.document_path ?? '';
}

test.describe('operaciones: partes diarios', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const customer = uniq('ClienteOp');
  const service = uniq('ServicioOp');
  const item = uniq('ItemOp');
  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' });
    const page = await context.newPage();
    try {
      await cleanupCustomerTree(page, { item, service, customer });
    } finally {
      await context.close();
    }
  });

  test('preparación: cliente, servicio e ítem de prueba', async ({ page }) => {
    await createCustomerViaUi(page, customer);
    await createServiceViaUi(page, customer, service);
    await createItemViaApi(page, service, item);
  });

  test('crear un parte diario para una fecha lo deja abierto en el listado', async ({ page }) => {
    reportDate = await findFreeReportDate(page);
    await page.goto(OPERATIONS_URL);
    await clickHydrated(page.getByRole('button', { name: 'Crear Parte Diario' }));
    const dialog = page.getByRole('dialog', { name: 'Parte Diario' });
    await pickCalendarDate(page, dialog.getByRole('button', { name: 'Seleccione una fecha' }), reportDate);
    await dialog.getByRole('button', { name: 'Crear', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Parte Diario Modal' })).toBeVisible();
    await page.getByRole('dialog', { name: 'Parte Diario Modal' }).getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Parte Diario Modal' })).toBeHidden();
    await showReportInList(page);
    const row = page.getByRole('row').filter({ hasText: listedDate(reportDate) });
    await expect(row).toContainText('abierto');
  });

  // H-22: el listado interpreta la fecha "yyyy-MM-dd" como UTC y la pinta en hora local: en Argentina se ve un día antes.
  // Igual que producción: el código del listado es idéntico al de origin/dev y no se cambia.
  test.fixme('el parte diario se lista con la fecha que se eligió al crearlo', async ({ page }) => {
    await showReportInList(page);
    await expect(page.getByRole('row').filter({ hasText: dayParts(reportDate).display })).toBeVisible();
  });

  test('agregar una fila al parte diario', async ({ page }) => {
    const dialog = await openReport(page);
    await dialog.getByRole('button', { name: 'Agregar Fila' }).click();
    // Los tres primeros selectores del formulario, en orden: cliente, servicio e ítem (cada uno depende del anterior).
    const combos = dialog.locator('form').getByRole('combobox');
    await selectOption(page, combos.nth(0), customer);
    await selectOption(page, combos.nth(1), service);
    await selectOption(page, combos.nth(2), item);
    // Empleados y equipos son opcionales (no son `combobox`): sigue la jornada.
    await selectOption(page, combos.nth(3), 'Jornada 8 horas');
    await dialog.getByRole('textbox', { name: 'Descripción' }).fill('Fila de prueba QA');
    await dialog.locator('form').getByRole('button', { name: 'Agregar Fila' }).click();
    await expect(dialog.locator('form')).toBeHidden();
  });

  test('la fila agregada queda guardada en el parte diario', async ({ page }) => {
    // Se reabre el parte: la fila se lee de la base, no de lo que quedó en pantalla (H-23).
    const dialog = await openReport(page);
    const row = dialog.getByRole('row').filter({ hasText: 'Fila de prueba QA' });
    await expect(row).toContainText(customer);
    await expect(row).toContainText(service);
    await expect(row).toContainText(item);
    await expect(row).toContainText('pendiente');
  });

  // H-23: al agregar una fila la API responde `{ data: { data: [fila] } }` y la pantalla lee `data[0].id`: falla con un error,
  // muestra "Hubo un problema al procesar el parte diario" y la fila (que sí se guardó) no aparece hasta reabrir el parte.
  // Lo mismo pasa con el parte recién creado: su diálogo se abre sin id. Igual que producción: código idéntico al de origin/dev.
  test.fixme('al agregar una fila se muestra en la tabla y avisa que se agregó', async ({ page }) => {
    const dialog = await openReport(page);
    await dialog.getByRole('button', { name: 'Agregar Fila' }).click();
    await expect(page.getByText('Fila agregada correctamente al parte diario.')).toBeVisible();
  });

  test('pasar la fila a "ejecutado" habilita subir el documento', async ({ page }) => {
    const dialog = await openReport(page);
    const row = dialog.getByRole('row').filter({ hasText: 'Fila de prueba QA' });
    await row.getByRole('button').first().click();
    // H-24: la jornada elegida al agregar la fila no se guarda y al editar vuelve a ser obligatoria: se elige de nuevo.
    const combos = dialog.locator('form').getByRole('combobox');
    await selectOption(page, combos.nth(3), 'Jornada 8 horas');
    await combos.last().click();
    await page.getByRole('option', { name: 'Ejecutado' }).click();
    await page.getByRole('dialog', { name: 'Confirmar Estado Ejecutado' }).getByRole('button', { name: 'Aceptar' }).click();
    // Mismo defecto que H-23: la fila se guarda (PUT 200) pero la pantalla falla al leer la respuesta y no se actualiza.
    const saved = page.waitForResponse((res) => res.url().includes('/api/daily-report/daily-report-row') && res.request().method() === 'PUT');
    await dialog.getByRole('button', { name: 'Guardar Cambios' }).click();
    expect((await saved).status()).toBe(200);

    const reopened = await openReport(page);
    const executed = reopened.getByRole('row').filter({ hasText: 'Fila de prueba QA' });
    await expect(executed).toContainText('ejecutado');
    await expect(executed).toContainText('jornada 8 horas');
    await expect(executed.getByRole('button', { name: 'Subir Documento' })).toBeVisible();
  });

  test('subir el documento de la fila lo deja disponible con "Ver Documento"', async ({ page }) => {
    const dialog = await openReport(page);
    const row = dialog.getByRole('row').filter({ hasText: 'Fila de prueba QA' });
    await clickHydrated(row.getByRole('button', { name: 'Subir Documento' }));
    const upload = page.getByRole('alertdialog');
    await upload.getByPlaceholder('Número de remito').fill(remito);
    await upload.locator('input[type=file]').setInputFiles({ name: 'remito-qa.pdf', mimeType: 'application/pdf', buffer: DOCUMENT });
    await upload.getByRole('button', { name: 'Subir', exact: true }).click();
    await expect(page.getByText('Archivo subido con éxito').first()).toBeVisible();

    const reopened = await openReport(page);
    await expect(reopened.getByRole('row').filter({ hasText: 'Fila de prueba QA' }).getByRole('button', { name: 'Ver Documento' })).toBeVisible();
  });

  test('el documento está en daily-reports y su URL pública sirve el mismo contenido', async ({ page }) => {
    documentPath = await savedDocumentPath(page);
    expect(documentPath).toMatch(new RegExp(`^[^/]+/${customer}/${service}/${item}/\\d{2}-\\d{2}-\\d{4}-${remito}\\.pdf$`));

    const dir = documentPath.slice(0, documentPath.lastIndexOf('/'));
    const name = documentPath.slice(documentPath.lastIndexOf('/') + 1);
    const list = await page.request.post('/api/storage', { multipart: { op: 'list', bucket: 'daily_reports', path: dir, options: '{}' } });
    expect(((await list.json()) as { name: string }[]).map((o) => o.name)).toContain(name);

    const url = `${STORAGE_PUBLIC_URL}/daily-reports/${documentPath.split('/').map(encodeURIComponent).join('/')}`;
    const res = await page.request.get(url);
    expect(res.status()).toBe(200);
    expect((await res.body()).equals(DOCUMENT)).toBe(true);
  });

  // H-25: la tabla de filas recibe `canEdit` y `companyName` en el orden cambiado, y la carpeta de la empresa en la ruta del documento
  // queda como "true" en vez de su nombre (además `canEdit` siempre es verdadero). Igual que producción: código idéntico al de origin/dev.
  test.fixme('el documento se guarda en la carpeta con el nombre de la empresa', async ({ page }) => {
    expect(await savedDocumentPath(page)).toMatch(/^QA E2E\//);
  });

  test('"Ver Documento" muestra los datos del documento y de la fila', async ({ page }) => {
    const dialog = await openReport(page);
    await clickHydrated(dialog.getByRole('row').filter({ hasText: 'Fila de prueba QA' }).getByRole('button', { name: 'Ver Documento' }));
    await expect(page.getByText('Datos del Documento')).toBeVisible();
    await expect(page.getByText(`N° de Remito: ${remito}`)).toBeVisible();
    await expect(page.getByText(`Cliente: ${customer}`)).toBeVisible();
    await expect(page.getByText(`Servicio: ${service}`)).toBeVisible();
    await expect(page.getByText(`Item: ${item}`)).toBeVisible();
    await expect(page.getByText('Estado: ejecutado')).toBeVisible();
  });

  // H-26: "Descargar" hacía un fetch directo a la URL pública de RustFS, que no envía cabeceras CORS: el navegador lo bloquea y no
  // baja nada (con Supabase sí las enviaba). Corregido en código (DocumentView baja por /api/storage), falta deploy.
  test.fixme('"Descargar" baja el mismo archivo que se subió', async ({ page }) => {
    const dialog = await openReport(page);
    await clickHydrated(dialog.getByRole('row').filter({ hasText: 'Fila de prueba QA' }).getByRole('button', { name: 'Ver Documento' }));
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar' }).click()]);
    expect(download.suggestedFilename()).toBe(documentPath.split('/').pop());
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    expect(Buffer.concat(chunks).equals(DOCUMENT)).toBe(true);
  });

  test('cerrar el parte diario de prueba lo pasa a "cerrado"', async ({ page }) => {
    await showReportInList(page);
    const row = page.getByRole('row').filter({ hasText: listedDate(reportDate) });
    await clickHydrated(row.getByRole('combobox'));
    await page.getByRole('option', { name: 'cerrado' }).click();
    await page.getByRole('dialog', { name: 'Advertencia' }).getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText('El estado del reporte se ha actualizado correctamente.').first()).toBeVisible();
    await showReportInList(page);
    await expect(page.getByRole('row').filter({ hasText: listedDate(reportDate) })).toContainText('cerrado');
  });
});
