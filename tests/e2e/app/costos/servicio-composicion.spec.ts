import { expect, test, type Page } from '@playwright/test';
import {
  COMPOSITION_PERIOD,
  COSTOS_BUCKET,
  COSTOS_URL,
  FIXED_CATEGORY,
  FIXED_CCT,
  FIXED_SERVICE,
  clickHydrated,
  compositionPdfPath,
  hydrated,
  compositionPdfPublicUrl,
  ensureFixedCategory,
  openFixedCct,
  openFixedService,
  rowIconButtons,
  selectOption,
} from '../../helpers/costos';
import { uniq } from '../../helpers/env';
import { cleanupEmployees, createEmployeeViaUi, newEmployeeData } from '../../helpers/employees';
import { STORAGE_PUBLIC_URL, cleanupEquipment, createEquipmentViaUi, newEquipmentData } from '../../helpers/equipment';
import { objectInBucket } from '../../helpers/hse';
import { FIXED_CUSTOMER, ensureFixedCustomer } from '../../helpers/sales';

/**
 * Costos: CCT, servicio, mano de obra, otros costos de personal, equipos, combustible, composición con su PDF (bucket privado
 * `costos-pdfs`, URL firmada) y fórmula polinómica. Todo cuelga del CCT y del servicio fijos, que la app no permite borrar, por eso
 * va en un solo archivo serial (dos workers creando el mismo convenio lo duplicarían).
 */
