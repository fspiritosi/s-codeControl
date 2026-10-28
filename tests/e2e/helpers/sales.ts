import { expect, type Page } from '@playwright/test';
import { cuilFor } from './employees';
import { pickSearchable, pickSelect } from './purchasing';
import { clickHydrated, hydrated } from './ui';

export const SALES_URL = '/dashboard/sales';
export const CUSTOMERS_URL = '/dashboard/commercial/customers';

/** Punto de venta fijo de la suite: no se puede eliminar una vez que emitió comprobantes (solo desactivar), así que se crea una vez y se reutiliza. */
export const FIXED_POS = { number: 9901, name: 'QA-E2E-PV-Fijo' };
/** Cliente fijo de la suite: la app solo da de baja clientes, así que se crea una vez y se reutiliza para facturas y recibos. */
export const FIXED_CUSTOMER = 'QA-E2E-Cliente-Ventas';
const FIXED_CUSTOMER_CUIT = cuilFor('99990011', '30');

/** PDF generado de verdad: empieza con la firma `%PDF-` y no es un archivo vacío. */
export function expectPdfBody(body: Buffer) {
  expect(body.subarray(0, 5).toString()).toBe('%PDF-');
  expect(body.length).toBeGreaterThan(1_000);
}

/** CUIT de empresa válido (prefijo 30) y único por corrida. */
export function uniqueCustomerCuit() {
  for (;;) {
    const cuit = cuilFor(String(99_000_000 + Math.floor(Math.random() * 999_999)), '30');
    if (cuit) return cuit;
  }
}

export type NewCustomer = { name: string; cuit: string; phone?: string; taxCondition?: string };

/** Alta de un cliente por el formulario del módulo Comercial; termina en el listado de clientes. */
export async function createCustomerViaUi(page: Page, c: NewCustomer, opts: { tolerateExisting?: boolean } = {}) {
  await page.goto(`${CUSTOMERS_URL}/action?action=new`);
  await hydrated(page.getByRole('button', { name: 'Crear cliente' }));
  await page.getByRole('textbox', { name: 'Nombre del cliente' }).fill(c.name);
  await page.getByPlaceholder('30123456789').fill(c.cuit);
  if (c.taxCondition) await pickSelect(page, page.getByRole('combobox').first(), c.taxCondition);
  await page.getByPlaceholder('cliente@correo.com').fill('cliente-ventas@codecontrol.test');
  await page.getByPlaceholder('1155551234').fill(c.phone ?? '1144440000');
  await page.getByPlaceholder('Calle y número').fill('Calle Ventas 123');
  await page.getByRole('button', { name: 'Crear cliente' }).click();
  // Con `tolerateExisting` (cliente fijo) otro worker pudo crearlo a la vez: la app avisa que ya existe y se sigue.
  await expect(page.getByText(opts.tolerateExisting ? /Cliente creado|El cliente ya existe/ : 'Cliente creado').first()).toBeVisible();
  if (!opts.tolerateExisting) await expect(page).toHaveURL(/\/dashboard\/commercial\/customers$/);
}

/** Crea el cliente fijo (Responsable Inscripto) si todavía no existe en el listado de clientes. */
export async function ensureFixedCustomer(page: Page) {
  await page.goto(CUSTOMERS_URL);
  await expect(page.getByRole('table')).toBeVisible();
  if (await page.getByRole('row').filter({ hasText: FIXED_CUSTOMER }).first().isVisible({ timeout: 3_000 }).catch(() => false)) return;
  await createCustomerViaUi(page, { name: FIXED_CUSTOMER, cuit: FIXED_CUSTOMER_CUIT, taxCondition: 'Responsable Inscripto' }, { tolerateExisting: true });
}

/** Alta de un punto de venta por el diálogo "Nuevo punto de venta". */
export async function createPointOfSaleViaUi(page: Page, pos: { number: number; name: string }) {
  await page.goto(`${SALES_URL}/points-of-sale`);
  await clickHydrated(page.getByRole('button', { name: 'Nuevo punto de venta' }));
  const dialog = page.getByRole('dialog', { name: 'Nuevo punto de venta' });
  await dialog.getByRole('spinbutton', { name: 'Número *' }).fill(String(pos.number));
  await dialog.getByRole('textbox', { name: 'Nombre *' }).fill(pos.name);
  await dialog.getByRole('button', { name: 'Crear' }).click();
}

/** Crea el punto de venta fijo si todavía no existe (tolera la carrera con otro worker: la app avisa que ya existe). */
export async function ensureFixedPointOfSale(page: Page) {
  await page.goto(`${SALES_URL}/points-of-sale`);
  await hydrated(page.getByRole('button', { name: 'Nuevo punto de venta' }));
  if (await page.getByRole('row').filter({ hasText: FIXED_POS.name }).isVisible({ timeout: 3_000 }).catch(() => false)) return;
  await createPointOfSaleViaUi(page, FIXED_POS);
  await expect(page.getByText(/Punto de venta creado|ya existe/i).first()).toBeVisible();
}

/**
 * Alta de una factura de venta (Factura A, 1 x `price` + IVA 21 %) al cliente fijo y punto de venta fijo. NO se carga CAE: la app
 * no llama a ARCA, solo guarda el borrador. Devuelve el id de la factura (la app abre su detalle al crear).
 */
export async function createSalesInvoiceViaUi(page: Page, description: string, price = 1000): Promise<string> {
  await page.goto(`${SALES_URL}/invoices/new`);
  await hydrated(page.getByRole('button', { name: 'Crear factura' }));
  await pickSearchable(page, page.getByRole('combobox').first(), new RegExp(FIXED_CUSTOMER));
  await pickSelect(page, page.getByRole('combobox', { name: 'Punto de venta *' }), new RegExp(String(FIXED_POS.number).padStart(4, '0')));
  const line = page.getByRole('row').nth(1);
  await line.getByRole('textbox').fill(description);
  await line.getByRole('spinbutton').nth(1).fill(String(price));
  await page.getByRole('button', { name: 'Crear factura' }).click();
  await expect(page.getByText('Factura creada').first()).toBeVisible();
  // Al crear, la app abre el detalle de la factura: el id sale de la URL.
  await expect(page).toHaveURL(/\/dashboard\/sales\/invoices\/[0-9a-f-]{36}$/);
  await expect(page.getByText(description).first()).toBeVisible();
  return page.url().split('/').pop()!;
}

