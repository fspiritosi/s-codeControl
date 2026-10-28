import { expect, test, type Page } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { openRowMenu } from '../../helpers/purchasing';
import { SALES_URL, createSalesInvoiceViaUi, ensureFixedCustomer, ensureFixedPointOfSale, expectPdfBody } from '../../helpers/sales';
import { clickHydrated } from '../../helpers/ui';

/**
 * Ventas > Facturas: ciclo de vida de una factura de venta (borrador, edición, confirmación, PDF, anulación) y eliminación de un
 * borrador. La app no llama a ARCA/AFIP: confirmar solo asigna la numeración interna del punto de venta, y el CAE es un campo de
 * texto opcional que acá no se completa. El PDF no se guarda en ningún bucket: se genera al pedirlo (`/api/sales/invoices/:id/pdf`).
 */
test.describe('ventas: facturas', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const line = uniq('linea-fv');
  let id = '';
  let fullNumber = '';
  const draftLine = uniq('linea-borrador');
  let draftId = '';
  const created: string[] = [];

  /** Anula la factura si quedó confirmada o elimina el borrador (limpieza si un paso falló). */
  test.afterAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      for (const invoiceId of created) await cleanupInvoice(page, invoiceId);
    } finally {
      await context.close();
    }
  });

  async function cleanupInvoice(page: Page, invoiceId: string) {
    await page.goto(`${SALES_URL}/invoices/${invoiceId}`);
    const del = page.getByRole('button', { name: 'Eliminar' });
    const cancel = page.getByRole('button', { name: 'Anular' });
    if (await del.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await del.click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
      await expect(page.getByText('Factura eliminada').first()).toBeVisible();
    } else if (await cancel.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await cancel.click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Anular' }).click();
      await expect(page.getByText('Factura anulada').first()).toBeVisible();
    }
  }

  test('alta de una factura en borrador la deja en el listado sin número', async ({ page }) => {
    await ensureFixedPointOfSale(page);
    await ensureFixedCustomer(page);
    id = await createSalesInvoiceViaUi(page, line, 1000);
    created.push(id);
    await expect(page.getByText('Borrador').first()).toBeVisible();
    await expect(page.getByText('Factura A').first()).toBeVisible();
    await expect(page.getByText('QA-E2E-Cliente-Ventas').first()).toBeVisible();
    await expect(page.getByText('Total: $1210.00')).toBeVisible();
  });

  test('editar el borrador cambia el importe del detalle', async ({ page }) => {
    await page.goto(`${SALES_URL}/invoices/${id}/edit`);
    const row = page.getByRole('row').nth(1);
    await expect(row.getByRole('textbox')).toHaveValue(line);
    await row.getByRole('spinbutton').nth(1).fill('2000');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Factura actualizada').first()).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/dashboard/sales/invoices/${id}$`));
    await expect(page.getByText('Total: $2420.00')).toBeVisible();
  });

  test('confirmar asigna el número del punto de venta y el PDF se genera', async ({ page }) => {
    await page.goto(`${SALES_URL}/invoices/${id}`);
    await clickHydrated(page.getByRole('button', { name: 'Confirmar' }));
    await expect(page.getByText('Factura confirmada').first()).toBeVisible();
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText(/^09901-\d{8}$/);
    fullNumber = (await heading.textContent())!;
    await expect(page.getByText('Confirmada', { exact: true })).toBeVisible();

    const pdf = await page.request.get(`/api/sales/invoices/${id}/pdf`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()['content-type']).toBe('application/pdf');
    expectPdfBody(await pdf.body());
    expect(pdf.headers()['content-disposition']).toContain('.pdf');
  });

  test('la factura confirmada aparece en el listado con su número y en la cuenta corriente del cliente', async ({ page }) => {
    await page.goto(`${SALES_URL}/invoices`);
    const row = page.getByRole('row').filter({ hasText: fullNumber });
    await expect(row).toContainText('Factura A');
    await expect(row).toContainText('Confirmada');

    await page.goto(`${SALES_URL}/account-statement`);
    await clickHydrated(page.getByRole('row').filter({ hasText: 'QA-E2E-Cliente-Ventas' }).getByRole('link', { name: 'Estado de cuenta' }));
    await expect(page.getByRole('row').filter({ hasText: fullNumber })).toBeVisible();
  });

  test('anular la factura confirmada la deja anulada', async ({ page }) => {
    await page.goto(`${SALES_URL}/invoices`);
    const row = page.getByRole('row').filter({ hasText: fullNumber });
    const menu = await openRowMenu(page, row);
    await menu.getByRole('menuitem', { name: 'Anular' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Anular' }).click();
    await expect(page.getByText('Factura anulada').first()).toBeVisible();
    // El menú de la fila queda abierto detrás del diálogo y oculta la tabla al lector de accesibilidad: se recarga el listado.
    await page.goto(`${SALES_URL}/invoices`);
    await expect(row).toContainText('Anulada');
  });

  test('un borrador se elimina desde el menú del listado', async ({ page }) => {
    draftId = await createSalesInvoiceViaUi(page, draftLine, 500);
    created.push(draftId);
    await page.goto(`${SALES_URL}/invoices`);
    // Los borradores no tienen número: la fila se ubica por el enlace "Ver detalle" de su menú.
    const rows = page.getByRole('row').filter({ hasText: 'Borrador' });
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    let deleted = false;
    for (let i = 0; i < count && !deleted; i++) {
      const menu = await openRowMenu(page, rows.nth(i));
      const href = await menu.getByRole('menuitem', { name: 'Ver detalle' }).getAttribute('href');
      if (href?.endsWith(draftId)) {
        await menu.getByRole('menuitem', { name: 'Eliminar' }).click();
        await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
        await expect(page.getByText('Factura eliminada').first()).toBeVisible();
        deleted = true;
      } else {
        await page.keyboard.press('Escape');
      }
    }
    expect(deleted).toBe(true);
    await page.goto(`${SALES_URL}/invoices/${draftId}`);
    await expect(page.getByRole('heading', { name: 'Pagina no encontrada' })).toBeVisible();
  });
});
