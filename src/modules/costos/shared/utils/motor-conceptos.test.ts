import { describe, it, expect } from 'vitest';
import {
  ejecutarMotor,
  ordenTopologico,
  CicloConceptosError,
  ReferenciaConceptoInvalidaError,
} from './motor-conceptos';
import type { ConceptoCCTClient, ContextoCalculo } from '../types/cct.types';

// ─── Helpers para construir conceptos de prueba ───────────────────────────────

let _id = 0;
function concepto(
  codigo: string,
  clase: ConceptoCCTClient['clase_calculo'],
  parametros: any,
  opts: Partial<ConceptoCCTClient> = {}
): ConceptoCCTClient {
  return {
    id: `c${_id++}`,
    config_cct_id: 'cct1',
    codigo,
    nombre: codigo,
    tipo: 'remunerativo',
    aplica_en: ['mod_servicio', 'liquidacion'],
    clase_calculo: clase,
    orden: 0,
    is_active: true,
    parametros,
    ...opts,
  } as ConceptoCCTClient;
}

function valorCategoria(categoria_codigo: string, valor: number) {
  return { id: `v${_id++}`, concepto_cct_id: 'x', categoria_cct_id: 'y', valor, categoria_codigo } as any;
}

const CTX_BASE: ContextoCalculo = {
  categoria_codigo: 'VIIB',
  antiguedad_anios: 6,
  dias_trabajados: 30,
  hs_nocturnas: 12,
  hs_extras_50: 9,
  hs_extras_100: 0,
  dias_feriado: 0,
  dias_desarraigo: 0,
};

describe('ordenTopologico', () => {
  it('ordena dependencias antes que dependientes', () => {
    const conceptos = [
      concepto('ZONA', 'PCT_CONCEPTO', { concepto_codigo: 'BASICO', porcentaje: 0.85 }),
      concepto('BASICO', 'FIJO_GLOBAL', { valor: 100 }),
    ];
    const orden = ordenTopologico(conceptos).map((c) => c.codigo);
    expect(orden.indexOf('BASICO')).toBeLessThan(orden.indexOf('ZONA'));
  });

  it('detecta ciclos', () => {
    const conceptos = [
      concepto('A', 'PCT_CONCEPTO', { concepto_codigo: 'B', porcentaje: 1 }),
      concepto('B', 'PCT_CONCEPTO', { concepto_codigo: 'A', porcentaje: 1 }),
    ];
    expect(() => ordenTopologico(conceptos)).toThrow(CicloConceptosError);
  });

  it('detecta referencias inválidas', () => {
    const conceptos = [concepto('A', 'PCT_CONCEPTO', { concepto_codigo: 'NOPE', porcentaje: 1 })];
    expect(() => ordenTopologico(conceptos)).toThrow(ReferenciaConceptoInvalidaError);
  });
});

