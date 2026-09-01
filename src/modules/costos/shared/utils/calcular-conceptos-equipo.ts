import { Decimal, parseDecimal } from './decimal';

type Num = Decimal | string | number;

export type ClaseCalculoConceptoEquipo =
  | 'FIJO'
  | 'PCT_VALOR_EQUIPO'
  | 'PCT_CONCEPTO'
  | 'PCT_SUMA_CONCEPTOS'
  | 'POR_KM';

export type BaseValorEquipo = 'VALOR_COMPRA' | 'VALOR_COMPRA_MAS_ACCESORIOS' | 'VALOR_RESIDUAL';

export type ConceptoEquipoCalc = {
  codigo: string;
  clase: 'ACCESORIO' | 'MANTENIMIENTO';
  clase_calculo: ClaseCalculoConceptoEquipo;
  parametros: Record<string, unknown>;
  is_active?: boolean | null;
};

/** Datos de la unidad sobre los que se resuelven los conceptos porcentuales. */
export type ContextoEquipo = {
  valor_compra: Num;
  valor_residual_pct: Num;
  km_anuales: number;
};

export class CicloConceptosEquipoError extends Error {
  /** Códigos del ciclo, en orden. Quien lo captura los traduce a nombres para el usuario. */
  readonly ciclo: string[];

  constructor(ciclo: string[]) {
    super(`Ciclo detectado en conceptos de equipo: ${ciclo.join(' → ')}`);
    this.name = 'CicloConceptosEquipoError';
    this.ciclo = ciclo;
  }
}

export class ReferenciaConceptoEquipoInvalidaError extends Error {
  /** Código del concepto que referencia. */
  readonly origen: string;
  /** Código referenciado que no está en el conjunto. */
  readonly referenciado: string;

  constructor(origen: string, referenciado: string) {
    super(`El concepto '${origen}' referencia a '${referenciado}', que no existe`);
    this.name = 'ReferenciaConceptoEquipoInvalidaError';
    this.origen = origen;
    this.referenciado = referenciado;
  }
}

/**
 * Dependencias de un concepto. Un concepto con base VALOR_COMPRA_MAS_ACCESORIOS depende
 * implícitamente de TODOS los accesorios: así su base está completa cuando se resuelve, y un
 * accesorio que use esa base queda detectado como ciclo (se definiría en términos de sí mismo).
 */
function getDependencias(c: ConceptoEquipoCalc, codigosAccesorios: string[]): string[] {
  const p = c.parametros;
  switch (c.clase_calculo) {
    case 'PCT_CONCEPTO':
      return [String(p.concepto_codigo)];
    case 'PCT_SUMA_CONCEPTOS':
      return (p.conceptos_codigos as string[]) ?? [];
    case 'PCT_VALOR_EQUIPO':
      return p.base === 'VALOR_COMPRA_MAS_ACCESORIOS' ? codigosAccesorios : [];
    default:
      return [];
  }
}

/** Ordena los conceptos de modo que cada uno se resuelva después de sus dependencias. */
export function ordenTopologicoConceptos(conceptos: ConceptoEquipoCalc[]): ConceptoEquipoCalc[] {
  const activos = conceptos.filter((c) => c.is_active !== false);
  // Referencia válida = el código existe entre TODOS los conceptos (activos o no). Un concepto
  // inactivo referenciado como base no es un error: simplemente no entra al grafo y su valor
  // se resuelve como 0 (no se calcula ni sirve de base).
  const byCodeTodos = new Map(conceptos.map((c) => [c.codigo, c]));
  const byCode = new Map(activos.map((c) => [c.codigo, c]));
  const codigosAccesorios = activos.filter((c) => c.clase === 'ACCESORIO').map((c) => c.codigo);

  for (const c of activos) {
    for (const dep of getDependencias(c, codigosAccesorios)) {
      if (!byCodeTodos.has(dep)) throw new ReferenciaConceptoEquipoInvalidaError(c.codigo, dep);
    }
  }

  const visitado = new Set<string>();
  const enStack = new Set<string>();
  const resultado: ConceptoEquipoCalc[] = [];

  function visitar(codigo: string, path: string[]) {
    if (!byCode.has(codigo)) return; // existe pero está inactivo: no entra al grafo, vale 0
    if (enStack.has(codigo)) throw new CicloConceptosEquipoError([...path, codigo]);
    if (visitado.has(codigo)) return;
    enStack.add(codigo);
    const c = byCode.get(codigo)!;
    for (const dep of getDependencias(c, codigosAccesorios)) visitar(dep, [...path, codigo]);
    enStack.delete(codigo);
    visitado.add(codigo);
    resultado.push(c);
  }

  for (const c of activos) visitar(c.codigo, []);
  return resultado;
}

function calcularUno(
  c: ConceptoEquipoCalc,
  ctx: ContextoEquipo,
  valores: Map<string, Decimal>,
  accesoriosResueltos: Decimal
): Decimal {
  const p = c.parametros;

  switch (c.clase_calculo) {
    case 'FIJO':
      return parseDecimal(p.cantidad as Num).mul(parseDecimal(p.precio_unitario as Num));

    case 'PCT_VALOR_EQUIPO': {
      const compra = parseDecimal(ctx.valor_compra);
      const base =
        p.base === 'VALOR_RESIDUAL'
          ? compra.mul(parseDecimal(ctx.valor_residual_pct))
          : p.base === 'VALOR_COMPRA_MAS_ACCESORIOS'
            ? compra.add(accesoriosResueltos)
            : compra;
      return base.mul(parseDecimal(p.pct as Num));
    }

    case 'PCT_CONCEPTO': {
      const base = valores.get(String(p.concepto_codigo)) ?? new Decimal(0);
      return base.mul(parseDecimal(p.pct as Num));
    }

    case 'PCT_SUMA_CONCEPTOS': {
      const codigos = (p.conceptos_codigos as string[]) ?? [];
      let suma = new Decimal(0);
      for (const cod of codigos) suma = suma.add(valores.get(cod) ?? 0);
      return suma.mul(parseDecimal(p.pct as Num));
    }

    case 'POR_KM':
      return parseDecimal(p.monto_por_km as Num).mul(ctx.km_anuales);
  }
}

/**
 * Resuelve todos los conceptos de un equipo y los agrega por clase.
 * Los porcentuales se calculan con los valores de ESA unidad, así que dos equipos del mismo
 * tipo con distinto valor de compra obtienen importes distintos del mismo concepto.
 */
export function calcularConceptosEquipo(
  conceptos: ConceptoEquipoCalc[],
  ctx: ContextoEquipo
): { accesorios: Decimal; mantenimiento_anual: Decimal; por_concepto: Map<string, Decimal> } {
  const ordenados = ordenTopologicoConceptos(conceptos);
  const por_concepto = new Map<string, Decimal>();
  let accesorios = new Decimal(0);
  let mantenimiento_anual = new Decimal(0);

  for (const c of ordenados) {
    const valor = calcularUno(c, ctx, por_concepto, accesorios);
    por_concepto.set(c.codigo, valor);
    if (c.clase === 'ACCESORIO') accesorios = accesorios.add(valor);
    else mantenimiento_anual = mantenimiento_anual.add(valor);
  }

  return { accesorios, mantenimiento_anual, por_concepto };
}
