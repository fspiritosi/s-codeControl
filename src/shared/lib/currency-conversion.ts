/**
 * Conversión de importes entre monedas para órdenes de pago (tsk-576).
 *
 * Vive en `shared` porque lo necesitan tesorería (armar la OP) y el formulario
 * cliente, y los módulos no pueden importarse entre sí. Es puro: sin Prisma,
 * testeable aislado, igual que `purchase-invoice-balance.ts`.
 *
 * Convención del tipo de cambio: `rate` es siempre cuántas unidades de la moneda
 * base (ARS) vale UNA unidad de la moneda extranjera. Un dólar a $1250 es
 * rate = 1250, tanto para convertir de USD a ARS como al revés.
 */

export const BASE_CURRENCY = 'ARS';

export const SUPPORTED_CURRENCIES = ['ARS', 'USD'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const round2 = (n: number) => Math.round(n * 100) / 100;

export function currencySymbol(currency: string): string {
  return currency === 'USD' ? 'US$' : '$';
}

/**
 * Convierte un importe de la moneda de un comprobante a la moneda de la orden.
 *
 * Los tres casos:
 *   - misma moneda            -> el importe no se toca (ni siquiera se redondea
 *                                por un rate que no se usó)
 *   - extranjera -> base      -> multiplica por el tipo de cambio
 *   - base -> extranjera      -> divide por el tipo de cambio
 *
 * Un `rate` no positivo devuelve el importe sin convertir: es un dato inválido y
 * multiplicar por cero borraría plata de la orden en silencio. Quien llame debe
 * validar el rate antes (ver `isValidExchangeRate`).
 */
export function convertAmount({
  amount,
  from,
  to,
  rate,
}: {
  amount: number;
  from: string;
  to: string;
  rate: number;
}): number {
  if (from === to) return round2(amount);
  if (!Number.isFinite(rate) || rate <= 0) return round2(amount);

  if (to === BASE_CURRENCY) return round2(amount * rate);
  if (from === BASE_CURRENCY) return round2(amount / rate);

  // Cruce entre dos monedas extranjeras: hoy no se da (solo ARS y USD), pero
  // dejarlo explícito evita una conversión silenciosamente incorrecta si se
  // agrega una tercera moneda.
  return round2(amount);
}

export function isValidExchangeRate(rate: unknown): rate is number {
  const n = Number(rate);
  return Number.isFinite(n) && n > 0;
}

/**
 * Tipo de cambio que hay que aplicarle realmente a un ítem.
 *
 * Una factura en dólares se puede pagar en pesos al tipo de cambio del día del
 * pago, no al de la factura: ese TC lo carga la orden. Los casos:
 *
 *   ítem y orden en la misma moneda          -> 1 (no se convierte)
 *   monedas distintas, la orden trae TC      -> el de la orden (día del pago)
 *   monedas distintas, la orden no trae TC   -> el de la factura
 *
 * El último caso son las OP en pesos anteriores a este cambio: se guardaron con
 * TC 1 y se convirtieron con el de la factura, y así tienen que seguir.
 */
export function effectiveRate(
  item: { currency: string; exchange_rate: number },
  order: { currency: string; exchange_rate: number }
): number {
  if (item.currency === order.currency) return 1;
  if (isValidExchangeRate(order.exchange_rate) && order.exchange_rate > 1) {
    return order.exchange_rate;
  }
  if (item.currency !== BASE_CURRENCY && isValidExchangeRate(item.exchange_rate) && item.exchange_rate > 1) {
    return item.exchange_rate;
  }
  return 1;
}

/**
 * Un ítem de la orden necesita un tipo de cambio explícito solo cuando su
 * comprobante está en una moneda distinta a la de la orden.
 */
export function needsExchangeRate(itemCurrency: string, orderCurrency: string): boolean {
  return itemCurrency !== orderCurrency;
}

/**
 * Suma los importes de los ítems ya expresados en la moneda de la orden.
 * Es la única suma válida: sumar `amount` mezclaría monedas.
 */
export function sumInOrderCurrency(
  items: Array<{ amount: number; currency: string; exchange_rate: number }>,
  order: { currency: string; exchange_rate: number }
): number {
  return round2(
    items.reduce(
      (acc, item) =>
        acc +
        convertAmount({
          amount: item.amount,
          from: item.currency,
          to: order.currency,
          rate: effectiveRate(item, order),
        }),
      0
    )
  );
}

/**
 * Una factura necesita su propio TC hacia la OC cuando está en pesos y la OC en
 * moneda extranjera: el proveedor factura en pesos al cambio de la fecha de la
 * factura, y ese TC es el que descuenta el saldo de la OC. Al revés (factura en
 * USD, OC en pesos) alcanza con el `exchange_rate` propio de la factura.
 */
export function invoiceNeedsOrderRate(invoiceCurrency: string | null | undefined, orderCurrency: string): boolean {
  return (invoiceCurrency || BASE_CURRENCY) === BASE_CURRENCY && orderCurrency !== BASE_CURRENCY;
}

/**
 * Decide el `order_exchange_rate` que queda en cada factura al imputarla a una
 * OC. Solo devuelve las que lo necesitan (ver `invoiceNeedsOrderRate`): el TC
 * ingresado manda; si no hay uno válido se conserva el que ya tenía la factura.
 * Si alguna queda sin TC válido falla con sus números, para no imputar pesos
 * como si fueran dólares.
 */
export function resolveInvoiceOrderRates(
  invoices: Array<{ id: string; full_number: string; currency: string | null; order_exchange_rate: number | null }>,
  orderCurrency: string,
  provided: Record<string, number | null | undefined>
): { ok: true; rates: Record<string, number> } | { ok: false; missing: string[] } {
  const rates: Record<string, number> = {};
  const missing: string[] = [];
  const valid = (n: unknown): n is number => isValidExchangeRate(n) && Number(n) > 1;

  for (const inv of invoices) {
    if (!invoiceNeedsOrderRate(inv.currency, orderCurrency)) continue;
    const input = provided[inv.id];
    if (valid(input)) rates[inv.id] = Number(input);
    else if (valid(inv.order_exchange_rate)) rates[inv.id] = Number(inv.order_exchange_rate);
    else missing.push(inv.full_number);
  }

  return missing.length > 0 ? { ok: false, missing } : { ok: true, rates };
}

/**
 * Importe de una factura de compra expresado en la moneda de su OC: es lo que la
 * factura le descuenta al saldo (en montos) de la orden.
 *
 * El TC sale de la factura, porque el proveedor factura al cambio de su fecha:
 *   misma moneda                      -> el importe tal cual
 *   factura en USD, OC en pesos       -> `exchange_rate` de la factura
 *   factura en pesos, OC en USD       -> `order_exchange_rate` de la factura
 * Si la factura no trae TC (facturas cargadas antes de guardarlo), se usa el TC
 * de referencia de la OC.
 */
export function invoiceAmountInOrderCurrency(
  amount: number,
  invoice: { currency: string; exchange_rate: number; order_exchange_rate?: number | null },
  order: { currency: string; exchange_rate: number }
): number {
  if (invoice.currency === order.currency) return round2(amount);
  const invoiceRate =
    invoice.currency === BASE_CURRENCY ? Number(invoice.order_exchange_rate) : Number(invoice.exchange_rate);
  const rate = isValidExchangeRate(invoiceRate) && invoiceRate > 1 ? invoiceRate : order.exchange_rate;
  return convertAmount({ amount, from: invoice.currency, to: order.currency, rate });
}
