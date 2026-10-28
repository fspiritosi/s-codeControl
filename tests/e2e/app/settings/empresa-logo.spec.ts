import { expect, test } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { TINY_PNG } from '../../helpers/employees';
import { STORAGE_PUBLIC_URL } from '../../helpers/equipment';
import { expectPublicUrlServes, objectInBucket, removeFromBucket } from '../../helpers/hse';
import { hydrated } from '../../helpers/ui';

/**
 * Logo de la empresa (bucket público `logo`). La empresa QA no se puede guardar desde "Editar Compañía" (el CUIT del seed no valida y
 * no tiene provincia, ver hallazgos), así que el guardado del formulario no se prueba: se comprueba la vista previa del formulario y
 * la misma operación de subida que hace el formulario (`/api/storage`, op `upload` al bucket `logo`) con un objeto de prueba que se borra.
 */
test.describe('configuración: logo de la empresa', () => {
  test.use({ actionTimeout: 15_000 });

  test('el formulario de edición muestra la vista previa del logo elegido, sin guardar', async ({ page }) => {
    await page.goto('/dashboard/company/actualCompany');
    await hydrated(page.getByRole('button', { name: 'Editar Compañía' }));
    await page.getByRole('button', { name: 'Editar Compañía' }).click();
    await expect(page.getByRole('textbox', { name: 'Nombre de la compañía' })).toHaveValue('QA E2E');
    await page.locator('#logo-input').setInputFiles({ name: 'logo-qa.png', mimeType: 'image/png', buffer: TINY_PNG });
    const preview = page.getByRole('img', { name: 'Logo', exact: true });
    await expect(preview).toBeVisible();
    await expect(preview).toHaveAttribute('src', /^data:image\/png;base64,/);
    await expect.poll(() => preview.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page).toHaveURL(/\/dashboard\/company\//);
  });

  test('subir un logo al bucket logo deja un objeto con URL pública 200 y se puede borrar', async ({ page }) => {
    await page.goto('/dashboard');
    const path = `${uniq('logo')}.png`;
    const res = await page.request.post('/api/storage', {
      multipart: {
        op: 'upload',
        bucket: 'logo',
        path,
        options: '{}',
        file: { name: path, mimeType: 'image/png', buffer: TINY_PNG },
      },
    });
    expect(res.ok()).toBe(true);
    try {
      await expect.poll(() => objectInBucket(page, 'logo', path), { timeout: 20_000 }).toBe(true);
      const url = `${STORAGE_PUBLIC_URL}/logo/${path}`;
      await expectPublicUrlServes(page, url, TINY_PNG);
      // La imagen carga en un navegador de verdad.
      await page.setContent(`<img id="i" src="${url}">`);
      await expect.poll(() => page.locator('#i').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    } finally {
      await removeFromBucket(page, 'logo', [path]);
    }
    await expect.poll(() => objectInBucket(page, 'logo', path), { timeout: 20_000 }).toBe(false);
  });
});
