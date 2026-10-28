import { expect, type Locator, type Page } from '@playwright/test';
import { uniq } from './env';
import { clickHydrated, hydrated } from './ui';

export const PURCHASING_URL = '/dashboard/purchasing';
export const WAREHOUSE_URL = '/dashboard/warehouse';

/** Proveedor fijo de la suite: la app no permite dar de baja proveedores, así que se crea una vez y se reutiliza. Sin email: aprobar una OC no envía mails. */
export const FIXED_SUPPLIER = 'QA-E2E-Proveedor';
const FIXED_SUPPLIER_CUIT = '30-99990001-8';
/** Almacenes fijos de la suite (la app no permite desactivar almacenes). */
export const FIXED_WAREHOUSE_A = { code: 'QA-E2E-ALM-A', name: 'QA-E2E-Almacen-A' };
export const FIXED_WAREHOUSE_B = { code: 'QA-E2E-ALM-B', name: 'QA-E2E-Almacen-B' };

/** PDF mínimo con contenido distinguible, para comprobar que lo guardado es lo subido. */
export const pdfFile = (marker: string) => ({
  name: `${marker}.pdf`,
  mimeType: 'application/pdf',
  buffer: Buffer.from(`%PDF-1.4\n% ${marker}\n%%EOF`),
});

/** CUIT con formato válido y único por corrida (la app solo valida el formato). */
export const uniqueCuit = () => `30-${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}-7`;

/** Elige una opción de un `SearchableSelect` (popover con buscador) y espera a que quede reflejada en el botón. */
export async function pickSearchable(page: Page, trigger: Locator, option: string | RegExp) {
  await clickHydrated(trigger);
  await page.getByRole('option', { name: option }).first().click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
}

/** Elige una opción de un `Select` de shadcn. */
export async function pickSelect(page: Page, trigger: Locator, option: string | RegExp) {
  await clickHydrated(trigger);
  await page.getByRole('option', { name: option }).first().click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
}

/** Abre una pestaña de Compras (`?tab=`) y devuelve su panel. */
export async function gotoPurchasingTab(page: Page, tab: 'orders' | 'invoices' | 'receiving' | 'suppliers', search?: string): Promise<Locator> {
  // `search` filtra el listado por la URL (los listados están paginados y los datos de prueba se acumulan).
  await page.goto(`${PURCHASING_URL}?tab=${tab}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
  const panel = page.getByRole('tabpanel');
  await expect(panel).toBeVisible();
  return panel;
}

/** Abre una pestaña de Almacenes (`?tab=`) y devuelve su panel. */
export async function gotoWarehouseTab(page: Page, tab: 'warehouses' | 'products' | 'withdrawals' | 'movements', search?: string): Promise<Locator> {
  // `search` filtra el listado por la URL (el listado está paginado y los datos de prueba se acumulan).
  await page.goto(`${WAREHOUSE_URL}?tab=${tab}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
  const panel = page.getByRole('tabpanel');
  await expect(panel).toBeVisible();
  return panel;
}

/** Abre el menú de acciones ("...") de una fila y devuelve el menú. */
export async function openRowMenu(page: Page, row: Locator) {
  await clickHydrated(row.getByRole('button').last());
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  return menu;
}

export type NewSupplier = { name: string; cuit: string };

/** Alta de un proveedor por el formulario. `extra` permite completar la sección de métodos de pago antes de guardar. */
export async function createSupplierViaUi(page: Page, supplier: NewSupplier, extra?: (page: Page) => Promise<void>) {
  await page.goto('/dashboard/suppliers/new');
  await hydrated(page.getByRole('button', { name: 'Crear proveedor' }));
  await page.getByRole('textbox', { name: 'Razón social *' }).fill(supplier.name);
  await page.getByRole('textbox', { name: 'CUIT *' }).fill(supplier.cuit);
  if (extra) await extra(page);
  await page.getByRole('button', { name: 'Crear proveedor' }).click();
}

/** Crea el proveedor fijo si todavía no existe (si otro worker lo creó a la vez, la app avisa que el CUIT ya existe y se sigue). */
export async function ensureFixedSupplier(page: Page) {
  await page.goto('/dashboard/suppliers/new');
  await hydrated(page.getByRole('button', { name: 'Crear proveedor' }));
  await page.getByRole('textbox', { name: 'Razón social *' }).fill(FIXED_SUPPLIER);
  await page.getByRole('textbox', { name: 'CUIT *' }).fill(FIXED_SUPPLIER_CUIT);
  await page.getByRole('button', { name: 'Crear proveedor' }).click();
  await expect(page.getByText(/Proveedor creado|ya está registrado|Ya existe un proveedor/).first()).toBeVisible();
}

/** Alta de un producto de compra y venta por el formulario (código autogenerado); devuelve cuando vuelve al listado. */
export async function createProductViaUi(page: Page, name: string, cost = 100) {
  await page.goto('/dashboard/products/new');
  await hydrated(page.getByRole('button', { name: 'Crear producto' }));
  await page.getByRole('textbox', { name: 'Nombre *' }).fill(name);
  await page.getByRole('spinbutton').first().fill(String(cost));
  await page.getByRole('spinbutton', { name: '% de ganancia *' }).fill('10');
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await expect(page.getByText('Producto creado').first()).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/warehouse\?tab=products/);
}