test.describe('costos: CCT, servicio y composición', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });
  test.use({ actionTimeout: 15_000 });

  const cat = { codigo: `QC${Date.now().toString(36).slice(-6).toUpperCase()}`, nombre: uniq('Categoria') };
  const concept = { codigo: `QAE2E_${Date.now().toString(36).toUpperCase()}`, nombre: uniq('ConceptoCCT') };
  const employee = newEmployeeData('costos');
  const vehicle = newEquipmentData('Costos');
  const ocpItem = uniq('OCP');
  let serviceId = '';
  let compositionUrl = '';

  test.afterAll(async ({ browser, baseURL }) => {
    // Red de seguridad: si un test falló a medio camino, se vacían las asignaciones del servicio fijo (solo cuelgan datos de prueba).
    if (serviceId) {
      const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
      const page = await context.newPage();
      try {
        for (const tab of ['Equipos', 'MOD', 'OCP']) {
          await page.goto(`${COSTOS_URL}/servicios/${serviceId}`);
          await clickHydrated(page.getByRole('tab', { name: tab, exact: true }));
          await removeAllRows(page);
        }
        await page.goto(`${COSTOS_URL}/combustible`);
        await selectOption(page, page.getByRole('combobox').first(), new RegExp(FIXED_SERVICE));
        await removeAllRows(page);
      } finally {
        await context.close();
      }
    }
    await cleanupEmployees(browser, baseURL, [employee.lastname]);
    await cleanupEquipment(browser, baseURL, [vehicle.intern]);
  });

  /** Borra una por una todas las filas con botón de eliminar de la tabla visible (la app pide confirmar con un diálogo del navegador). */
  const removeAllRows = async (page: Page) => {
    const rows = page.locator('tbody tr').filter({ has: page.getByRole('button') });
    await page.waitForLoadState('networkidle');
    for (let left = await rows.count(); left > 0; left = await rows.count()) {
      page.once('dialog', (d) => void d.accept());
      await rowIconButtons(rows.first()).last().click();
      await expect(rows).toHaveCount(left - 1);
    }
  };

  const serviceTab = async (page: Page, tab: string) => {
    await page.goto(`${COSTOS_URL}/servicios/${serviceId}`);
    await clickHydrated(page.getByRole('tab', { name: tab, exact: true }));
    await expect(page.getByRole('tab', { name: tab, exact: true })).toHaveAttribute('aria-selected', 'true');
  };

  test('el convenio fijo aparece activo en el listado', async ({ page }) => {
    await ensureFixedCustomer(page);
    await openFixedCct(page);
    const card = page.locator('a[href^="?cctId="]').filter({ hasText: FIXED_CCT.codigo });
    await expect(card).toContainText(FIXED_CCT.nombre);
    await expect(card).toContainText('Activo');
    await expect(card).toContainText(`Desde ${FIXED_CCT.vigencia}`);
  });

  test('crear, editar y eliminar una categoría del convenio', async ({ page }) => {
    await openFixedCct(page);
    await clickHydrated(page.getByRole('button', { name: 'Agregar categoría' }));
    const dialog = page.getByRole('dialog', { name: 'Nueva categoría' });
    await dialog.locator('#cat_codigo').fill(cat.codigo);
    await dialog.locator('#cat_nombre').fill(cat.nombre);
    await dialog.getByRole('button', { name: 'Crear categoría' }).click();
    const row = page.getByRole('row').filter({ hasText: cat.codigo });
    await expect(row).toContainText(cat.nombre);

    await rowIconButtons(row).first().click();
    const edit = page.getByRole('dialog', { name: 'Editar categoría' });
    await edit.locator('#cat_nombre').fill(`${cat.nombre}-ed`);
    await edit.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByRole('row').filter({ hasText: cat.codigo })).toContainText(`${cat.nombre}-ed`);

    page.once('dialog', (d) => void d.accept());
    await rowIconButtons(page.getByRole('row').filter({ hasText: cat.codigo })).last().click();
    await expect(page.getByRole('row').filter({ hasText: cat.codigo })).toHaveCount(0);
  });

  test('crear un concepto del convenio, editarlo y desactivarlo', async ({ page }) => {
    await openFixedCct(page);
    await clickHydrated(page.getByRole('tab', { name: 'Conceptos' }));
    await expect(page.getByRole('button', { name: 'Agregar concepto' })).toBeVisible();
    const rowOf = () => page.getByRole('row').filter({ hasText: concept.codigo });
    await clickHydrated(page.getByRole('button', { name: 'Agregar concepto' }));
    const dialog = page.getByRole('dialog', { name: 'Nuevo concepto' });
    await dialog.getByPlaceholder('BASICO').first().fill(concept.codigo);
    await dialog.getByPlaceholder('Sueldo Básico').fill(concept.nombre);
    await dialog.getByPlaceholder('227559.00').fill('1000');
    await dialog.getByRole('button', { name: 'Crear concepto' }).click();
    await expect(rowOf()).toContainText(concept.nombre);

    await rowIconButtons(rowOf()).first().click();
    const edit = page.getByRole('dialog', { name: 'Editar concepto' });
    await edit.getByPlaceholder('Sueldo Básico').fill(`${concept.nombre}-ed`);
    await edit.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(rowOf()).toContainText(`${concept.nombre}-ed`);

    // La app no borra conceptos de un convenio: desactivarlo es la limpieza (queda fuera de la lista y de los cálculos).
    await rowOf().getByRole('button', { name: 'Desactivar' }).click();
    await expect(rowOf()).toHaveCount(0);
  });

  // H-41: listarCCTs solo trae los conceptos activos, así que el botón "Inactivos" nunca muestra nada y un concepto desactivado no se
  // puede volver a activar desde la pantalla. Igual que producción (mismo código): no se cambia.
  test.fixme('un concepto desactivado se ve con "Inactivos" y se puede reactivar (H-41)', async ({ page }) => {
    await openFixedCct(page);
    await clickHydrated(page.getByRole('tab', { name: 'Conceptos' }));
    await clickHydrated(page.getByRole('button', { name: 'Inactivos' }));
    const row = page.getByRole('row').filter({ hasText: concept.codigo });
    await expect(row.getByRole('button', { name: 'Activar' })).toBeVisible();
  });

  test('crear el servicio lo muestra en el listado y se edita desde su detalle', async ({ page }) => {
    await ensureFixedCategory(page);
    serviceId = await openFixedService(page);
    await expect(page.getByText(`Datos generales — ${FIXED_CUSTOMER} · CCT ${FIXED_CCT.codigo}`)).toBeVisible();
    await page.getByLabel('IIBB').fill('3');
    await clickHydrated(page.getByRole('button', { name: 'Guardar cambios' }));
    await expect(page.getByText('Servicio actualizado').first()).toBeVisible();

    await page.goto(`${COSTOS_URL}/servicios`);
    const row = page.getByRole('row').filter({ hasText: FIXED_SERVICE });
    await expect(row).toContainText(FIXED_CUSTOMER);
    await expect(row).toContainText(FIXED_CCT.codigo);
    await expect(row).toContainText('Activo');
  });

  test('agregar y editar un ítem de otros costos de personal; se ve en la pantalla transversal', async ({ page }) => {
    await serviceTab(page, 'OCP');
    await clickHydrated(page.getByRole('button', { name: 'Agregar ítem' }));
    const dialog = page.getByRole('dialog', { name: 'Nuevo ítem OCP' });
    await dialog.locator('#cantidad_personas').fill('2');
    await dialog.locator('#concepto').fill(ocpItem);
    await dialog.locator('#costo_anual').fill('120000');
    await dialog.getByRole('button', { name: 'Agregar' }).click();
    const row = page.getByRole('row').filter({ hasText: ocpItem });
    await expect(row).toContainText(/\$\s*120\.000,00/);

    await rowIconButtons(row).first().click();
    const edit = page.getByRole('dialog', { name: 'Editar ítem OCP' });
    await edit.locator('#costo_anual').fill('240000');
    await edit.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('row').filter({ hasText: ocpItem })).toContainText(/\$\s*240\.000,00/);

    await page.goto(`${COSTOS_URL}/otros-costos-personal`);
    await expect(page.getByRole('row').filter({ hasText: ocpItem })).toContainText(FIXED_SERVICE);
  });

  test('asignar un chofer al servicio, editarlo y verlo en mano de obra', async ({ page }) => {
    await createEmployeeViaUi(page, employee);
    await serviceTab(page, 'MOD');
    await clickHydrated(page.getByRole('button', { name: 'Asignar chofer' }));
    const dialog = page.getByRole('dialog', { name: 'Nueva asignación de chofer' });
    await selectOption(page, dialog.getByRole('combobox').nth(0), new RegExp(employee.lastname));
    await selectOption(page, dialog.getByRole('combobox').nth(1), FIXED_CATEGORY.codigo);
    await dialog.locator('#antiguedad').fill('3');
    await dialog.getByRole('button', { name: 'Agregar' }).click();
    const row = page.getByRole('row').filter({ hasText: employee.lastname });
    await expect(row).toContainText(FIXED_CATEGORY.codigo);

    await rowIconButtons(row).first().click();
    const edit = page.getByRole('dialog', { name: 'Editar asignación' });
    await edit.locator('#afectacion').fill('50');
    await edit.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: employee.lastname })).toContainText('50%');

    await page.goto(`${COSTOS_URL}/mano-de-obra`);
    const global = page.getByRole('row').filter({ hasText: employee.lastname });
    await expect(global).toContainText(FIXED_SERVICE);
    await expect(global).toContainText(FIXED_CATEGORY.codigo);
  });

  test('asignar un equipo al servicio y cargar su combustible', async ({ page }) => {
    await createEquipmentViaUi(page, vehicle);
    await serviceTab(page, 'Equipos');
    await clickHydrated(page.getByRole('button', { name: 'Asignar equipo' }));
    const dialog = page.getByRole('dialog', { name: 'Asignar equipo al servicio' });
    await selectOption(page, dialog.getByRole('combobox'), new RegExp(vehicle.intern));
    await dialog.getByRole('button', { name: /Asignar|Agregar/ }).last().click();
    await expect(page.getByText('Equipo asignado').first()).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: vehicle.intern })).toBeVisible();

    await page.goto(`${COSTOS_URL}/combustible`);
    await selectOption(page, page.getByRole('combobox').first(), new RegExp(FIXED_SERVICE));
    await clickHydrated(page.getByRole('button', { name: 'Cargar registro' }));
    const form = page.getByRole('dialog', { name: 'Nuevo registro de combustible' });
    await selectOption(page, form.getByRole('combobox'), new RegExp(vehicle.intern));
    await form.locator('#periodo').fill(COMPOSITION_PERIOD);
    await form.locator('#litros_mensuales').fill('100');
    await form.locator('#precio_gasoil_lt').fill('1000');
    await form.getByRole('button', { name: 'Cargar registro' }).click();
    await expect(page.getByText('Registro guardado').first()).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: vehicle.intern })).toBeVisible();
  });

  test('generar la composición del período la muestra en el servicio y en el listado de composiciones', async ({ page }) => {
    await serviceTab(page, 'Composición');
    await clickHydrated(page.getByRole('button', { name: 'Generar composición' }));
    const dialog = page.getByRole('dialog', { name: 'Generar composición' });
    await dialog.locator('#periodo').fill(COMPOSITION_PERIOD);
    await dialog.getByRole('button', { name: 'Generar', exact: true }).click();
    await expect(page.getByText('Composición generada.').first()).toBeVisible();
    await page.waitForURL(/\/dashboard\/costos\/composicion\/[0-9a-f-]{36}$/);
    compositionUrl = page.url();
    await expect(page.getByRole('heading', { name: /Composición —/ })).toBeVisible();
    await expect(page.getByRole('link', { name: FIXED_SERVICE })).toBeVisible();
    await expect(page.getByText('Exportar PDF')).toBeVisible();

    await page.goto(`${COSTOS_URL}/composicion`);
    const row = page.getByRole('row').filter({ hasText: FIXED_SERVICE });
    await expect(row.first()).toContainText(FIXED_CUSTOMER);
  });

  test('el PDF de la composición queda en el bucket privado costos-pdfs y se descarga con URL firmada', async ({ page }) => {
    await page.goto(compositionUrl);
    await hydrated(page.getByRole('button', { name: 'Exportar PDF' }));
    type Win = { __opened: string[] };
    await page.evaluate(() => {
      (window as unknown as Win).__opened = [];
      window.open = (url) => {
        (window as unknown as Win).__opened.push(String(url));
        return null;
      };
    });
    await page.getByRole('button', { name: 'Exportar PDF' }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as Win).__opened.length)).toBe(1);
    const signedUrl = await page.evaluate(() => (window as unknown as Win).__opened[0]);

    const path = compositionPdfPath(serviceId, COMPOSITION_PERIOD);
    expect(signedUrl).toContain(STORAGE_PUBLIC_URL);
    expect(new URL(signedUrl).pathname).toBe(`/${COSTOS_BUCKET}/${path}`);
    expect(new URL(signedUrl).searchParams.get('X-Amz-Signature')).toBeTruthy();
    await expect.poll(() => objectInBucket(page, COSTOS_BUCKET, path), { timeout: 20_000 }).toBe(true);

    // La URL firmada entrega un PDF de verdad; la misma ruta sin firma no se puede leer (bucket privado).
    const signed = await page.request.get(signedUrl);
    expect(signed.status()).toBe(200);
    const body = await signed.body();
    expect(body.subarray(0, 5).toString()).toBe('%PDF-');
    expect(body.length).toBeGreaterThan(1_000);
    const unsigned = await page.request.get(compositionPdfPublicUrl(serviceId, COMPOSITION_PERIOD));
    expect(unsigned.status()).not.toBe(200);
  });

  test('recalcular la composición vuelve a generar el PDF en el mismo objeto', async ({ page }) => {
    await page.goto(compositionUrl);
    await clickHydrated(page.getByRole('button', { name: 'Recalcular' }));
    await expect(page.getByText(/Composición actualizada|cambió/).first()).toBeVisible();
    await expect.poll(() => objectInBucket(page, COSTOS_BUCKET, compositionPdfPath(serviceId, COMPOSITION_PERIOD)), { timeout: 20_000 }).toBe(true);
  });

  // La fórmula polinómica del servicio fijo no se puede borrar (no hay acción en pantalla): se crea una vez y después solo se edita.
  test('la fórmula polinómica se inicializa desde la composición y se edita su descripción', async ({ page }) => {
    await page.goto(`${COSTOS_URL}/formula-polinomica`);
    await clickHydrated(page.getByRole('row').filter({ hasText: FIXED_SERVICE }));
    await page.waitForURL(/\/formula-polinomica\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { name: new RegExp(`Fórmula polinómica — ${FIXED_SERVICE}`) })).toBeVisible();
    const init = page.getByRole('button', { name: 'Inicializar desde composición' });
    if (await init.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await init.click();
      await expect(page.getByText('Fórmula inicializada desde la composición más reciente.').first()).toBeVisible();
    }
    for (const code of ['I001', 'I002', 'I003', 'I004']) await expect(page.getByRole('cell', { name: code, exact: true })).toBeVisible();

    const config = page.locator('div.rounded-xl, div.rounded-lg').filter({ has: page.getByText('Configuración', { exact: true }) }).last();
    await rowIconButtons(config).first().click();
    const description = `QA-E2E descripción ${Date.now().toString(36)}`;
    await config.locator('#descripcion').fill(description);
    await rowIconButtons(config).first().click();
    await expect(page.getByText('Configuración actualizada.').first()).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
  });

  test('eliminar el registro de combustible lo saca de la lista', async ({ page }) => {
    await page.goto(`${COSTOS_URL}/combustible`);
    await selectOption(page, page.getByRole('combobox').first(), new RegExp(FIXED_SERVICE));
    const row = page.getByRole('row').filter({ hasText: vehicle.intern });
    await expect(row).toBeVisible();
    page.once('dialog', (d) => void d.accept());
    await rowIconButtons(row).last().click();
    await expect(page.getByRole('row').filter({ hasText: vehicle.intern })).toHaveCount(0);
  });

  test('quitar el equipo, el chofer y el ítem OCP del servicio', async ({ page }) => {
    await serviceTab(page, 'Equipos');
    page.once('dialog', (d) => void d.accept());
    await rowIconButtons(page.getByRole('row').filter({ hasText: vehicle.intern })).last().click();
    await expect(page.getByRole('row').filter({ hasText: vehicle.intern })).toHaveCount(0);

    await serviceTab(page, 'MOD');
    page.once('dialog', (d) => void d.accept());
    await rowIconButtons(page.getByRole('row').filter({ hasText: employee.lastname })).last().click();
    await expect(page.getByRole('row').filter({ hasText: employee.lastname })).toHaveCount(0);

    await serviceTab(page, 'OCP');
    page.once('dialog', (d) => void d.accept());
    await rowIconButtons(page.getByRole('row').filter({ hasText: ocpItem })).last().click();
    await expect(page.getByRole('row').filter({ hasText: ocpItem })).toHaveCount(0);
  });
});
