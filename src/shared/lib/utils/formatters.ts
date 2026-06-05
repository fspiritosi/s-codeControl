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
