import { expect, test, type Page } from '@playwright/test';
import { QA_COMPANY_ID } from '../../helpers/env';
import { TINY_PNG } from '../../helpers/employees';
import { STORAGE_PUBLIC_URL } from '../../helpers/equipment';
import { expectPublicUrlServes, objectInBucket, removeFromBucket } from '../../helpers/hse';
import { clickHydrated, hydrated } from '../../helpers/ui';

const BUCKET = 'logo';
const SIGNATURE_PATH = `pdf-signatures/${QA_COMPANY_ID}.png`;

async function gotoPdfSettings(page: Page) {
  await page.goto('/dashboard/settings?section=pdf');
  await hydrated(page.getByRole('button', { name: 'Guardar cambios' }));
}

/**
 * Configuración > PDF: texto de encabezado y pie, PDFs firmados y firma (imagen PNG en el bucket público `logo`).
 * Los textos y la selección originales de la empresa QA se restauran al terminar.
 */
test.describe('configuración: PDF y firma', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  let original = { header: '', footer: '', ordenesCompra: false };

  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      await gotoPdfSettings(page);
      if (await page.getByRole('button', { name: 'Eliminar firma' }).isVisible({ timeout: 2_000 }).catch(() => false)) {
        await page.getByRole('button', { name: 'Eliminar firma' }).click();
        await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
        await expect(page.getByText('No hay firma cargada.')).toBeVisible();
      }
      await page.getByLabel('Texto del encabezado').fill(original.header);
      await page.getByLabel('Texto del pie de página').fill(original.footer);
      const checkbox = page.getByRole('checkbox', { name: 'Órdenes de compra' });
      if ((await checkbox.isChecked()) !== original.ordenesCompra) await checkbox.click();
      await page.getByRole('button', { name: 'Guardar cambios' }).click();
      await expect(page.getByText('Configuración guardada').first()).toBeVisible();
      // La app deja el objeto de la firma en el bucket al eliminarla (H-40): se borra por la API de storage.
      await removeFromBucket(page, BUCKET, [SIGNATURE_PATH]);
    } finally {
      await context.close();
    }
  });

  test('subir la firma la guarda en el bucket logo, con URL pública y se ve en pantalla', async ({ page }) => {
    await gotoPdfSettings(page);
    original = {
      header: await page.getByLabel('Texto del encabezado').inputValue(),
      footer: await page.getByLabel('Texto del pie de página').inputValue(),
      ordenesCompra: await page.getByRole('checkbox', { name: 'Órdenes de compra' }).isChecked(),
    };
    await page.locator('#pdf-signature').setInputFiles({ name: 'firma-qa.png', mimeType: 'image/png', buffer: TINY_PNG });
    await expect(page.getByText('Firma cargada').first()).toBeVisible();

    const image = page.getByRole('img', { name: 'Firma' });
    await expect(image).toBeVisible();
    const url = `${STORAGE_PUBLIC_URL}/${BUCKET}/${SIGNATURE_PATH}`;
    await expect(image).toHaveAttribute('src', url);
    await expect.poll(() => objectInBucket(page, BUCKET, SIGNATURE_PATH), { timeout: 20_000 }).toBe(true);
    await expectPublicUrlServes(page, url, TINY_PNG);
    // La imagen se descargó y decodificó de verdad (no es un ícono roto).
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

    // Sobrevive a una recarga.
    await page.reload();
    await expect(page.getByRole('img', { name: 'Firma' })).toHaveAttribute('src', url);
  });

  test('guardar encabezado, pie y PDFs firmados se conserva al recargar', async ({ page }) => {
    await gotoPdfSettings(page);
    await page.getByLabel('Texto del encabezado').fill('QA-E2E encabezado');
    await page.getByLabel('Texto del pie de página').fill('QA-E2E pie');
    const checkbox = page.getByRole('checkbox', { name: 'Órdenes de compra' });
    if (!(await checkbox.isChecked())) await checkbox.click();
    await clickHydrated(page.getByRole('button', { name: 'Guardar cambios' }));
    await expect(page.getByText('Configuración guardada').first()).toBeVisible();

    await gotoPdfSettings(page);
    await expect(page.getByLabel('Texto del encabezado')).toHaveValue('QA-E2E encabezado');
    await expect(page.getByLabel('Texto del pie de página')).toHaveValue('QA-E2E pie');
    await expect(page.getByRole('checkbox', { name: 'Órdenes de compra' })).toBeChecked();
  });

  test('eliminar la firma la quita de la configuración', async ({ page }) => {
    await gotoPdfSettings(page);
    await clickHydrated(page.getByRole('button', { name: 'Eliminar firma' }));
    await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Firma eliminada').first()).toBeVisible();
    await expect(page.getByText('No hay firma cargada.')).toBeVisible();
  });

  // H-40: "Eliminar firma" solo pone en null la URL en la base; el objeto `pdf-signatures/<empresa>.png` sigue en el bucket logo.
  // Igual que producción (mismo código): no se cambia.
  test.fixme('eliminar la firma borra también el objeto del bucket (H-40)', async ({ page }) => {
    await expect.poll(() => objectInBucket(page, BUCKET, SIGNATURE_PATH), { timeout: 20_000 }).toBe(false);
  });
});
