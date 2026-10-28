import { expect, test } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { cleanupEquipment, createEquipmentViaUi, newEquipmentData } from '../../helpers/equipment';
import { cleanupDocTypes, createDocType, pdf, uploadEquipmentDoc } from '../../helpers/documents';
import { clickHydrated } from '../../helpers/ui';

/**
 * Calendario de vencimientos (/dashboard/calendario) y VTV (/dashboard/vtv). Un equipo con un documento de tipo VTV que
 * vence este mes alimenta las dos pantallas.
 */
test.describe('vencimientos: calendario y VTV', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000, viewport: { width: 1600, height: 900 } });

  const eq = newEquipmentData('Vtv');
  const type = uniq('DocVtv');

  test.afterAll(async ({ browser, baseURL }) => {
    await cleanupEquipment(browser, baseURL, [eq.intern]);
    await cleanupDocTypes(browser, baseURL, [type]);
  });

  test('preparación: tipo VTV con vencimiento, un equipo y su documento que vence este mes', async ({ page }) => {
    await createDocType(page, type, { appliesTo: 'Equipos', expires: true, vtv: true });
    await createEquipmentViaUi(page, eq);
    // La fecha elegida es el 15 del mes en curso: queda dentro del mes que muestra el calendario.
    await uploadEquipmentDoc(page, {
      equipment: new RegExp(eq.intern),
      type,
      file: pdf('vtv-qa'),
      expiryYear: new Date().getFullYear(),
    });
  });

  test('el calendario de vencimientos muestra el documento en su día', async ({ page }) => {
    await page.goto('/dashboard/calendario');
    await expect(page.getByRole('heading', { name: 'Calendario de vencimientos' })).toBeVisible();
    await expect(page.getByText(`${type} · Interno ${eq.intern}`)).toBeVisible();
    for (const legend of ['Vencido', '≤ 7 días', 'Por vencer', 'Mantenimiento']) {
      await expect(page.getByText(legend, { exact: true })).toBeVisible();
    }
  });

  test('el listado de VTV incluye el vehículo sin gestionar', async ({ page }) => {
    await page.goto('/dashboard/vtv');
    await expect(page.getByRole('heading', { name: 'VTV de la flota' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Listado' })).toHaveAttribute('aria-selected', 'true');
    const row = page.getByRole('row').filter({ hasText: eq.intern });
    await expect(row).toBeVisible();
    await expect(row).toContainText(type);
    await expect(row).toContainText('Sin gestionar');
  });

  test('agendar un turno de VTV y cancelarlo desde Gestionar', async ({ page }) => {
    await page.goto('/dashboard/vtv');
    await clickHydrated(page.getByRole('button', { name: 'Agendar turno' }));
    const dialog = page.getByRole('dialog', { name: 'Agendar turno de VTV' });
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: new RegExp(eq.intern) }).click();
    await dialog.getByRole('button', { name: 'Selecciona una fecha' }).click();
    await page.getByRole('button', { name: /^Today,/ }).click();
    if (await page.getByRole('grid').isVisible()) await page.keyboard.press('Escape');
    await dialog.getByRole('button', { name: 'Agendar turno' }).click();
    await expect(page.getByText('Turno agendado').first()).toBeVisible();

    const row = page.getByRole('row').filter({ hasText: eq.intern });
    await expect(row).toContainText('Incompleta');
    await row.getByRole('button', { name: 'Gestionar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar turno' }).click();
    await expect(page.getByText('Turno cancelado').first()).toBeVisible();
  });
});
