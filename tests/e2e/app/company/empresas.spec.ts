import { expect, test } from '@playwright/test';

/**
 * Listado de compañías, grupos compartidos y alta de empresa.
 * Regla de la suite: ningún test hace clic en una tarjeta de compañía ni en el selector de empresa (eso cambia la
 * cookie `actualComp` y las escrituras siguientes irían a una empresa real) y no se crea ninguna empresa.
 */
test.describe('empresas: listado, grupos y alta', () => {
  test.use({ actionTimeout: 15_000 });

  test('el listado de compañías tiene las pestañas Compañías y Grupos compartidos', async ({ page }) => {
    await page.goto('/dashboard/company');
    await expect(page.getByRole('tab', { name: 'Compañías' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Grupos compartidos' })).toBeVisible();
    await expect(page.getByText('Todas las Compañías', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'QA E2E', level: 3 })).toBeVisible();
  });

  // H-03: /dashboard/company lista TODAS las compañías de la base (fetchAllCompaniesWithRelations no filtra por dueño ni
  // por accesos compartidos) y los grupos compartidos muestran nombres y CUIT de empresas ajenas.
  test.fixme('el listado solo muestra las compañías del usuario', async ({ page }) => {
    await page.goto('/dashboard/company');
    await expect(page.getByRole('heading', { name: 'QA E2E', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(1);
  });

  test('la pestaña Grupos compartidos muestra las acciones de grupos', async ({ page }) => {
    await page.goto('/dashboard/company?tab=groups');
    await expect(page.getByRole('heading', { name: 'Grupos compartidos', level: 1 })).toBeVisible();
    await expect(page.getByText('Las empresas dentro del mismo grupo comparten almacenes, productos y stock.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Asignar empresa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nuevo grupo' })).toBeVisible();
  });

  test('el formulario de nueva compañía exige los datos obligatorios', async ({ page }) => {
    await page.goto('/dashboard/company/new');
    await expect(page.getByRole('textbox', { name: 'Nombre de la compañía' })).toBeVisible();
    await page.getByRole('button', { name: 'Registrar Compañía' }).click();
    await expect(page.getByText(/al menos 2 caracteres|es requerid/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/company\/new/);
  });

  test('el CUIT de la nueva compañía se valida', async ({ page }) => {
    await page.goto('/dashboard/company/new');
    await page.getByRole('textbox', { name: 'CUIT de la compañía' }).fill('123');
    await page.getByRole('button', { name: 'Registrar Compañía' }).click();
    await expect(page.getByText(/CUIT/).first()).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/company\/new/);
  });
});
