const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const pctFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateUTCFormatter = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'UTC',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * Formatea una fecha-día (vencimiento, emisión, etc.) en formato dd/MM/yyyy.
 *
 * Las fechas-día se guardan como medianoche UTC (ej: `new Date('2026-06-19')` →
 * `2026-06-19T00:00:00Z`). Formatearlas con `new Date()` + la zona local del
 * navegador (Argentina, UTC-3) mostraría el día anterior. Por eso se formatea
 * SIEMPRE en UTC, lo que devuelve el día correcto independientemente de la zona.
 *
 * Retorna '-' para null/undefined/fecha inválida.
 */
export function formatDateUTC(value: Date | string | null | undefined): string {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '-';
  return dateUTCFormatter.format(d);
}

/**
 * Formatea un número como pesos argentinos.
 * Retorna '—' para null/undefined/NaN.
 * Ejemplo: 100000 → '$ 100.000,00'
 */
export function formatCurrencyARS(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return arsFormatter.format(value);
}

/**
 * Formatea un número decimal como porcentaje.
 * Retorna '—' para null/undefined/NaN.
 * Ejemplo: 0.85 → '85,00%'
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return `${pctFormatter.format(value * 100)}%`;
}
