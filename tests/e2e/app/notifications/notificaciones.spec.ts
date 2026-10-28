import { expect, test } from '@playwright/test';
import { hydrated } from '../../helpers/ui';

/**
 * Notificaciones: la empresa QA tiene un solo usuario y las notificaciones nunca se envían a quien dispara el evento, así que no hay forma de
 * generarlas desde la interfaz (el cron no se dispara). Se comprueba el listado vacío, las pestañas y los botones; "marcar como leída" queda sin
 * cubrir por falta de datos.
 */
test.describe('notificaciones', () => {
  test.use({ actionTimeout: 15_000 });

  test('el listado carga vacío con sus contadores y botones deshabilitados', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await expect(page.getByRole('heading', { name: 'Notificaciones' })).toBeVisible();
    await expect(page.getByText('0 en total · 0 sin leer')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Marcar todas como leídas' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Limpiar todas' })).toBeDisabled();
    await expect(page.getByText('No hay notificaciones.')).toBeVisible();
  });

  test('la pestaña "Sin leer" también está vacía', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    const unread = page.getByRole('tab', { name: 'Sin leer (0)' });
    await hydrated(unread);
    await unread.click();
    await expect(unread).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toContainText('No tenés notificaciones sin leer.');
  });

  test('la campana del encabezado abre el panel de notificaciones sin errores', async ({ page }) => {
    await page.goto('/dashboard');
    const bell = page.getByRole('button', { name: 'Notificaciones' });
    await hydrated(bell);
    await bell.click();
    await expect(page.getByText('No tenés notificaciones.')).toBeVisible();
  });
});
