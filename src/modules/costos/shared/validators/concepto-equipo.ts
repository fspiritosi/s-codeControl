import { z } from 'zod';
import type { ClaseCalculoConceptoEquipo } from '@/modules/costos/shared/utils/calcular-conceptos-equipo';

const pct = z.coerce.number().min(0).max(1, 'El porcentaje se guarda en fracción (0,17 = 17%)');

export const schemaParametrosFijo = z.object({
  cantidad: z.coerce.number().positive(),
  precio_unitario: z.coerce.number().nonnegative(),
});

export const schemaParametrosPctValorEquipo = z.object({
  pct,
  base: z.enum(['VALOR_COMPRA', 'VALOR_COMPRA_MAS_ACCESORIOS', 'VALOR_RESIDUAL']),
});

export const schemaParametrosPctConcepto = z.object({
  pct,
  concepto_codigo: z.string().min(1),
});

export const schemaParametrosPctSumaConceptos = z.object({
  pct,
  conceptos_codigos: z.array(z.string().min(1)).min(1, 'Elegí al menos un concepto'),
});

export const schemaParametrosPorKm = z.object({
  monto_por_km: z.coerce.number().nonnegative(),
});

const PORCLASE = {
  FIJO: schemaParametrosFijo,
  PCT_VALOR_EQUIPO: schemaParametrosPctValorEquipo,
  PCT_CONCEPTO: schemaParametrosPctConcepto,
  PCT_SUMA_CONCEPTOS: schemaParametrosPctSumaConceptos,
  POR_KM: schemaParametrosPorKm,
} as const;

/** Valida los parámetros según la clase de cálculo. Lanza ZodError si no corresponden. */
export function validarParametros(
  clase_calculo: ClaseCalculoConceptoEquipo,
  parametros: unknown
): Record<string, unknown> {
  return PORCLASE[clase_calculo].parse(parametros) as Record<string, unknown>;
}

/**
 * Deriva un código estable desde el nombre: minúsculas, sin acentos, no alfanuméricos a `_`,
 * truncado a 40. Ante colisión agrega un sufijo numérico. Determinista.
 */
export function derivarCodigo(nombre: string, existentes: string[]): string {
  const base = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

  const usados = new Set(existentes);
  if (!usados.has(base)) return base;

  let n = 2;
  while (usados.has(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}

const BASES_LEGIBLES: Record<string, string> = {
  VALOR_COMPRA: 'valor de compra',
  VALOR_COMPRA_MAS_ACCESORIOS: 'valor de compra más accesorios',
  VALOR_RESIDUAL: 'valor residual',
};

function money(v: number): string {
  return `$${new Intl.NumberFormat('es-AR').format(v)}`;
}

function pctLegible(v: number): string {
  return `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(v * 100)}%`;
}

/** Texto corto que explica cómo se calcula un concepto, para mostrar en la tabla. */
export function describirCalculo(
  clase_calculo: ClaseCalculoConceptoEquipo,
  p: Record<string, unknown>
): string {
  switch (clase_calculo) {
    case 'FIJO':
      return `${p.cantidad} × ${money(Number(p.precio_unitario))}`;
    case 'PCT_VALOR_EQUIPO':
      return `${pctLegible(Number(p.pct))} del ${BASES_LEGIBLES[String(p.base)]}`;
    case 'PCT_CONCEPTO':
      return `${pctLegible(Number(p.pct))} de ${p.concepto_codigo}`;
    case 'PCT_SUMA_CONCEPTOS':
      return `${pctLegible(Number(p.pct))} de ${(p.conceptos_codigos as string[]).join(' + ')}`;
    case 'POR_KM':
      return `${money(Number(p.monto_por_km))} por km`;
  }
}
