import { expect, test, type Page } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { STORAGE_PUBLIC_URL, cleanupEquipment, createEquipmentViaUi, newEquipmentData } from '../../helpers/equipment';
import { clickHydrated } from '../../helpers/ui';
import {
  MAINTENANCE_URL,
  createRepairType,
  createVehicleViaUi,
  deleteRepairTypeIfExists,
  gotoMaintenanceTab,
  newVehicleData,
  solidPng,
} from '../../helpers/maintenance';

/** Ruta de un objeto dentro del bucket, a partir de su URL pública (`<storage>/<bucket>/<ruta...>`). */
/** Foto de prueba: una imagen real (no de 1x1) para que el optimizador de Next la pueda mostrar. */
const PHOTO = solidPng();

const objectPathOf = (url: string, bucket: string) => decodeURIComponent(new URL(url).pathname.replace(`/${bucket}/`, ''));

/** El objeto existe en el bucket (lo lista la API de storage de la app) y su URL pública sirve una imagen. */
async function expectImageInBucket(page: Page, url: string) {
  expect(url.startsWith(STORAGE_PUBLIC_URL)).toBe(true);
  const path = objectPathOf(url, 'repair-images');
  const dir = path.slice(0, path.lastIndexOf('/'));
  const name = path.slice(path.lastIndexOf('/') + 1);
  await expect
    .poll(async () => {
      const res = await page.request.post('/api/storage', { multipart: { op: 'list', bucket: 'repair_images', path: dir, options: '{}' } });
      const objects = (await res.json()) as { name: string }[];
      return objects.some((o) => o.name === name);
    }, { message: `objeto ${path} en repair-images`, timeout: 20_000 })
    .toBe(true);
  const res = await page.request.get(url);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toMatch(/image\//);
  expect((await res.body()).equals(PHOTO)).toBe(true);
}

/**
 * Mantenimiento: tipos de reparación y solicitudes con imágenes (bucket `repair_images`). Un único equipo y un único tipo
 * recorren todo el flujo (serial). La limpieza elimina el tipo (la app borra en cascada sus solicitudes) y da de baja el equipo.
 */
test.describe('mantenimiento: solicitudes de reparación', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const eq = newVehicleData('Rep');
  const typeName = uniq('Reparacion');
  let userImageUrl = '';
  const uploaded: string[] = [];
  const otherEquipment: string[] = [];

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      await deleteRepairTypeIfExists(page, typeName);
      if (uploaded.length > 0) {
        await page.request.post('/api/storage', { multipart: { op: 'remove', bucket: 'repair_images', paths: JSON.stringify(uploaded) } });
      }
    } finally {
      await context.close();
    }
    await cleanupEquipment(browser, baseURL, [eq.intern, ...otherEquipment]);
  });

  test('alta de un equipo y de un tipo de reparación', async ({ page }) => {
    await createVehicleViaUi(page, eq);
    await createRepairType(page, typeName, 'Tipo de prueba QA');
    const panel = await gotoMaintenanceTab(page, 'Tipos de reparaciones creados');
    const row = panel.getByRole('row').filter({ hasText: typeName });
    await expect(row).toContainText('Correctivo');
    await expect(row).toContainText('Media');
  });

  test('se puede modificar el tipo de reparación', async ({ page }) => {
    const panel = await gotoMaintenanceTab(page, 'Tipos de reparaciones creados');
    await clickHydrated(panel.getByRole('row').filter({ hasText: typeName }).getByRole('button', { name: 'Modificar' }));
    const description = panel.getByRole('textbox', { name: 'Ingresa una descripción' });
    await expect(description).toHaveValue('Tipo de prueba QA');
    await description.fill('Tipo de prueba QA editado');
    await panel.getByRole('button', { name: 'Actualizar tipo de reparación' }).click();
    await expect(page.getByText('Tipo de reparación actualizado con éxito').first()).toBeVisible();
    await expect(panel.getByRole('row').filter({ hasText: typeName })).toContainText('Tipo de prueba QA editado');
  });

  test('crear una solicitud con una foto la deja pendiente en el listado', async ({ page }) => {
    const panel = await gotoMaintenanceTab(page, 'Solicitud de mantenimiento');
    await clickHydrated(panel.getByRole('combobox', { name: 'Seleccionar equipo' }));
    await page.getByPlaceholder('Buscar equipo...').fill(eq.domain);
    await page.getByRole('option', { name: new RegExp(eq.domain) }).click();
    await page.keyboard.press('Escape');
    await panel.getByRole('combobox', { name: 'Selecciona un tipo de reparación' }).click();
    await page.getByRole('option', { name: typeName }).click();
    await panel.getByRole('textbox', { name: 'Descripcion' }).fill('Falla de prueba QA');

    // El selector de archivo lo abre un input creado al hacer clic en la tarjeta: se responde al diálogo y se reintenta el clic.
    page.on('filechooser', (chooser) => void chooser.setFiles({ name: 'falla.png', mimeType: 'image/png', buffer: PHOTO }));
    await expect(async () => {
      await panel.getByText('1', { exact: true }).click({ timeout: 3_000 });
      await expect(panel.getByRole('img', { name: 'Imagen 1' })).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 20_000 });

    await panel.getByRole('button', { name: 'Agregar reparacion' }).click();
    await panel.getByRole('button', { name: 'Registrar solicitudes' }).click();
    await expect(page.getByText('Solicitud de reparación creada con éxito')).toBeVisible();

    const list = await gotoMaintenanceTab(page, 'Solicitudes activas');
    const row = list.getByRole('row').filter({ hasText: typeName });
    await expect(row).toContainText('Falla de prueba QA');
    await expect(row).toContainText('Pendiente');
    await expect(row).toContainText(eq.domain);
    await expect(row).toContainText(eq.intern);
  });

  // H-18: la app sube la foto con una ruta que empieza con "/" y /api/storage la rechaza (400); la solicitud se crea pero la foto
  // nunca llega al bucket. Corregido en código (handlers.server.ts normaliza las barras iniciales), falta deploy.
  test('al crear la solicitud, la foto queda en repair-images y se sirve por su URL pública', async ({ page }) => {
    const list = await gotoMaintenanceTab(page, 'Solicitudes activas');
    await clickHydrated(list.getByRole('row').filter({ hasText: typeName }).getByRole('button', { name: 'Reparar equipo' }));
    const link = page.getByRole('dialog', { name: 'Reparación de equipo' }).getByRole('link', { name: 'Imagen 1' });
    await expectImageInBucket(page, (await link.getAttribute('href')) ?? '');
  });

  // H-19: un equipo sin kilometraje (los de tipo "Otros" lo guardan en null) no puede tener solicitudes: el campo Kilometraje está
  // oculto pero valida "Expected string, received null" y "Agregar reparacion" no hace nada. Igual que producción: código idéntico.
  test.fixme('se puede agregar una solicitud para un equipo "Otros" sin kilometraje', async ({ page }) => {
    const other = newEquipmentData('RepOtros');
    otherEquipment.push(other.intern);
    await createEquipmentViaUi(page, other);
    const panel = await gotoMaintenanceTab(page, 'Solicitud de mantenimiento');
    await clickHydrated(panel.getByRole('combobox', { name: 'Seleccionar equipo' }));
    await page.getByPlaceholder('Buscar equipo...').fill(other.serie);
    await page.getByRole('option', { name: new RegExp(other.serie) }).click();
    await page.keyboard.press('Escape');
    await panel.getByRole('combobox', { name: 'Selecciona un tipo de reparación' }).click();
    await page.getByRole('option', { name: typeName }).click();
    await panel.getByRole('textbox', { name: 'Descripcion' }).fill('Falla sin kilometraje');
    await panel.getByRole('button', { name: 'Agregar reparacion' }).click();
    await expect(panel.getByRole('row').filter({ hasText: 'Falla sin kilometraje' })).toBeVisible();
  });

  test('una imagen guardada en repair-images se sirve por su URL pública y se muestra en la solicitud', async ({ page }) => {
    const list = await gotoMaintenanceTab(page, 'Solicitudes activas');
    await clickHydrated(list.getByRole('row').filter({ hasText: typeName }).getByRole('button', { name: 'Reparar equipo' }));
    const dialog = page.getByRole('dialog', { name: 'Reparación de equipo' });
    const link = dialog.getByRole('link', { name: 'Imagen 1' });
    await expect(link).toBeVisible();
    userImageUrl = (await link.getAttribute('href')) ?? '';

    // Mientras H-18 siga abierto la app no sube la foto: se guarda por la API en la misma ruta que guarda la solicitud.
    const path = objectPathOf(userImageUrl, 'repair-images');
    uploaded.push(path);
    const up = await page.request.post('/api/storage', {
      multipart: {
        op: 'upload',
        bucket: 'repair_images',
        path,
        file: { name: 'falla.png', mimeType: 'image/png', buffer: PHOTO },
        options: JSON.stringify({ upsert: true, contentType: 'image/png' }),
      },
    });
    expect(up.status()).toBe(200);
    await expectImageInBucket(page, userImageUrl);

    await page.reload();
    const list2 = await gotoMaintenanceTab(page, 'Solicitudes activas');
    await clickHydrated(list2.getByRole('row').filter({ hasText: typeName }).getByRole('button', { name: 'Reparar equipo' }));
    const img = page.getByRole('dialog', { name: 'Reparación de equipo' }).getByRole('img', { name: 'Imagen 1' });
    // La imagen es `loading="lazy"`: no se descarga hasta que entra en el área visible del diálogo.
    // Las tarjetas se vuelven a montar en cada render (key aleatoria): se reintenta todo el bloque.
    await expect(async () => {
      await img.scrollIntoViewIfNeeded({ timeout: 2_000 });
      expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth, undefined, { timeout: 2_000 })).toBeGreaterThan(0);
    }).toPass({ timeout: 20_000 });
    // El historial de eventos lo escribe el trigger log_repair_changes al crear la solicitud.
    await expect(page.getByRole('dialog', { name: 'Reparación de equipo' }).getByText('La solicitud de mantenimiento ha sido registrada')).toBeVisible();
  });

  test('el mecánico pasa la solicitud a "En reparación" y queda registrado en sus eventos', async ({ page }) => {
    const list = await gotoMaintenanceTab(page, 'Solicitudes activas');
    await clickHydrated(list.getByRole('row').filter({ hasText: typeName }).getByRole('button', { name: 'Reparar equipo' }));
    const dialog = page.getByRole('dialog', { name: 'Reparación de equipo' });
    await dialog.locator('#status').click();
    await page.getByRole('option', { name: 'En reparación' }).click();
    await dialog.getByRole('textbox', { name: 'Descripción' }).fill('Se comenzó la reparación QA');
    await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Cambios guardados').first()).toBeVisible();

    const fresh = await gotoMaintenanceTab(page, 'Solicitudes activas');
    await expect(fresh.getByRole('row').filter({ hasText: typeName })).toContainText('En reparación');
    await clickHydrated(fresh.getByRole('row').filter({ hasText: typeName }).getByRole('button', { name: 'Reparar equipo' }));
    await expect(page.getByRole('dialog', { name: 'Reparación de equipo' }).getByText('Se comenzó la reparación QA')).toBeVisible();
  });

  test('finalizar la solicitud con una imagen la mueve a "Solicitudes finalizadas"', async ({ page }) => {
    const list = await gotoMaintenanceTab(page, 'Solicitudes activas');
    await clickHydrated(list.getByRole('row').filter({ hasText: typeName }).getByRole('button', { name: 'Reparar equipo' }));
    const dialog = page.getByRole('dialog', { name: 'Reparación de equipo' });
    await dialog.locator('#status').click();
    await page.getByRole('option', { name: 'Finalizado' }).click();
    await dialog.getByRole('textbox', { name: 'Descripción' }).fill('Reparación terminada QA');

    page.on('filechooser', (chooser) => void chooser.setFiles({ name: 'final.png', mimeType: 'image/png', buffer: PHOTO }));
    await expect(async () => {
      // El "1" de la tarjeta (no el del historial de eventos); desaparece cuando la tarjeta muestra la vista previa.
      const slot = dialog.locator('span.text-3xl').filter({ hasText: /^1$/ });
      await slot.click({ timeout: 3_000 });
      await expect(slot).toHaveCount(0, { timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
    await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Cambios guardados').first()).toBeVisible();

    const active = await gotoMaintenanceTab(page, 'Solicitudes activas');
    await expect(active.getByRole('row').filter({ hasText: typeName })).toHaveCount(0);
    await page.goto(`${MAINTENANCE_URL}?tab=finalizadas`);
    const done = page.getByRole('tabpanel', { name: 'Solicitudes finalizadas' });
    const row = done.getByRole('row').filter({ hasText: typeName });
    await expect(row).toContainText('Finalizado');
  });

  /** Abre el detalle de la solicitud finalizada y devuelve el enlace de la imagen que adjuntó el mecánico. */
  async function openFinishedMechanicImage(page: Page) {
    await page.goto(`${MAINTENANCE_URL}?tab=finalizadas`);
    const done = page.getByRole('tabpanel', { name: 'Solicitudes finalizadas' });
    await clickHydrated(done.getByRole('row').filter({ hasText: typeName }).getByRole('button', { name: typeName }));
    const dialog = page.getByRole('dialog', { name: 'Detalles de reparación' });
    const link = dialog.locator('a[href*="mechanic-images"]');
    await expect(link).toBeVisible();
    return { dialog, link };
  }

  // H-18 (mismo defecto con la imagen que adjunta el mecánico): la ruta empieza con "/" y /api/storage la rechaza.
  test('al finalizar la solicitud, la imagen del mecánico queda en repair-images', async ({ page }) => {
    const { link } = await openFinishedMechanicImage(page);
    await expectImageInBucket(page, (await link.getAttribute('href')) ?? '');
  });

  test('una imagen del mecánico guardada en repair-images se muestra en la solicitud finalizada', async ({ page }) => {
    const { dialog, link } = await openFinishedMechanicImage(page);
    const url = (await link.getAttribute('href')) ?? '';
    const path = objectPathOf(url, 'repair-images');
    uploaded.push(path);
    const up = await page.request.post('/api/storage', {
      multipart: {
        op: 'upload',
        bucket: 'repair_images',
        path,
        file: { name: 'final.png', mimeType: 'image/png', buffer: PHOTO },
        options: JSON.stringify({ upsert: true, contentType: 'image/png' }),
      },
    });
    expect(up.status()).toBe(200);
    await expectImageInBucket(page, url);

    const img = dialog.locator('a[href*="mechanic-images"] img');
    await expect(async () => {
      await img.scrollIntoViewIfNeeded({ timeout: 2_000 });
      expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth, undefined, { timeout: 2_000 })).toBeGreaterThan(0);
    }).toPass({ timeout: 20_000 });
  });
});
