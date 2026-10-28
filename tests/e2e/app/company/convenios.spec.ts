import { expect, test } from '@playwright/test';
import { ensureCovenantTree, gotoCompanyTab, TREE } from '../../helpers/company';

/**
 * Sindicatos > Convenios > Categorías. El árbol no ofrece borrar ni dar de baja: la jerarquía de prueba tiene nombres
 * fijos (`TREE`) y se reutiliza entre corridas. Es lo único que estos tests dejan en la base.
 */
test.describe('empresa: convenios colectivos', () => {
  test.describe.configure({ mode: 'serial', timeout: 90_000 });
  test.use({ actionTimeout: 15_000 });

  test('la pestaña Convenios muestra el árbol de sindicatos', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Convenios');
    await expect(panel.getByText('Convenios colectivos de trabajo').first()).toBeVisible();
    await expect(panel.getByText('Sindicatos', { exact: true })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Nuevo sindicato' })).toBeVisible();
  });

  test('se crean sindicato, convenio y categoría y quedan anidados en el árbol', async ({ page }) => {
    await ensureCovenantTree(page);
    const panel = page.getByRole('tabpanel', { name: 'Convenios' });
    await expect(panel.getByText(TREE.guild, { exact: true })).toBeVisible();
    await expect(panel.getByText(TREE.covenant, { exact: true })).toBeVisible();
    await expect(panel.getByText(TREE.category, { exact: true })).toBeVisible();
  });

  test('crear la jerarquía dos veces no la duplica (la preparación es idempotente)', async ({ page }) => {
    await ensureCovenantTree(page);
    const panel = page.getByRole('tabpanel', { name: 'Convenios' });
    await expect(panel.getByText(TREE.guild, { exact: true })).toHaveCount(1);
  });

  test('el nombre del sindicato exige al menos 2 caracteres', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Convenios', { soft: true });
    await expect(async () => {
      if (!(await page.getByPlaceholder('Nombre del sindicato').isVisible())) {
        await panel.getByRole('button', { name: 'Nuevo sindicato' }).click({ timeout: 3_000 });
      }
      await page.getByPlaceholder('Nombre del sindicato').fill('A', { timeout: 3_000 });
      await page.getByRole('button', { name: 'Crear sindicato' }).click({ timeout: 3_000 });
      await expect(page.getByText('El nombre de la Asosiacion Gremial debe tener al menos 2 caracteres')).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 25_000 });
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByPlaceholder('Nombre del sindicato')).toHaveCount(0);
  });

  test('los sindicatos creados aparecen en el alta de empleados', async ({ page }) => {
    await page.goto('/dashboard/employee/action?action=new');
    await page.getByRole('tab', { name: 'Datos Laborales' }).click();
    await page.getByRole('combobox', { name: 'Sindicato' }).click();
    await expect(page.getByRole('option', { name: TREE.guild })).toBeVisible();
    await page.getByRole('option', { name: TREE.guild }).click();
    await expect(page.getByRole('combobox', { name: 'Convenio' })).toBeEnabled();
    await page.getByRole('combobox', { name: 'Convenio' }).click();
    await expect(page.getByRole('option', { name: TREE.covenant })).toBeVisible();
    await page.getByRole('option', { name: TREE.covenant }).click();
    await expect(page.getByRole('combobox', { name: 'Categoria' })).toBeEnabled();
    await page.getByRole('combobox', { name: 'Categoria' }).click();
    await expect(page.getByRole('option', { name: TREE.category })).toBeVisible();
  });

  // H-05: al abrir la pestaña con una recarga completa (?tab=covenant) los formularios de sindicato y convenio toman la
  // empresa activa vacía y fallan con "Ocurrio un error al crear el sindicato". Corregido en AddGuildModal y
  // AddCovenantModal; pendiente de deploy para quitar el fixme.
  test.fixme('crear un sindicato tras recargar la pestaña (?tab=covenant)', async ({ page }) => {
    const name = `${TREE.guild}-recarga`;
    await page.goto('/dashboard/company/actualCompany?tab=covenant');
    await page.getByRole('button', { name: 'Nuevo sindicato' }).click();
    await page.getByPlaceholder('Nombre del sindicato').fill(name);
    await page.getByRole('button', { name: 'Crear sindicato' }).click();
    await expect(page.getByText('Sindicato creado exitosamente')).toBeVisible();
  });
});
