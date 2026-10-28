import { expect, test } from '@playwright/test';

/**
 * Formularios: los tipos de checklist (`custom_form`) se cargan por base de datos (el alta por pantalla, `NewForm`, está comentada y
 * no tiene ruta) y la empresa QA E2E no tiene ninguno, así que solo se certifica que las pantallas cargan. Completar un checklist,
 * ver sus respuestas y eliminarlo quedan sin cubrir hasta que el seed de QA incluya un tipo de checklist (ver hallazgos H-32).
 */
test.describe('formularios: pantallas', () => {
  test.use({ actionTimeout: 15_000 });

  test('el listado de tipos de checklist carga y ofrece el reporte de vehículos', async ({ page }) => {
    await page.goto('/dashboard/forms');
    await expect(page.getByRole('tab', { name: 'Tipos de checklist' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generar Reporte de Vehículos' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Título' })).toBeVisible();
    await expect(page.getByText('Sin resultados')).toBeVisible();
  });

  test('la pantalla de completar formularios muestra sus cuatro aplicaciones', async ({ page }) => {
    await page.goto('/dashboard/forms/new');
    for (const name of ['Empleados', 'Vehículos', 'Empresa', 'Documentos']) {
      await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
    }
  });
});
