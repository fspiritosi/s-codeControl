import { expect, test } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { clickHydrated, hydrated } from '../../helpers/ui';

/**
 * Configuración: parámetros de empleados (puestos jerárquicos), impuestos (retenciones), tipo de cambio y la pestaña de IA.
 * Se crea todo con prefijo QA-E2E-; el tipo de retención y la cotización se eliminan, el puesto se deshabilita (la app no lo borra).
 * La retención fija de Tesorería (`QA_E2E_RET`) no se toca. La IA es una configuración global: solo se comprueba el formulario, sin guardar.
 */
test.describe('configuración: parámetros, impuestos y cálculos', () => {
  test.use({ actionTimeout: 15_000 });

  test('crear un puesto jerárquico, editarlo y deshabilitarlo', async ({ page }) => {
    const name = uniq('Puesto');
    await page.goto('/dashboard/settings?section=employees');
    const panel = page.getByRole('tabpanel', { name: 'Puestos jerárquicos' });
    await clickHydrated(panel.getByRole('button', { name: 'Nuevo' }));
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('Nombre').fill(name);
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Puesto creado').first()).toBeVisible();
    const row = panel.getByRole('row').filter({ hasText: name });
    await expect(row).toContainText('Propio');
    await expect(row).toContainText('Activo');

    await row.getByRole('button', { name: 'Editar' }).click();
    await page.getByRole('dialog').getByPlaceholder('Nombre').fill(`${name}-ed`);
    await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Puesto actualizado').first()).toBeVisible();
    await expect(panel.getByRole('row').filter({ hasText: `${name}-ed` })).toBeVisible();

    await panel.getByRole('row').filter({ hasText: `${name}-ed` }).getByRole('button', { name: 'Deshabilitar' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText('Puesto deshabilitado').first()).toBeVisible();
    await expect(panel.getByRole('row').filter({ hasText: `${name}-ed` })).toContainText('Inactivo');
  });

  test('crear un tipo de retención, editarlo, desactivarlo y eliminarlo', async ({ page }) => {
    const code = `QA_E2E_${Date.now().toString(36).toUpperCase()}`;
    const name = uniq('Retencion');
    await page.goto('/dashboard/settings?section=taxes');
    const panel = page.getByRole('tabpanel', { name: 'Retenciones' });
    await clickHydrated(panel.getByRole('button', { name: 'Nuevo retención' }));
    const dialog = page.getByRole('dialog', { name: 'Nuevo tipo de impuesto' });
    await dialog.locator('#tt-code').fill(code);
    await dialog.locator('#tt-name').fill(name);
    await dialog.locator('#tt-rate').fill('3');
    await dialog.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByText('Tipo creado').first()).toBeVisible();
    const row = () => panel.getByRole('row').filter({ hasText: code });
    await expect(row()).toContainText(name);
    await expect(row()).toContainText('3%');

    await row().getByRole('button').nth(1).click();
    const edit = page.getByRole('dialog', { name: 'Editar tipo' });
    await edit.locator('#tt-rate').fill('4');
    await edit.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Tipo actualizado').first()).toBeVisible();
    await expect(row()).toContainText('4%');

    await row().getByRole('button', { name: 'Desactivar' }).click();
    await expect(row().getByRole('button', { name: 'Activar' })).toBeVisible();

    await row().getByRole('button').last().click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Tipo eliminado').first()).toBeVisible();
    await expect(row()).toHaveCount(0);
  });

  test('cargar una cotización del dólar, editarla y eliminarla', async ({ page }) => {
    const source = uniq('Fuente');
    await page.goto('/dashboard/settings?section=calculations');
    await clickHydrated(page.getByRole('button', { name: 'Nueva cotización' }));
    const dialog = page.getByRole('dialog', { name: 'Nueva cotización' });
    await dialog.locator('#er-valor').fill('1234.5');
    await dialog.locator('#er-fecha').fill('2026-01-15');
    await dialog.locator('#er-fuente').fill(source);
    await dialog.getByRole('button', { name: /Crear|Guardar/ }).click();
    await expect(page.getByText('Cotización creada').first()).toBeVisible();
    const row = () => page.getByRole('row').filter({ hasText: source });
    await expect(row()).toContainText(/1\.?234,5/);

    await row().getByRole('button').first().click();
    const edit = page.getByRole('dialog', { name: 'Editar cotización' });
    await edit.locator('#er-valor').fill('1300');
    await edit.getByRole('button', { name: /Crear|Guardar/ }).click();
    await expect(page.getByText('Cotización actualizada').first()).toBeVisible();
    await expect(row()).toContainText(/1\.?300/);

    await row().getByRole('button').last().click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Cotización eliminada').first()).toBeVisible();
    await expect(row()).toHaveCount(0);
  });

  test('la pestaña de IA muestra el formulario de proveedores sin guardar claves', async ({ page }) => {
    await page.goto('/dashboard/settings?section=ai');
    await hydrated(page.getByRole('button', { name: 'Guardar cambios' }));
    await expect(page.getByRole('heading', { name: 'Proveedores de IA' })).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: 'Proveedor de IA activo' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Google Gemini/ })).toBeVisible();
    await expect(page.getByRole('radio', { name: /OpenAI/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Probar conexión' })).toHaveCount(2);
  });
});
