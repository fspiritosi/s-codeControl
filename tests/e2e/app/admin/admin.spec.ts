import { expect, test } from '@playwright/test';
import { hydrated } from '../../helpers/ui';

/**
 * Pantallas de administrador de plataforma (`/admin`). El usuario QA es un cliente (rol CodeControlClient), no un administrador, y aun así entra:
 * el layout no valida el rol (H-44, igual que producción). Se prueba lo que muestra cada pantalla hoy y se deja en `fixme` lo que debería pasar.
 * No se usa ninguna acción de escritura (hay botones que crean usuarios y alteran catálogos globales).
 */
test.describe('admin de plataforma', () => {
  test.use({ actionTimeout: 15_000 });

  test('el panel carga para el usuario QA sin redirigir ni mostrar un error', async ({ page }) => {
    await page.goto('/admin/panel');
    await expect(page).toHaveURL(/\/admin\/panel$/);
    await expect(page.getByRole('link', { name: 'Auditor' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear Usuario' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Error en administracion' })).toHaveCount(0);
  });

  test('las tablas de catálogos cargan con los tipos de industria y de puesto', async ({ page }) => {
    await page.goto('/admin/tablas');
    await expect(page).toHaveURL(/\/admin\/tablas$/);
    await expect(page.getByText('Tipo de Industria')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Petroleo' }).first()).toBeVisible();
    await expect(page.getByText('Tipo de Puesto')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Error en administracion' })).toHaveCount(0);
  });

  // H-45: el auditor trae los documentos "presentados" de TODAS las empresas y la tabla se rompe con "RangeError: Invalid time value": la página
  // formatea la fecha como dd/MM/yyyy y la columna la vuelve a parsear como MM/dd/yyyy (falla con días mayores a 12). Igual que producción.
  test.fixme('el auditor muestra la tabla de documentos presentados', async ({ page }) => {
    await page.goto('/admin/auditor');
    await hydrated(page.getByText('Tipos de documentos'));
    await expect(page.getByRole('heading', { name: 'Error en administracion' })).toHaveCount(0);
  });

  test('el auditor hoy cae en la pantalla de error de administración sin romper la sesión (H-45)', async ({ page }) => {
    await page.goto('/admin/auditor');
    await expect(page).toHaveURL(/\/admin\/auditor$/);
    await expect(page.getByRole('heading', { name: 'Error en administracion' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
    // La sesión sigue viva: el dashboard abre normalmente.
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: 'Menú de usuario' })).toBeVisible();
  });

  // H-44: el layout de /admin no comprueba el rol del usuario. Un cliente debería ser redirigido (o ver "sin acceso"). Igual que producción.
  test.fixme('un usuario cliente no puede entrar al panel de administración', async ({ page }) => {
    await page.goto('/admin/panel');
    await expect(page).not.toHaveURL(/\/admin\/panel$/);
  });
});
