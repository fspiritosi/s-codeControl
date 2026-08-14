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
 * El rate sale de la factura, pero una factura EN PESOS trae rate = 1, que no
 * alcanza para convertirla cuando la orden está en dólares. En ese caso el rate
 * lo aporta la orden. Los tres casos:
 *
 *   ítem y orden en la misma moneda        -> 1 (no se convierte)
 *   ítem en moneda extranjera              -> el de la factura
 *   ítem en la base, orden en extranjera   -> el de la orden
 */
export function effectiveRate(
  item: { currency: string; exchange_rate: number },
  order: { currency: string; exchange_rate: number }
): number {
  if (item.currency === order.currency) return 1;
  if (item.currency !== BASE_CURRENCY && isValidExchangeRate(item.exchange_rate) && item.exchange_rate > 1) {
    return item.exchange_rate;
  }
  return isValidExchangeRate(order.exchange_rate) ? order.exchange_rate : 1;
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