describe('ejecutarMotor — clases de cálculo', () => {
  it('FIJO_GLOBAL devuelve el valor', () => {
    const r = ejecutarMotor([concepto('BONO', 'FIJO_GLOBAL', { valor: 227559 })], CTX_BASE, [], '2025-06');
    expect(r.lineas[0].importe).toBe(227559);
  });

  it('FIJO_POR_CATEGORIA toma el valor de la categoría del contexto', () => {
    const c = concepto('BASICO', 'FIJO_POR_CATEGORIA', {}, {
      valores: [valorCategoria('VIIB', 668453.89), valorCategoria('JB', 690940)],
    });
    const r = ejecutarMotor([c], CTX_BASE, [], '2025-06');
    expect(r.lineas[0].importe).toBe(668453.89);
  });

  it('PCT_CONCEPTO aplica el porcentaje sobre el concepto base (Zona 85%)', () => {
    const conceptos = [
      concepto('BASICO', 'FIJO_GLOBAL', { valor: 668453.89 }),
      concepto('ZONA', 'PCT_CONCEPTO', { concepto_codigo: 'BASICO', porcentaje: 0.85 }),
    ];
    const r = ejecutarMotor(conceptos, CTX_BASE, [], '2025-06');
    const zona = r.lineas.find((l) => l.concepto_codigo === 'ZONA')!;
    expect(zona.importe).toBeCloseTo(568185.81, 2);
  });

  it('POR_ANTIGUEDAD_VALOR multiplica por años', () => {
    const r = ejecutarMotor(
      [concepto('ANTIG', 'POR_ANTIGUEDAD_VALOR', { valor_por_anio: 5429 })],
      CTX_BASE,
      [],
      '2025-06'
    );
    expect(r.lineas[0].importe).toBe(5429 * 6);
  });

  it('POR_ANTIGUEDAD_PCT aplica porcentaje por año sobre la base', () => {
    const conceptos = [
      concepto('BASICO', 'FIJO_GLOBAL', { valor: 100000 }),
      concepto('ANTIG', 'POR_ANTIGUEDAD_PCT', { porcentaje_por_anio: 0.01, concepto_base_codigo: 'BASICO' }),
    ];
    const r = ejecutarMotor(conceptos, CTX_BASE, [], '2025-06');
    const antig = r.lineas.find((l) => l.concepto_codigo === 'ANTIG')!;
    expect(antig.importe).toBe(100000 * 0.01 * 6); // 6000
  });

  it('PCT_SUMA_CONCEPTOS suma bases y aplica porcentaje (Presentismo 6%)', () => {
    const conceptos = [
      concepto('A', 'FIJO_GLOBAL', { valor: 1000000 }),
      concepto('B', 'FIJO_GLOBAL', { valor: 904091.27 }),
      concepto('PRES', 'PCT_SUMA_CONCEPTOS', { conceptos_codigos: ['A', 'B'], porcentaje: 0.06 }),
    ];
    const r = ejecutarMotor(conceptos, CTX_BASE, [], '2025-06');
    const pres = r.lineas.find((l) => l.concepto_codigo === 'PRES')!;
    expect(pres.importe).toBeCloseTo(114245.48, 2);
  });

  it('PCT_SUMA_CONCEPTOS respeta el tope imponible', () => {
    const conceptos = [
      concepto('A', 'FIJO_GLOBAL', { valor: 5000000 }),
      concepto('AP', 'PCT_SUMA_CONCEPTOS', { conceptos_codigos: ['A'], porcentaje: 0.11, tope_codigo: 'TOPE_JUB' }),
    ];
    const topes = [{ id: 't1', codigo: 'TOPE_JUB', vigencia_desde: '2025-01', valor: 4045590.45 } as any];
    const r = ejecutarMotor(conceptos, CTX_BASE, topes, '2025-06');
    const ap = r.lineas.find((l) => l.concepto_codigo === 'AP')!;
    expect(ap.importe).toBeCloseTo(4045590.45 * 0.11, 2); // base topeada
  });

  it('POR_UNIDAD por días usa dias_trabajados', () => {
    const c = concepto('PREMIO', 'POR_UNIDAD', { unidad: 'dias' });
    const r = ejecutarMotor([c], { ...CTX_BASE, dias_trabajados: 30 }, [], '2025-06');
    expect(r.lineas[0].importe).toBe(30); // valorUnitario 1 × 30 días
  });

  it('POR_UNIDAD por horas con derivación de un concepto base', () => {
    const conceptos = [
      concepto('BASE', 'FIJO_GLOBAL', { valor: 1800 }),
      concepto('EXTRA', 'POR_UNIDAD', { unidad: 'horas', derivacion: { base: 'BASE', divisor: 180 } }),
    ];
    // valorUnitario = 1800/180 = 10; horas = 12+9+0 = 21 → 210
    const r = ejecutarMotor(conceptos, CTX_BASE, [], '2025-06');
    const extra = r.lineas.find((l) => l.concepto_codigo === 'EXTRA')!;
    expect(extra.importe).toBe(10 * 21);
  });
});

describe('ejecutarMotor — totales por tipo', () => {
  it('agrupa los importes por tipo de concepto', () => {
    const conceptos = [
      concepto('REM', 'FIJO_GLOBAL', { valor: 1000 }, { tipo: 'remunerativo' }),
      concepto('NOREM', 'FIJO_GLOBAL', { valor: 500 }, { tipo: 'no_remunerativo' }),
      concepto('DESC', 'FIJO_GLOBAL', { valor: 110 }, { tipo: 'descuento' }),
    ];
    const r = ejecutarMotor(conceptos, CTX_BASE, [], '2025-06');
    expect(r.total_remunerativo).toBe(1000);
    expect(r.total_no_remunerativo).toBe(500);
    expect(r.total_descuentos).toBe(110);
  });

  it('ignora conceptos inactivos', () => {
    const conceptos = [
      concepto('A', 'FIJO_GLOBAL', { valor: 1000 }),
      concepto('B', 'FIJO_GLOBAL', { valor: 9999 }, { is_active: false }),
    ];
    const r = ejecutarMotor(conceptos, CTX_BASE, [], '2025-06');
    expect(r.total_remunerativo).toBe(1000);
  });
});
