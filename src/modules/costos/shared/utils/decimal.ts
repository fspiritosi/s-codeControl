import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/** Convierte un valor a número JS (para cruzar la frontera server→client). */
export function toClientNumber(value: Decimal | string | number | null | undefined): number {
  if (value == null) return 0;
  return new Decimal(value).toNumber();
}

/** Convierte un valor a string con la precisión completa (para serializar a JSON). */
export function toClientString(value: Decimal | string | number | null | undefined): string {
  if (value == null) return '0';
  return new Decimal(value).toFixed();
}

/** Construye un Decimal de forma segura desde cualquier tipo. */
export function parseDecimal(value: Decimal | string | number | null | undefined): Decimal {
  if (value == null) return new Decimal(0);
  try {
    return new Decimal(value);
  } catch {
    return new Decimal(0);
  }
}

export { Decimal };
