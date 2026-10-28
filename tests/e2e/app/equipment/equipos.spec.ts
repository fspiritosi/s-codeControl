import { expect, test } from '@playwright/test';
import {
  EQUIPMENT_URL,
  STORAGE_PUBLIC_URL,
  cleanupEquipment,
  clickEquipmentMenuItem,
  createEquipmentViaUi,
  deactivateEquipment,
  equipmentIdOf,
  gotoEquipmentList,
  newEquipmentData,
} from '../../helpers/equipment';
import { clickHydrated, hydrated } from '../../helpers/ui';

/**
 * Equipos: alta con foto (storage `vehicle_photos`), listado, detalle, edición, QR, baja y reintegro.
 * Un único equipo recorre todo el flujo (serial); la baja del final es también la limpieza.
 */
test.describe('equipos: ciclo de vida', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const eq = newEquipmentData('Eq');
  let id = '';

  test.afterAll(async ({ browser, baseURL }) => {
    await cleanupEquipment(browser, baseURL, [eq.intern]);
  });

  test('la pantalla de equipos muestra sus pestañas y el acceso al alta', async ({ page }) => {
    await page.goto(EQUIPMENT_URL);
    for (const name of ['Equipos', 'Documentos de equipos', 'Tipos de documentos', 'Mantenimiento']) {
      await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'Agregar nuevo equipo' })).toHaveAttribute('href', /action=new/);
    await expect(page.getByRole('tab', { name: 'Equipos activos' })).toHaveAttribute('aria-selected', 'true');
  });

  test('el alta de un equipo sin datos muestra los errores de validación', async ({ page }) => {
    await page.goto(`${EQUIPMENT_URL}/action?action=new`);
    await clickHydrated(page.getByRole('button', { name: 'Agregar equipo' }));
    await expect(page.getByText('El año debe ser mayor a 1900').or(page.getByText(/requerid/i)).first()).toBeVisible();
    await expect(page).toHaveURL(/action=new/);
  });

  test('alta de un equipo con foto lo muestra en el listado de activos', async ({ page }) => {
    await createEquipmentViaUi(page, eq, { photo: true });
    const row = await gotoEquipmentList(page, eq.intern);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Tractor');
    await expect(row).toContainText('Fiat');
    await expect(row).toContainText('Cronos');
    await expect(row).toContainText('operativo');
    id = await equipmentIdOf(page, eq.intern);
  });

  test('la foto del equipo se guardó en el bucket y se sirve por su URL pública', async ({ page, request }) => {
    expect(id).toBeTruthy();
    const res = await request.get(`${STORAGE_PUBLIC_URL}/vehicle-photos/${id}.png`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/image\//);
    // El mismo objeto también se descarga por la API autenticada de la app.
    const api = await page.request.get(`/api/storage?bucket=vehicle_photos&path=${id}.png`);
    expect(api.status()).toBe(200);
  });

  test('la API de storage firma una URL temporal que sirve el mismo objeto', async ({ page, request }) => {
    const res = await page.request.post('/api/storage', {
      multipart: { op: 'signed-url', bucket: 'vehicle_photos', path: `${id}.png`, expiresIn: '120' },
    });
    expect(res.status()).toBe(200);
    const { url } = (await res.json()) as { url: string };
    expect(url).toContain('X-Amz-Signature');
    // La URL firmada se pide sin cookies de sesión: solo la firma da acceso.
    const signed = await request.get(url);
    expect(signed.status()).toBe(200);
    expect(signed.headers()['content-type']).toMatch(/image\//);
  });

  // H-13: `picture` se guarda con la URL de la app (NEXT_PUBLIC_PROJECT_URL) y no con la del storage: da 404. Corregido en código y verificado en el clon desplegado.
  test('el detalle del equipo muestra la foto cargada', async ({ page }) => {
    await page.goto(`${EQUIPMENT_URL}/action?action=view&id=${id}`);
    const img = page.getByRole('img', { name: 'Imagen del empleado' });
    await expect(img).toBeVisible();
    expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  });

  test('el detalle del equipo muestra sus datos en modo lectura', async ({ page }) => {
    await page.goto(`${EQUIPMENT_URL}/action?action=view&id=${id}`);
    await expect(page.getByText(`Numero interno: ${eq.intern}`)).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Tipo de equipo *' })).toContainText('Otros');
    await expect(page.getByRole('combobox', { name: 'Marca *' })).toContainText('Fiat');
    await expect(page.getByRole('textbox', { name: 'Ingrese el numero interno' })).toBeDisabled();
    for (const name of ['Equipo', 'Valor de compra', 'Documentos', 'Reparaciones', 'QR']) {
      await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
    }
  });

  // H-14: al editar un equipo sin dominio ("Otros") el formulario manda `domain: ''` y choca con la restricción UNIQUE de
  // `vehicles.domain` (ya existe otro con ''): la app dice "equipo editado" pero no guarda. Corregido en código, falta deploy.
  test('se puede editar el equipo y los cambios persisten', async ({ page }) => {
    await page.goto(`${EQUIPMENT_URL}/action?action=view&id=${id}`);
    await clickHydrated(page.getByRole('button', { name: 'Habilitar edicion' }));
    const engine = page.getByRole('textbox', { name: 'Ingrese el tipo de motor' });
    await expect(engine).toBeEnabled();
    await engine.fill('Motor QA editado');
    await page.getByRole('textbox', { name: 'Ano' }).fill('2021');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('equipo editado').first()).toBeVisible();

    await page.goto(`${EQUIPMENT_URL}/action?action=view&id=${id}`);
    await expect(page.getByRole('textbox', { name: 'Ingrese el tipo de motor' })).toHaveValue('Motor QA editado');
    await expect(page.getByRole('textbox', { name: 'Ano' })).toHaveValue('2021');
  });

  test('la pestaña QR ofrece descargar, imprimir y copiar la URL', async ({ page }) => {
    await page.goto(`${EQUIPMENT_URL}/action?action=view&id=${id}`);
    const tab = page.getByRole('tab', { name: 'QR', exact: true });
    await hydrated(tab);
    await tab.click();
    const panel = page.getByRole('tabpanel', { name: 'QR' });
    await expect(panel.locator('#vehicle-qr-code')).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Descargar' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Imprimir' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Copiar url' })).toBeVisible();
  });

  // H-15: la URL del QR se arma como `${NEXT_PUBLIC_BASE_URL}maintenance?...` (sin "/"): queda `...sslip.iomaintenance?...`. Corregido en código y verificado en el clon desplegado.
  test('el QR apunta a la pantalla pública de mantenimiento del equipo', async ({ page, context, baseURL }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`${EQUIPMENT_URL}/action?action=view&id=${id}`);
    const tab = page.getByRole('tab', { name: 'QR', exact: true });
    await hydrated(tab);
    await tab.click();
    await page.getByRole('tabpanel', { name: 'QR' }).getByRole('button', { name: 'Copiar url' }).click();
    await expect(page.getByText('URL copiada al portapapeles').first()).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${baseURL}/maintenance?equipment=${id}`);
  });

  test('la pestaña Documentos del detalle abre sin errores', async ({ page }) => {
    await page.goto(`${EQUIPMENT_URL}/action?action=view&id=${id}`);
    const tab = page.getByRole('tab', { name: 'Documentos', exact: true });
    await hydrated(tab);
    await tab.click();
    const panel = page.getByRole('tabpanel', { name: 'Documentos', exact: true });
    await expect(panel.getByRole('tab', { name: 'Documentos permanentes' })).toBeVisible();
    await expect(panel.getByRole('tab', { name: 'Documentos mensuales' })).toBeVisible();
  });

  test('dar de baja el equipo lo pasa a inactivos y se puede reintegrar', async ({ page }) => {
    await deactivateEquipment(page, eq.intern);
    await expect(await gotoEquipmentList(page, eq.intern)).toHaveCount(0);
    const inactive = await gotoEquipmentList(page, eq.intern, true);
    await expect(inactive).toBeVisible();

    await clickEquipmentMenuItem(page, inactive, 'Reintegrar Equipo');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Equipo reintegrado').first()).toBeVisible();
    await expect(await gotoEquipmentList(page, eq.intern)).toBeVisible();
  });
});
