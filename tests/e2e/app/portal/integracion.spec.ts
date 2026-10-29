import { expect, test, type Page } from '@playwright/test';
import { uniq } from '../../helpers/env';
import { cleanupEmployees, createEmployeeViaUi, newEmployeeData } from '../../helpers/employees';
import { gotoCompanyTab } from '../../helpers/company';
import { HSE_DOC_TYPE, ensureHseDocType, gotoHseTab, pdfFile } from '../../helpers/hse';
import { clickHydrated } from '../../helpers/ui';

/**
 * Flujo cruzado portal de empleados ↔ CodeControl (ambas apps comparten base):
 * alta del empleado y publicación de un documento HSE en CodeControl → registro del empleado en el portal por su CUIL →
 * aprobación en CodeControl → el empleado ve el documento y lo acepta en el portal → CodeControl lo muestra aceptado.
 */
const PORTAL_URL = process.env.E2E_PORTAL_URL ?? 'https://portal-clon.31.97.42.82.sslip.io';
const PORTAL_PASSWORD = 'E2e-Portal#2026';

test.describe('portal ↔ CodeControl', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });
  test.use({ actionTimeout: 15_000 });

  const emp = newEmployeeData('Portal');
  const cuilDashed = `${emp.cuil.slice(0, 2)}-${emp.cuil.slice(2, 10)}-${emp.cuil.slice(10)}`;
  const email = `qa-portal-${Date.now().toString(36)}@codecontrol.test`;
  const docTitle = uniq('PortalDoc');
  let portal: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ baseURL: PORTAL_URL, locale: 'es-AR' });
    portal = await context.newPage();
  });
  test.afterAll(async ({ browser, baseURL }) => {
    await portal?.context().close();
    await cleanupEmployees(browser, baseURL, [emp.lastname]);
  });

  test('CodeControl: alta del empleado y documento HSE publicado para todos', async ({ page }) => {
    await createEmployeeViaUi(page, emp);
    await ensureHseDocType(page);
    const file = pdfFile('portal-doc');
    const panel = await gotoHseTab(page, 'Documentos');
    await clickHydrated(panel.getByRole('button', { name: 'Nuevo Documento' }));
    const dialog = page.getByRole('dialog', { name: 'Subir Nuevo Documento' });
    await dialog.getByRole('combobox').first().click();
    await page.getByRole('option', { name: HSE_DOC_TYPE }).click();
    await dialog.getByPlaceholder('Título del documento').fill(docTitle);
    await dialog.getByPlaceholder('Ej: 1.0').fill('1.0');
    await dialog.locator('input[type=file]').setInputFiles(file);
    await dialog.getByRole('button', { name: 'Subir Documento' }).click();
    await expect(page.getByText('Documento subido con éxito').first()).toBeVisible();
    const draft = await gotoHseTab(page, 'Documentos');
    const draftTab = draft.getByRole('tab', { name: /^Borradores/ });
    await expect(async () => {
      if ((await draftTab.getAttribute('aria-selected')) !== 'true') await draftTab.click({ timeout: 3_000 });
      await expect(draftTab).toHaveAttribute('aria-selected', 'true', { timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    const inner = draft.locator('div.transition-shadow').filter({ hasText: docTitle });
    await clickHydrated(inner.getByRole('button', { name: 'Publicar' }));
    await page.getByRole('alertdialog').getByRole('button', { name: 'Publicar' }).click();
    await expect(page.getByText('Documento publicado correctamente').first()).toBeVisible();
  });

  test('portal: el empleado se registra con su CUIL y confirma sus datos', async () => {
    await portal.goto('/');
    await portal.waitForLoadState('networkidle');
    await portal.getByRole('tab', { name: 'Crear Cuenta' }).click();
    await portal.getByPlaceholder('Tu nombre completo').fill(emp.fullName);
    await portal.getByPlaceholder('20-12345678-9').fill(cuilDashed);
    await portal.locator('#email-register').fill(email);
    await portal.locator('#password-register').fill(PORTAL_PASSWORD);
    await portal.locator('#password-confirm').fill(PORTAL_PASSWORD);
    await portal.getByRole('button', { name: /Crear Cuenta/ }).last().click();
    await expect(portal.getByText(/Cuenta creada exitosamente/).first()).toBeVisible();

    await portal.locator('#email-login').fill(email);
    await portal.locator('#password-login').fill(PORTAL_PASSWORD);
    await portal.getByRole('button', { name: 'Iniciar Sesión' }).last().click();
    await portal.waitForURL(/verify|dashboard/, { timeout: 20_000 });
    await expect(portal).toHaveURL(/verify/);
    await portal.getByRole('button', { name: /Confirm|Soy|Sí|Continuar/i }).first().click();
    await expect(portal.getByText(/pendiente|aprob/i).first()).toBeVisible();
  });

  test('CodeControl: la solicitud aparece en el portal y se aprueba', async ({ page }) => {
    const panel = await gotoCompanyTab(page, 'Portal de Empleados');
    const row = panel.getByRole('row').filter({ hasText: email });
    await expect(row).toBeVisible();
    await clickHydrated(row.getByRole('button', { name: 'Aprobar' }));
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Aprobar|Confirmar/ }).last().click();
    await expect(panel.getByRole('row').filter({ hasText: email }).getByRole('button', { name: 'Aprobar' })).toHaveCount(0);
  });

  test('portal: el empleado aprobado ve el documento y lo acepta con su contraseña', async () => {
    await portal.goto('/dashboard/my-documents');
    await expect(portal.getByText(docTitle).first()).toBeVisible({ timeout: 20_000 });
    await expect(portal.getByText('Pendiente', { exact: true }).first()).toBeVisible();
    await portal.waitForLoadState('networkidle');
    // Un empleado nuevo recibe también los documentos vigentes anteriores: se acepta el de esta corrida, no el primero de la lista.
    const card = portal.getByText(docTitle).first().locator('xpath=ancestor::div[.//button[normalize-space()="Aceptar"]][1]');
    await card.getByRole('button', { name: 'Aceptar' }).click();
    await portal.getByPlaceholder('Ingresa tu contraseña').fill(PORTAL_PASSWORD);
    await portal.getByRole('dialog').getByRole('button', { name: 'Aceptar' }).click();
    await expect(portal.getByText(docTitle).first().locator('xpath=ancestor::div[.//text()[contains(.,"Firmado/Aceptado")]][1]')).toBeVisible({ timeout: 15_000 });
  });

  test('CodeControl: el documento muestra al empleado con estado Aceptado', async ({ page }) => {
    const panel = await gotoHseTab(page, 'Documentos');
    await page.getByRole('tab', { name: /^Vigentes/ }).click();
    const card = panel.locator('div.transition-shadow').filter({ hasText: docTitle });
    await clickHydrated(card.getByRole('button', { name: 'Ver Detalle' }));
    await page.waitForURL(/\/dashboard\/hse\/document\/[^/]+\/detail$/);
    await expect(page.getByText(/^✓ 1$|Aceptados/).first()).toBeVisible({ timeout: 20_000 });
    await clickHydrated(page.getByRole('tab', { name: 'Empleados' }));
    const row = page.getByRole('row').filter({ hasText: emp.lastname });
    const next = page.getByRole('button', { name: 'Ir a pagina siguiente' });
    await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 20_000 });
    // La tabla pagina de a 10: se avanza hasta encontrar al empleado.
    while (!(await row.first().isVisible()) && (await next.isEnabled().catch(() => false))) await next.click();
    await expect(row).toContainText('Aceptado', { timeout: 20_000 });
  });
});
