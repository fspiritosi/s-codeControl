import { expect, test } from '@playwright/test';
import { hydrated } from '../../helpers/ui';

/**
 * Ayuda: solo se comprueba que la pantalla carga con su formulario. "Enviar reporte" crea un ticket en el servicio externo TASKAPP, que no está
 * configurado en el clon, así que no se prueba (ni se adjuntan archivos).
 */
test.describe('ayuda', () => {
  test.use({ actionTimeout: 15_000 });

  test('la pantalla de ayuda carga con los contadores y el formulario de reporte', async ({ page }) => {
    await page.goto('/dashboard/help');
    await hydrated(page.getByRole('button', { name: 'Enviar reporte' }));
    await expect(page.getByText('Reportar un problema')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Asunto' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Descripción' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Categoría' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Adjuntar archivo' })).toBeVisible();
    await expect(page.getByText('Mis tickets')).toBeVisible();
  });
});
