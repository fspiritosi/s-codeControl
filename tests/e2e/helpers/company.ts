import { expect, type Locator, type Page } from '@playwright/test';
import { PREFIX } from './env';

export const COMPANY_URL = '/dashboard/company/actualCompany';

const TAB_PARAM: Record<string, string> = {
  General: 'general',
  'Documentación': 'documentacion',
  Usuarios: 'users',
  Clientes: 'customers',
  Contactos: 'contacts',
  Convenios: 'covenant',
  Servicios: 'service',
  'Portal de Empleados': 'portal_employee',
};

/**
 * Abre el detalle de la empresa activa en una pestaña. Por defecto se navega con `?tab=` (la pestaña la fija el
 * servidor y no se "resetea" a General cuando termina de cargar el store). Con `soft: true` se entra por General y se
 * hace clic en la pestaña: es el camino que usa una persona y el único donde los formularios de Convenios toman la
 * empresa activa (tras una recarga completa quedan con empresa vacía, H-05).
 */
export async function gotoCompanyTab(page: Page, tab: string, opts: { soft?: boolean } = {}) {
  const trigger = page.getByRole('tab', { name: tab, exact: true });
  if (opts.soft) {
    await page.goto(COMPANY_URL);
    await expect(async () => {
      if ((await trigger.getAttribute('aria-selected')) !== 'true') await trigger.click({ timeout: 3_000 });
      await expect(trigger).toHaveAttribute('aria-selected', 'true', { timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
  } else {
    await page.goto(`${COMPANY_URL}?tab=${TAB_PARAM[tab]}`);
    await expect(trigger).toHaveAttribute('aria-selected', 'true');
  }
  const panel = page.getByRole('tabpanel', { name: tab });
  await expect(panel).toBeVisible();
  return panel;
}

/** Nombres fijos de la jerarquía de convenios de la empresa QA (no se puede borrar desde la UI: se reutiliza). */
export const TREE = {
  guild: `${PREFIX}Sindicato`,
  covenant: `${PREFIX}Convenio`,
  category: `${PREFIX}Categoria`,
} as const;

const treeRow = (panel: Locator, name: string) => panel.locator('div.flex.items-center.p-1').filter({ hasText: name });

/**
 * Despliega el árbol hasta mostrar el último nombre de la lista. El árbol vuelve a pintarse colapsado cada vez que se
 * crea algo (router.refresh), así que se abre nivel por nivel mirando si ya se ve el siguiente.
 */
async function reveal(page: Page, panel: Locator, path: string[]) {
  const tab = page.getByRole('tab', { name: 'Convenios', exact: true });
  await expect(async () => {
    // Tras crear algo la página a veces vuelve sola a la pestaña General: se reselecciona.
    if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click({ timeout: 3_000 });
    for (let i = 0; i < path.length - 1; i += 1) {
      const next = panel.getByText(path[i + 1], { exact: true });
      if (await next.isVisible()) continue;
      await panel.getByText(path[i], { exact: true }).click({ timeout: 3_000 });
      await expect(next).toBeVisible({ timeout: 2_000 });
    }
  }).toPass({ timeout: 20_000 });
}

/**
 * Garantiza que existan Sindicato > Convenio > Categoría de prueba (idempotente: crea solo lo que falta).
 * La UI no permite borrar ni dar de baja estos elementos desde el árbol, por eso tienen nombre fijo y se reutilizan.
 */
export async function ensureCovenantTree(page: Page) {
  const panel = await gotoCompanyTab(page, 'Convenios', { soft: true });
  const toast = (text: string) => page.getByText(text).first();
  const root = 'Sindicatos';
  const exists = async (name: string) => panel.getByText(name, { exact: true }).isVisible();

  await expect(panel.getByText(root, { exact: true })).toBeVisible();
  await panel.getByText(root, { exact: true }).click();
  if (!(await exists(TREE.guild))) {
    await panel.getByRole('button', { name: 'Nuevo sindicato' }).click();
    await page.getByPlaceholder('Nombre del sindicato').fill(TREE.guild);
    await page.getByRole('button', { name: 'Crear sindicato' }).click();
    await expect(toast('Sindicato creado exitosamente')).toBeVisible();
  }

  await reveal(page, panel, [root, TREE.guild]);
  await panel.getByText(TREE.guild, { exact: true }).click();
  if (!(await exists(TREE.covenant))) {
    await treeRow(panel, TREE.guild).first().getByRole('button', { name: 'Nuevo convenio' }).click();
    await page.getByPlaceholder('Nombre del convenio').fill(TREE.covenant);
    await page.getByRole('button', { name: 'Crear convenio' }).click();
    await expect(toast('Convenio creado exitosamente')).toBeVisible();
  }

  await reveal(page, panel, [root, TREE.guild, TREE.covenant]);
  await panel.getByText(TREE.covenant, { exact: true }).click();
  if (!(await exists(TREE.category))) {
    await treeRow(panel, TREE.covenant).first().getByRole('button', { name: 'Nueva categoria' }).click();
    await page.getByPlaceholder('Nombre de la categoria').fill(TREE.category);
    await page.getByRole('button', { name: 'Crear categoria' }).click();
    await expect(toast('Categoria creada exitosamente')).toBeVisible();
  }
  await reveal(page, panel, [root, TREE.guild, TREE.covenant, TREE.category]);
}

/** Da de baja a un cliente de la pestaña Clientes (la UI no permite borrarlos). Si ya está de baja o no existe, no hace nada. */
export async function deactivateCustomerIfActive(page: Page, name: string, reason = 'Limpieza E2E') {
  const panel = await gotoCompanyTab(page, 'Clientes');
  const row = panel.getByRole('row').filter({ hasText: name });
  if (!(await row.first().isVisible({ timeout: 5_000 }).catch(() => false))) return;
  await row.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('menuitem', { name: 'Dar de baja Cliente' }).click();
  const dialog = page.getByRole('dialog').filter({ hasText: 'Dar de baja Cliente' });
  await dialog.getByPlaceholder('Escribe el motivo').fill(reason);
  await dialog.getByRole('button', { name: /Fecha de Baja/i }).click();
  await page.getByRole('button', { name: /^Today,/ }).click();
  await dialog.getByRole('button', { name: 'Dar de Baja' }).click();
  await expect(page.getByText('Cliente eliminado').first()).toBeVisible();
}
