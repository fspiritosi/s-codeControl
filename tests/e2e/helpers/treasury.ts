import { expect, type Locator, type Page } from '@playwright/test';
import { uniq } from './env';
import { clickHydrated, hydrated } from './ui';

export const TREASURY_URL = '/dashboard/treasury';

export type TreasuryTab = 'cash-registers' | 'bank-accounts' | 'checks' | 'payment-orders' | 'retentions' | 'pending-balances';

/** Abre una pestaña de Tesorería (`?tab=`) y devuelve su panel. */
export async function gotoTreasuryTab(page: Page, tab: TreasuryTab): Promise<Locator> {
  await page.goto(`${TREASURY_URL}?tab=${tab}`);
  const panel = page.getByRole('tabpanel');
  await expect(panel).toBeVisible();
  return panel;
}

/** Código de caja único (la app lo guarda en mayúsculas). */
export const newCashCode = () => uniq('CAJA').toUpperCase();

/** Alta de una caja por el diálogo "Nueva caja". */
export async function createCashRegisterViaUi(page: Page, code: string, name: string, location = '') {
  const panel = await gotoTreasuryTab(page, 'cash-registers');
  await clickHydrated(panel.getByRole('button', { name: 'Nueva caja' }));
  const dialog = page.getByRole('dialog', { name: 'Nueva caja' });
  await dialog.getByPlaceholder('CAJA-01').fill(code);
  await dialog.getByPlaceholder('Caja principal').fill(name);
  if (location) await dialog.getByPlaceholder('Oficina central').fill(location);
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Caja creada').first()).toBeVisible();
  await expect(dialog).toBeHidden();
}

