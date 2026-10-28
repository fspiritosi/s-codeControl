import { expect, test, type Page } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { cleanupEmployees, createEmployeeViaUi, newEmployeeData } from '../../helpers/employees';
import { clickHydrated, hydrated } from '../../helpers/ui';

const TYPES_URL = '/dashboard/employee?tab=types';
const DOCS_URL = '/dashboard/employee?tab=documents';

const typeRow = (page: Page, name: string) =>
  page.getByRole('tabpanel', { name: 'Tipos de documentos' }).getByRole('row').filter({ hasText: name });

async function openTypeMenu(page: Page, name: string, item: string) {
  const menuItem = page.getByRole('menuitem', { name: item });
  await expect(async () => {
    if (!(await menuItem.isVisible())) await typeRow(page, name).getByRole('button', { name: 'Abrir menú' }).click({ timeout: 3_000 });
    await expect(menuItem).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await menuItem.click();
}

/**
 * Documentos del legajo (RustFS vía /api/storage): tipo de documento de persona, carga, descarga y listado.
 * Los tipos "obligatorios" no se pueden crear en el clon (H-09), por eso se usa un tipo opcional.
 */
test.describe('empleados: documentos del legajo', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.use({ actionTimeout: 15_000 });

  const docType = uniq('Doc');
  const emp = newEmployeeData('docs');
  let typeCreated = false;

  test.afterAll(async ({ browser, baseURL }) => {
    await cleanupEmployees(browser, baseURL, [emp.lastname]);
    // El tipo de documento se desactiva al final: con documentos cargados la app no deja eliminarlo.
    if (!typeCreated) return;
    const context = await browser.newContext({ baseURL, storageState: 'tests/e2e/.auth/user.json', locale: 'es-AR' });
    const page = await context.newPage();
    try {
      await page.goto(TYPES_URL);
      await hydrated(page.getByRole('button', { name: 'Crear nuevo' }));
      if (await typeRow(page, docType).isVisible()) {
        await openTypeMenu(page, docType, 'Desactivar');
        const confirm = page.getByRole('alertdialog').getByRole('button', { name: /Desactivar|Confirmar|Continuar|Aceptar/ });
        if (await confirm.isVisible({ timeout: 2_000 }).catch(() => false)) await confirm.click();
      }
    } finally {
      await context.close();
    }
  });

  test('crear un tipo de documento de persona lo deja activo en la tabla', async ({ page }) => {
    await page.goto(TYPES_URL);
    await clickHydrated(page.getByRole('button', { name: 'Crear nuevo' }));
    const dialog = page.getByRole('dialog', { name: 'Nuevo Tipo de Documento' });
    await expect(dialog.getByRole('combobox')).toBeDisabled();
    await dialog.getByRole('textbox', { name: 'Nombre *' }).fill(docType);
    await dialog.getByRole('textbox', { name: 'Descripción' }).fill('Documento de prueba E2E');
    await dialog.getByRole('button', { name: 'Crear', exact: true }).click();
    typeCreated = true;
    await expect(page.getByText('Tipo de documento creado').first()).toBeVisible();
    const row = typeRow(page, docType);
    await expect(row).toContainText('Persona');
    await expect(row).toContainText('Activo');
  });

  test('el tipo de documento exige un nombre', async ({ page }) => {
    await page.goto(TYPES_URL);
    await clickHydrated(page.getByRole('button', { name: 'Crear nuevo' }));
    const dialog = page.getByRole('dialog', { name: 'Nuevo Tipo de Documento' });
    await dialog.getByRole('button', { name: 'Crear', exact: true }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/nombre|requerid|al menos/i).first()).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toHaveCount(0);
  });

  // H-09 (corregido en la base del clon): crear un tipo "Obligatorio" fallaba con `schema "auth" does not exist`. Este alta
  // genera documentos pendientes para todos los empleados de la empresa: el tipo se desactiva siempre al terminar (eliminarlo no es posible).
  test('crear un tipo de documento obligatorio', async ({ page }) => {
    const obligatorio = uniq('DocObligatorio');
    try {
      await page.goto(TYPES_URL);
      await clickHydrated(page.getByRole('button', { name: 'Crear nuevo' }));
      const dialog = page.getByRole('dialog', { name: 'Nuevo Tipo de Documento' });
      await dialog.getByRole('textbox', { name: 'Nombre *' }).fill(obligatorio);
      await dialog.getByRole('checkbox', { name: 'Obligatorio' }).check();
      await dialog.getByRole('button', { name: 'Crear', exact: true }).click();
      await expect(page.getByText('Tipo de documento creado').first()).toBeVisible();
      await expect(typeRow(page, obligatorio)).toContainText('Persona');
    } finally {
      await page.goto(TYPES_URL);
      await hydrated(page.getByRole('button', { name: 'Crear nuevo' }));
      if (await typeRow(page, obligatorio).isVisible({ timeout: 3_000 }).catch(() => false)) {
        // Al crearse, el tipo obligatorio genera documentos pendientes: ya no se puede eliminar, solo desactivar.
        await openTypeMenu(page, obligatorio, 'Desactivar');
        await expect(typeRow(page, obligatorio)).toHaveCount(0);
      }
    }
  });

  test('un tipo de documento sin documentos asociados se puede eliminar', async ({ page }) => {
    const efimero = uniq('DocBorrar');
    await page.goto(TYPES_URL);
    await clickHydrated(page.getByRole('button', { name: 'Crear nuevo' }));
    const dialog = page.getByRole('dialog', { name: 'Nuevo Tipo de Documento' });
    await dialog.getByRole('textbox', { name: 'Nombre *' }).fill(efimero);
    await dialog.getByRole('button', { name: 'Crear', exact: true }).click();
    await expect(typeRow(page, efimero)).toBeVisible();
    await openTypeMenu(page, efimero, 'Eliminar');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Tipo de documento eliminado').first()).toBeVisible();
    await expect(typeRow(page, efimero)).toHaveCount(0);
  });

  test('la pestaña Documentos de empleados tiene sus tres solapas y las cargas por tipo', async ({ page }) => {
    await page.goto(DOCS_URL);
    const panel = page.getByRole('tabpanel', { name: 'Documentos de empleados' });
    await expect(panel.getByRole('tab', { name: 'Documentos permanentes' })).toBeVisible();
    await expect(panel.getByRole('tab', { name: 'Documentos mensuales' })).toBeVisible();
    await expect(panel.getByRole('tab', { name: 'Documentos de baja' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Documento Multirecurso' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Documento No Multirecurso' })).toBeVisible();
  });

  test('preparación: se crea el empleado al que se le cargará el documento', async ({ page }) => {
    await createEmployeeViaUi(page, emp);
  });

  test('cargar un documento a un empleado lo deja como presentado en el listado', async ({ page }) => {
    await page.goto(DOCS_URL);
    await clickHydrated(page.getByRole('button', { name: 'Documento No Multirecurso' }));
    const dialog = page.getByRole('alertdialog', { name: 'Cargar documento' });
    await expect(dialog).toContainText('Desde aqui solo podras subir documentos faltantes');

    await dialog.getByRole('combobox', { name: 'Empleado' }).click();
    await page.getByRole('option', { name: new RegExp(emp.lastname) }).click();
    await page.keyboard.press('Escape'); // cierra la lista de empleados (queda abierto el diálogo)
    await dialog.getByRole('combobox', { name: 'Tipo de documento' }).click();
    await page.getByRole('option', { name: docType }).click();
    // Las listas de empleado y de tipo pueden quedar abiertas y tapar el botón de archivo: se cierran si siguen abiertas.
    for (const name of ['Tipo de documento', 'Empleado']) {
      const combo = dialog.getByRole('combobox', { name });
      if ((await combo.getAttribute('aria-expanded')) === 'true') await page.keyboard.press('Escape');
    }
    await expect(dialog.getByRole('combobox', { name: 'Tipo de documento' })).toHaveAttribute('aria-expanded', 'false');

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      dialog.getByRole('button', { name: 'Seleccionar archivo' }).click(),
    ]);
    await chooser.setFiles({ name: 'documento-qa.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nQA E2E\n%%EOF') });
    await dialog.getByRole('button', { name: 'Enviar' }).click();

    const panel = page.getByRole('tabpanel', { name: 'Documentos de empleados' });
    const row = panel.getByRole('row').filter({ hasText: emp.lastname }).filter({ hasText: docType });
    await expect(row).toBeVisible();
    await expect(row).toContainText('presentado');
    await expect(row).toContainText('No vence');
  });

  test('el menú del documento ofrece copiar DNI, ver historial y descargar', async ({ page }) => {
    await page.goto(DOCS_URL);
    const panel = page.getByRole('tabpanel', { name: 'Documentos de empleados' });
    const row = panel.getByRole('row').filter({ hasText: emp.lastname }).filter({ hasText: docType });
    await expect(row).toBeVisible();
    await expect(async () => {
      await row.getByRole('button', { name: 'Abrir menu' }).click({ timeout: 3_000 });
      await expect(page.getByRole('menuitem', { name: 'Descargar' })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    await expect(page.getByRole('menuitem', { name: 'Copiar DNI' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Ver historial' })).toBeVisible();
  });

  test('se puede descargar el documento cargado desde RustFS', async ({ page }) => {
    await page.goto(DOCS_URL);
    const panel = page.getByRole('tabpanel', { name: 'Documentos de empleados' });
    const row = panel.getByRole('row').filter({ hasText: emp.lastname }).filter({ hasText: docType });
    await expect(row).toBeVisible();
    await expect(async () => {
      await row.getByRole('button', { name: 'Abrir menu' }).click({ timeout: 3_000 });
      await expect(page.getByRole('menuitem', { name: 'Descargar' })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: 'Descargar' }).click()]);
    expect(download.suggestedFilename()).toBeTruthy();
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('el documento aparece en la pestaña Documentación del detalle del empleado', async ({ page }) => {
    await page.goto(`/dashboard/employee?lastname=${emp.lastname}`);
    await page.getByRole('link', { name: emp.fullName }).click();
    await page.getByRole('tab', { name: 'Documentación' }).click();
    const docs = page.getByRole('tabpanel', { name: 'Documentación' });
    await expect(docs.getByRole('tab', { name: 'Documentos permanentes' })).toBeVisible();
    await expect(docs.getByRole('tab', { name: 'Documentos mensuales' })).toBeVisible();
    await expect(docs.locator('tbody tr').filter({ hasText: docType })).toBeVisible();
  });
});