/** Desactiva un producto desde el listado (limpieza). Tolerante si no está activo o no existe. */
export async function deactivateProductIfActive(page: Page, name: string) {
  const panel = await gotoWarehouseTab(page, 'products', name);
  const row = panel.getByRole('row').filter({ hasText: name });
  if (!(await row.first().isVisible({ timeout: 5_000 }).catch(() => false))) return;
  const menu = await openRowMenu(page, row);
  const item = menu.getByRole('menuitem', { name: 'Desactivar' });
  if (!(await item.isVisible().catch(() => false))) return;
  await item.click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Desactivar' }).click();
  await expect(page.getByText('Producto desactivado').first()).toBeVisible();
}

/** Crea un almacén por el formulario. */
export async function createWarehouseViaUi(page: Page, code: string, name: string) {
  await page.goto('/dashboard/warehouse/new');
  await hydrated(page.getByRole('button', { name: 'Crear almacén' }));
  await page.getByRole('textbox', { name: 'Código *' }).fill(code);
  await page.getByRole('textbox', { name: 'Nombre *' }).fill(name);
  await page.getByRole('button', { name: 'Crear almacén' }).click();
}

/** Crea un almacén fijo si no existe (tolera la carrera con otro worker: la app avisa que el código ya existe). */
export async function ensureWarehouse(page: Page, wh: { code: string; name: string }) {
  await createWarehouseViaUi(page, wh.code, wh.name);
  await expect(page.getByText(/Almacén creado|Ya existe un almacén con ese código/).first()).toBeVisible();
}

export const newName = (tag: string) => uniq(tag);

/**
 * Alta de una orden de compra al proveedor fijo, con una línea de texto libre (`description`) de 2 x 500. La app vuelve al
 * listado; como el más reciente va primero, se toma el id de la primera fila y se comprueba que la línea es la creada.
 */
export async function createPurchaseOrderViaUi(page: Page, description: string): Promise<string> {
  await page.goto('/dashboard/purchasing/orders/new');
  await hydrated(page.getByRole('button', { name: 'Crear orden de compra' }));
  await pickSearchable(page, page.getByRole('combobox').first(), new RegExp(FIXED_SUPPLIER));
  const line = page.getByRole('row').nth(1);
  await line.getByRole('textbox').fill(description);
  await line.getByRole('spinbutton').nth(0).fill('2');
  await line.getByRole('spinbutton').nth(1).fill('500');
  await page.getByRole('button', { name: 'Crear orden de compra' }).click();
  await expect(page.getByText('Orden de compra creada').first()).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/purchasing\?tab=orders/);
  const firstLink = page.getByRole('tabpanel').getByRole('link', { name: /^OC-\d+/ }).first();
  await expect(firstLink).toBeVisible();
  const id = (await firstLink.getAttribute('href'))!.split('/').pop()!;
  await page.goto(`/dashboard/purchasing/orders/${id}`);
  await expect(page.getByText(description).first()).toBeVisible();
  return id;
}

/** Número de factura de 8 dígitos único por corrida (el punto de venta queda en el valor por defecto, 00001). */
export const uniqueInvoiceNumber = () => String(10_000_000 + Math.floor(Math.random() * 89_999_999));

/**
 * Alta de una factura de compra (Factura A, 1 x 1000 + IVA 21 %) al proveedor fijo; con `attachment` se sube el archivo en la
 * tarjeta "Adjunto". NO se usa el cuadro "Cargar desde factura": ese pide a un modelo de IA que lea el archivo.
 * Devuelve el id de la factura, tomado del enlace de su fila en el listado.
 */
