import { Decimal, parseDecimal } from './decimal';
import type {
  ConceptoCCTClient,
  ContextoCalculo,
  LineaConcepto,
  ResultadoMotor,
  ParamsFijoGlobal,
  ParamsPctConcepto,
  ParamsPctSumaConceptos,
  ParamsPorAntiguedadValor,
  ParamsPorAntiguedadPct,
  ParamsPorUnidad,
} from '../types/cct.types';
import type { TopeImponibleClient } from '../types/cct.types';

// ─── Orden topológico ─────────────────────────────────────────────────────────

export class CicloConceptosError extends Error {
  constructor(ciclo: string[]) {
    super(`Ciclo detectado en conceptos: ${ciclo.join(' → ')}`);
    this.name = 'CicloConceptosError';
  }
}

export class ReferenciaConceptoInvalidaError extends Error {
  constructor(origen: string, referenciado: string) {
    super(`Concepto '${origen}' referencia concepto inexistente '${referenciado}'`);
    this.name = 'ReferenciaConceptoInvalidaError';
  }
}

function getDependencias(c: ConceptoCCTClient): string[] {
  const p = c.parametros as Record<string, unknown>;
  switch (c.clase_calculo) {
    case 'PCT_CONCEPTO':
      return [(p as { concepto_codigo: string }).concepto_codigo];
    case 'PCT_SUMA_CONCEPTOS':
      return (p as { conceptos_codigos: string[] }).conceptos_codigos;
    case 'POR_ANTIGUEDAD_PCT':
      return [(p as { concepto_base_codigo: string }).concepto_base_codigo];
    default:
      return [];
  }
}

export function ordenTopologico(conceptos: ConceptoCCTClient[]): ConceptoCCTClient[] {
  const byCode = new Map(conceptos.map((c) => [c.codigo, c]));

  // Validar referencias
  for (const c of conceptos) {
    for (const dep of getDependencias(c)) {
      if (!byCode.has(dep)) throw new ReferenciaConceptoInvalidaError(c.codigo, dep);
    }
  }

  const visitado = new Set<string>();
  const enStack = new Set<string>();
  const resultado: ConceptoCCTClient[] = [];

  function visitar(codigo: string, path: string[]) {
    if (enStack.has(codigo)) throw new CicloConceptosError([...path, codigo]);
    if (visitado.has(codigo)) return;
    enStack.add(codigo);
    const c = byCode.get(codigo)!;
    for (const dep of getDependencias(c)) visitar(dep, [...path, codigo]);
    enStack.delete(codigo);
    visitado.add(codigo);
    resultado.push(c);
  }

  for (const c of conceptos) visitar(c.codigo, []);
  return resultado;
}

// ─── Dispatch por clase de cálculo ───────────────────────────────────────────

