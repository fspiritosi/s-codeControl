import { expect, test } from '@playwright/test';
import { DOCS_URL, DOC_TYPES_URL } from '../../helpers/documents';

/** Pantallas de solo lectura del módulo Documentos (sin crear datos). */
test.describe('documentos: pantallas', () => {
  test.use({ actionTimeout: 15_000 });

  test('Documentos tiene sus cuatro pestañas y abre en empleados', async ({ page }) => {
    await page.goto(DOCS_URL);
    for (const name of ['Documentos de empleados', 'Documentos de equipos', 'Documentos de empresa', 'Tipos de documentos']) {
      await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('tab', { name: 'Documentos de empleados', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('button', { name: 'Auditar alertas de Empleados' })).toBeVisible();
  });

  test('Documentos de equipos muestra sus solapas, columnas y accesos de carga', async ({ page }) => {
    await page.goto(`${DOCS_URL}?tab=equipment`);
    const panel = page.getByRole('tabpanel', { name: 'Documentos de equipos' });
    await expect(panel.getByRole('tab', { name: 'Documentos permanentes' })).toBeVisible();
    await expect(panel.getByRole('tab', { name: 'Documentos mensuales' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Documento Multirecurso' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Documento No Multirecurso' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Auditar alertas de Equipos' })).toBeVisible();
    for (const column of ['Equipo (Dominio)', 'Nro. interno', 'Documento', 'Obligatorio', 'Estado', 'Vencimiento', 'Subido el']) {
      await expect(panel.getByRole('columnheader', { name: column })).toBeVisible();
    }
  });

  test('Documentos de empresa lista los documentos de la empresa', async ({ page }) => {
    await page.goto(`${DOCS_URL}?tab=company`);
    const panel = page.getByRole('tabpanel', { name: 'Documentos de empresa' });
    await expect(panel.getByRole('tab', { name: 'Documentos permanentes' })).toBeVisible();
    await expect(panel.getByRole('tab', { name: 'Documentos mensuales' })).toBeVisible();
    for (const column of ['Nombre del documento', 'Subido por', 'Rol', 'Subido el', 'Acceso', 'Vencimiento']) {
      await expect(panel.getByRole('columnheader', { name: column })).toBeVisible();
    }
  });

  test('Tipos de documentos se ve igual desde Documentos y desde Equipos', async ({ page }) => {
    await page.goto(DOC_TYPES_URL);
    await expect(page.getByRole('button', { name: 'Crear nuevo' })).toBeVisible();
    for (const column of ['Nombre', 'Aplica a', 'Obligatorio', 'Vencimiento', 'Mensual', 'Multi recurso', 'Activo']) {
      await expect(page.getByRole('columnheader', { name: column })).toBeVisible();
    }
    await page.goto('/dashboard/equipment?tab=types');
    await expect(page.getByRole('tabpanel', { name: 'Tipos de documentos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear nuevo' })).toBeVisible();
  });
});