export async function createInvoiceViaUi(page: Page, number: string, attachment?: { name: string; mimeType: string; buffer: Buffer }): Promise<string> {
  await page.goto('/dashboard/purchasing/invoices/new');
  await hydrated(page.getByRole('button', { name: 'Crear factura' }));
  await pickSearchable(page, page.getByRole('combobox').first(), new RegExp(FIXED_SUPPLIER));
  await page.getByRole('textbox', { name: 'Número *' }).fill(number);
  const line = page.getByRole('row').nth(1);
  await line.getByRole('textbox').fill(`Linea factura ${number}`);
  await line.getByRole('spinbutton').nth(1).fill('1000');
  if (attachment) {
    await page.locator('input[type=file]').last().setInputFiles(attachment);
    await expect(page.getByText(new RegExp(attachment.name))).toBeVisible();
  }
  await page.getByRole('button', { name: 'Crear factura' }).click();
  await expect(page.getByText('Factura creada').first()).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/purchasing\?tab=invoices/);
  // El número no es un enlace: el id sale del "Ver detalle" del menú de la fila.
  const row = page.getByRole('tabpanel').getByRole('row').filter({ hasText: `00001-${number.padStart(8, '0')}` });
  await expect(row).toBeVisible();
  const menu = await openRowMenu(page, row);
  const href = await menu.getByRole('menuitem', { name: 'Ver detalle' }).getAttribute('href');
  await page.keyboard.press('Escape');
  return href!.split('/').pop()!;
}

/**
 * Abre el detalle (stock) de un almacén desde el listado, buscándolo por nombre. Bajo carga (varios workers contra el clon) el clic
 * en el enlace a veces se pierde o la app vuelve sola al listado: se repite todo el recorrido hasta ver el detalle con sus botones.
 */
export async function openWarehouseDetail(page: Page, name: string) {
  await expect(async () => {
    const panel = await gotoWarehouseTab(page, 'warehouses', name);
    await panel.getByRole('link', { name: new RegExp(name) }).click({ timeout: 3_000 });
    await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: 'Ajustar stock' })).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 60_000 });
}

/** Ajusta el stock de un producto en un almacén (diálogo "Ajustar stock" de su detalle); deja la cantidad indicada. */
export async function adjustStockViaUi(page: Page, warehouse: string, product: string, quantity: number, notes: string) {
  const dialog = await openStockDialog(page, warehouse, 'Ajustar stock');
  await pickSelect(page, dialog.getByRole('combobox'), new RegExp(product));
  await dialog.getByRole('spinbutton').fill(String(quantity));
  await dialog.getByRole('textbox').fill(notes);
  await dialog.getByRole('button', { name: 'Confirmar ajuste' }).click();
  await expect(page.getByText('Stock ajustado').first()).toBeVisible();
  await expect(dialog).toBeHidden();
}

/** Fila de un producto en la tabla de stock del almacén abierto. */
export const stockRow = (page: Page, product: string) => page.getByRole('row').filter({ hasText: product });

/**
 * Abre el detalle de un almacén y uno de sus diálogos ("Ajustar stock" o "Transferir"). Bajo carga la app a veces vuelve sola al
 * listado justo después de abrir el detalle (visto en el clon con varios workers): se repite todo el recorrido hasta ver el diálogo.
 */
export async function openStockDialog(page: Page, warehouse: string, button: 'Ajustar stock' | 'Transferir'): Promise<Locator> {
  const dialog = page.getByRole('dialog', { name: button === 'Transferir' ? 'Transferir stock' : 'Ajustar stock' });
  await expect(async () => {
    await openWarehouseDetail(page, warehouse);
    await page.getByRole('button', { name: button }).click({ timeout: 3_000 });
    await expect(dialog).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 90_000 });
  return dialog;
}

/**
 * Abre el stock de un almacén ya filtrado por producto (`?search=`): los almacenes fijos acumulan un producto por corrida y la tabla
 * pagina de a 10, así que el producto de prueba puede quedar fuera de la primera página.
 */
export async function openWarehouseStock(page: Page, warehouse: string, product: string) {
  await openWarehouseDetail(page, warehouse);
  await page.goto(`${page.url().split('?')[0]}?search=${encodeURIComponent(product)}`);
  await expect(page.getByRole('heading', { name: warehouse })).toBeVisible();
}