function calcularConcepto(
  concepto: ConceptoCCTClient,
  ctx: ContextoCalculo,
  valores: Map<string, Decimal>,
  topes: Map<string, Decimal>,
): Decimal {
  const p = concepto.parametros;

  switch (concepto.clase_calculo) {
    case 'FIJO_GLOBAL': {
      return parseDecimal((p as ParamsFijoGlobal).valor);
    }

    case 'FIJO_POR_CATEGORIA': {
      const v = concepto.valores?.find((val) => {
        // valores tiene categoria_cct_id, pero en ContextoCalculo usamos codigo
        // Se espera que el caller enriquezca valores con el campo codigo si lo necesita
        // Aquí se busca por el campo adicional que el caller puede agregar
        return (val as typeof val & { categoria_codigo?: string }).categoria_codigo === ctx.categoria_codigo;
      });
      return parseDecimal(v?.valor ?? 0);
    }

    case 'PCT_CONCEPTO': {
      const { concepto_codigo, porcentaje } = p as ParamsPctConcepto;
      const base = valores.get(concepto_codigo) ?? new Decimal(0);
      return base.mul(parseDecimal(porcentaje));
    }

    case 'PCT_SUMA_CONCEPTOS': {
      const { conceptos_codigos, porcentaje, tope_codigo } = p as ParamsPctSumaConceptos;
      let suma = new Decimal(0);
      for (const cod of conceptos_codigos) suma = suma.add(valores.get(cod) ?? 0);
      if (tope_codigo) {
        const tope = topes.get(tope_codigo);
        if (tope && suma.gt(tope)) suma = tope;
      }
      return suma.mul(parseDecimal(porcentaje));
    }

    case 'POR_ANTIGUEDAD_VALOR': {
      const { valor_por_anio } = p as ParamsPorAntiguedadValor;
      return parseDecimal(valor_por_anio).mul(ctx.antiguedad_anios);
    }

    case 'POR_ANTIGUEDAD_PCT': {
      const { porcentaje_por_anio, concepto_base_codigo } = p as ParamsPorAntiguedadPct;
      const base = valores.get(concepto_base_codigo) ?? new Decimal(0);
      return base.mul(parseDecimal(porcentaje_por_anio)).mul(ctx.antiguedad_anios);
    }

    case 'POR_UNIDAD': {
      const { unidad, recargo, derivacion } = p as ParamsPorUnidad;
      let valorUnitario: Decimal;

      if (derivacion) {
        const base = valores.get(derivacion.base) ?? new Decimal(0);
        const divisor = parseDecimal(derivacion.divisor);
        valorUnitario = divisor.isZero() ? new Decimal(0) : base.div(divisor);
      } else {
        valorUnitario = new Decimal(1);
      }

      if (recargo) valorUnitario = valorUnitario.mul(parseDecimal(1 + recargo));

      const cantidad =
        unidad === 'horas'
          ? parseDecimal(ctx.hs_nocturnas + ctx.hs_extras_50 + ctx.hs_extras_100)
          : parseDecimal(ctx.dias_trabajados);

      return valorUnitario.mul(cantidad);
    }

    default:
      return new Decimal(0);
  }
}

// ─── Motor principal ──────────────────────────────────────────────────────────

export function ejecutarMotor(
  conceptos: ConceptoCCTClient[],
  ctx: ContextoCalculo,
  topes: TopeImponibleClient[],
  periodo: string,
): ResultadoMotor {
  const activos = conceptos.filter((c) => c.is_active);
  const ordenados = ordenTopologico(activos);

  // Construir mapa de topes vigentes para el período
  const topesMap = new Map<string, Decimal>();
  for (const t of topes) {
    if (t.vigencia_desde <= periodo) {
      // Toma el más reciente por código
      const anterior = topesMap.get(t.codigo);
      if (!anterior || t.vigencia_desde > (topesMap.get(`__fecha_${t.codigo}`) ? '' : '')) {
        topesMap.set(t.codigo, parseDecimal(t.valor));
        topesMap.set(`__fecha_${t.codigo}`, parseDecimal(0)); // placeholder
      }
    }
  }

  // Para topes, necesitamos el más reciente con vigencia_desde <= periodo
  const topesFiltrados = new Map<string, Decimal>();
  const codigosTope = [...new Set(topes.map((t) => t.codigo))];
  for (const codigo of codigosTope) {
    const vigentes = topes
      .filter((t) => t.vigencia_desde <= periodo)
      .sort((a, b) => b.vigencia_desde.localeCompare(a.vigencia_desde));
    const masReciente = vigentes[0];
    if (masReciente) topesFiltrados.set(codigo, parseDecimal(masReciente.valor));
  }

  const valores = new Map<string, Decimal>();
  const lineas: LineaConcepto[] = [];

  for (const c of ordenados) {
    const importe = calcularConcepto(c, ctx, valores, topesFiltrados);
    valores.set(c.codigo, importe);
    lineas.push({
      concepto_codigo: c.codigo,
      concepto_nombre: c.nombre,
      tipo: c.tipo,
      aplica_en: c.aplica_en,
      importe: importe.toNumber(),
    });
  }

  const sum = (tipo: string) =>
    lineas.filter((l) => l.tipo === tipo).reduce((acc, l) => acc + l.importe, 0);

  return {
    lineas,
    total_remunerativo: sum('remunerativo'),
    total_no_remunerativo: sum('no_remunerativo'),
    total_descuentos: sum('descuento'),
    total_aportes_patronales: sum('aporte_patronal'),
    total_provisiones: sum('provision'),
    total_prevision: sum('prevision'),
    total_ausentismo: sum('ausentismo'),
  };
}