/** Abre el detalle de una caja desde el listado (enlace "Ver detalle"). Devuelve su id. */
export async function openCashRegisterDetail(page: Page, code: string): Promise<string> {
  const panel = await gotoTreasuryTab(page, 'cash-registers');
  const link = panel.getByRole('row').filter({ hasText: code }).getByRole('link', { name: 'Ver detalle' });
  await expect(link).toBeVisible();
  const id = (await link.getAttribute('href'))!.split('/').pop()!;
  await page.goto(`${TREASURY_URL}/cash-registers/${id}`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(code);
  return id;
}

/** Abre una sesión de la caja (desde su detalle) con el saldo inicial indicado. */
export async function openCashSession(page: Page, openingBalance: number) {
  await clickHydrated(page.getByRole('button', { name: 'Abrir sesión' }));
  const dialog = page.getByRole('dialog', { name: 'Abrir sesión de caja' });
  await dialog.getByRole('spinbutton').fill(String(openingBalance));
  await dialog.getByRole('button', { name: 'Abrir sesión' }).click();
  await expect(page.getByText('Sesión abierta').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nuevo movimiento' })).toBeVisible();
}

/** Cierra la sesión abierta de la caja contando el saldo esperado. */
export async function closeCashSession(page: Page) {
  await clickHydrated(page.getByRole('button', { name: 'Cerrar sesión' }));
  const dialog = page.getByRole('dialog', { name: 'Cerrar sesión de caja' });
  await dialog.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page.getByText('Sesión cerrada').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir sesión' })).toBeVisible();
}

/** Desactiva una caja desde el listado (limpieza). Si ya está inactiva o no existe, no hace nada. */
export async function deactivateCashRegisterIfActive(page: Page, code: string) {
  const panel = await gotoTreasuryTab(page, 'cash-registers');
  const row = panel.getByRole('row').filter({ hasText: code });
  if (!(await row.isVisible({ timeout: 4_000 }).catch(() => false))) return;
  const button = row.getByRole('button', { name: 'Desactivar' });
  if (!(await button.isVisible().catch(() => false))) return;
  await hydrated(button);
  await button.click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Caja desactivada').first()).toBeVisible();
}

/** Tipo de retención fijo de la suite (2 % sobre el total): una vez usado en una orden no se puede eliminar, así que se crea una vez y se reutiliza. */
export const FIXED_RETENTION = { code: 'QA_E2E_RET', name: 'QA-E2E-Retencion', rate: 2 };

/** Crea el tipo de retención fijo (Configuración > Impuestos > Retenciones) si todavía no existe, y lo deja activo. */
export async function ensureFixedRetentionType(page: Page) {
  await page.goto('/dashboard/settings?section=taxes');
  const panel = page.getByRole('tabpanel', { name: 'Retenciones' });
  await hydrated(panel.getByRole('button', { name: 'Nuevo retención' }));
  const row = panel.getByRole('row').filter({ hasText: FIXED_RETENTION.code });
  if (await row.isVisible({ timeout: 3_000 }).catch(() => false)) {
    if (await row.getByText('Inactivo').isVisible().catch(() => false)) {
      await row.getByRole('button', { name: 'Activar' }).click();
      await expect(row).toContainText('Activo');
    }
    return;
  }
  await panel.getByRole('button', { name: 'Nuevo retención' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nuevo tipo de impuesto' });
  await dialog.getByPlaceholder('RET_IIBB_NEU').fill(FIXED_RETENTION.code);
  await dialog.getByPlaceholder('Retención IIBB Neuquén').fill(FIXED_RETENTION.name);
  // Base de cálculo por defecto: neto. La orden de prueba usa un pago a cuenta (sin factura), así que se pone el total.
  await dialog.getByRole('combobox', { name: 'Base de cálculo' }).click();
  await page.getByRole('option', { name: 'Total' }).click();
  await dialog.getByLabel('Alícuota default (%)').fill(String(FIXED_RETENTION.rate));
  await dialog.getByRole('button', { name: /^(Crear|Guardar)/ }).click();
  await expect(page.getByText(/Tipo creado|Ya existe un tipo/).first()).toBeVisible();
}

/** Campo "Notas (opcional)" del formulario de la orden (el primer cuadro de texto que no es una fecha). */
export const orderNotes = (page: Page) => page.getByText('Notas (opcional)').locator('..').getByRole('textbox');

export type NewPaymentOrder = { supplier: string; amount: number; cashCode: string; notes: string; withRetention?: boolean };

/**
 * Alta de una orden de pago por el formulario: un "pago a cuenta" al proveedor (sin factura) pagado en efectivo desde una caja con
 * sesión abierta. Con `withRetention` se agrega la retención fija (2 %) y el pago se ajusta al neto. La app abre el detalle de la
 * orden al crearla; devuelve su id.
 */
export async function createPaymentOrderViaUi(page: Page, o: NewPaymentOrder): Promise<string> {
  await page.goto(`${TREASURY_URL}/payment-orders/new`);
  await hydrated(page.getByRole('button', { name: 'Crear orden' }));
  const supplier = page.getByRole('combobox').first();
  await clickHydrated(supplier);
  await page.getByRole('option', { name: new RegExp(o.supplier) }).first().click();
  await expect(supplier).toHaveAttribute('aria-expanded', 'false');
  await orderNotes(page).fill(o.notes);

  await page.getByRole('button', { name: 'Pago a cuenta' }).click();
  const itemRow = page.getByRole('row').filter({ hasText: 'Pago a cuenta' });
  await itemRow.getByRole('spinbutton').nth(1).fill(String(o.amount));

  let net = o.amount;
  if (o.withRetention) {
    await page.getByRole('button', { name: 'Agregar retención' }).click();
    const retRow = page.getByRole('row').filter({ has: page.getByRole('combobox') }).filter({ hasText: /Seleccionar/ });
    await retRow.getByRole('combobox').click();
    await page.getByRole('option', { name: FIXED_RETENTION.name }).click();
    net = Math.round(o.amount * (1 - FIXED_RETENTION.rate / 100) * 100) / 100;
  }

  const payment = page.locator('div.rounded-md.border.p-3').filter({ hasText: 'Pago #1' });
  await payment.getByRole('spinbutton').fill(String(net));
  await payment.getByRole('combobox').nth(1).click();
  await page.getByRole('option', { name: new RegExp(o.cashCode) }).click();
  await page.getByRole('button', { name: 'Crear orden' }).click();
  await expect(page.getByText('Orden de pago creada').first()).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/treasury\/payment-orders\/[0-9a-f-]{36}$/);
  return page.url().split('/').pop()!;
}
