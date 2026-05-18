const PERIODO_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export class PeriodoInvalidoError extends Error {
  constructor(value: string) {
    super(`Período inválido: '${value}'. Formato esperado: YYYY-MM (ej: 2026-05)`);
    this.name = 'PeriodoInvalidoError';
  }
}

/**
 * Valida y parsea un string 'YYYY-MM'.
 * Lanza PeriodoInvalidoError si el formato no es válido.
 */
export function parsePeriodo(value: string): { year: number; month: number } {
  if (!PERIODO_REGEX.test(value)) throw new PeriodoInvalidoError(value);
  const [year, month] = value.split('-').map(Number);
  return { year, month };
}

/** Formatea año y mes como 'YYYY-MM'. */
export function formatPeriodo(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Compara dos períodos.
 * Retorna negativo si a < b, 0 si a === b, positivo si a > b.
 */
export function comparePeriodos(a: string, b: string): number {
  return a.localeCompare(b);
}

/** Retorna el período siguiente a 'YYYY-MM'. */
export function nextPeriodo(periodo: string): string {
  const { year, month } = parsePeriodo(periodo);
  return month === 12 ? formatPeriodo(year + 1, 1) : formatPeriodo(year, month + 1);
}

/** Retorna el período anterior a 'YYYY-MM'. */
export function prevPeriodo(periodo: string): string {
  const { year, month } = parsePeriodo(periodo);
  return month === 1 ? formatPeriodo(year - 1, 12) : formatPeriodo(year, month - 1);
}

/** Formatea un período 'YYYY-MM' como texto legible: 'Mayo 2026'. */
export function formatPeriodoLabel(periodo: string): string {
  const { year, month } = parsePeriodo(periodo);
  return new Date(year, month - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}
