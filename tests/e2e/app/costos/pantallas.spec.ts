import { expect, test } from '@playwright/test';
import { COSTOS_URL, hydrated } from '../../helpers/costos';

/**
 * Costos: tablero principal y topes imponibles.
 * Los topes imponibles son una tabla GLOBAL (sin empresa) y `crearTope` no valida permisos (H-42): un tope creado por la prueba afectaría a
 * todas las empresas y no hay forma de borrarlo, por eso solo se comprueba que la pantalla carga.
 */
test.describe('costos: tablero y topes imponibles', () => {
  test.use({ actionTimeout: 15_000 });

  test('el tablero muestra los accesos a cada pantalla de costos', async ({ page }) => {
    await page.goto(COSTOS_URL);
    await expect(page.getByRole('heading', { name: 'Gestión de Costos' })).toBeVisible();
    const links: Record<string, string> = {
      'CCTs configurados': '/dashboard/costos/configuracion-cct',
      'Conceptos de costo': '/dashboard/costos/conceptos',
      'Tipos de equipo': '/dashboard/costos/tipos-equipo',
      'Equipos con costo': '/dashboard/costos/equipos',
      Combustible: '/dashboard/costos/combustible',
      Servicios: '/dashboard/costos/servicios',
      Composiciones: '/dashboard/costos/composicion',
      'Fórmula polinómica': '/dashboard/costos/formula-polinomica',
    };
    for (const [name, href] of Object.entries(links)) {
      await expect(page.getByRole('link', { name: new RegExp(`^${name}`) })).toHaveAttribute('href', href);
    }
  });

  test('los topes imponibles cargan con su formulario de alta cerrado', async ({ page }) => {
    await page.goto(`${COSTOS_URL}/topes-imponibles`);
    await expect(page.getByRole('heading', { name: 'Topes Imponibles' })).toBeVisible();
    await hydrated(page.getByRole('button', { name: 'Nuevo tope' }));
    await page.getByRole('button', { name: 'Nuevo tope' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nuevo tope imponible' });
    await expect(dialog.getByPlaceholder('jubilatorio_max')).toBeVisible();
    // Se cierra sin guardar.
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
  });
});
