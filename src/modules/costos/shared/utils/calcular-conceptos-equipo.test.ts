import { describe, it, expect } from 'vitest';
import {
  calcularConceptosEquipo,
  ordenTopologicoConceptos,
  CicloConceptosEquipoError,
  ReferenciaConceptoEquipoInvalidaError,
  type ConceptoEquipoCalc,
  type ContextoEquipo,
} from './calcular-conceptos-equipo';

const CTX: ContextoEquipo = {
  valor_compra: '319325000',
  valor_residual_pct: '0.35',
  km_anuales: 120000,
};

const fijo = (codigo: string, precio: string, cantidad = 1, clase: 'ACCESORIO' | 'MANTENIMIENTO' = 'MANTENIMIENTO'): ConceptoEquipoCalc => ({
  codigo,
  clase,
  clase_calculo: 'FIJO',
  parametros: { cantidad, precio_unitario: precio },
});

describe('calcularConceptosEquipo — clases de cálculo', () => {
  it('FIJO multiplica cantidad por precio unitario', () => {
    const r = calcularConceptosEquipo([fijo('neumaticos', '860000', 6)], CTX);
    expect(r.mantenimiento_anual.toNumber()).toBe(5160000);
  });

  it('PCT_VALOR_EQUIPO sobre VALOR_COMPRA: patentes 17% de 319.325.000', () => {
    const r = calcularConceptosEquipo(
      [{ codigo: 'patentes', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_VALOR_EQUIPO',
         parametros: { pct: '0.17', base: 'VALOR_COMPRA' } }],
      CTX
    );
    expect(r.mantenimiento_anual.toNumber()).toBe(54285250);
  });

  it('PCT_VALOR_EQUIPO sobre VALOR_RESIDUAL usa valor_compra × residual', () => {
    const r = calcularConceptosEquipo(
      [{ codigo: 'x', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_VALOR_EQUIPO',
         parametros: { pct: '0.10', base: 'VALOR_RESIDUAL' } }],
      CTX
    );
    // 319.325.000 × 0,35 = 111.763.750 ; 10% = 11.176.375
    expect(r.mantenimiento_anual.toNumber()).toBe(11176375);
  });

  it('PCT_VALOR_EQUIPO sobre VALOR_COMPRA_MAS_ACCESORIOS suma los accesorios resueltos', () => {
    const r = calcularConceptosEquipo(
      [
        fijo('acc', '4498739', 1, 'ACCESORIO'),
        { codigo: 'seguro', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_VALOR_EQUIPO',
          parametros: { pct: '0.01', base: 'VALOR_COMPRA_MAS_ACCESORIOS' } },
      ],
      CTX
    );
    // (319.325.000 + 4.498.739) × 1% = 3.238.237,39
    expect(r.mantenimiento_anual.toDecimalPlaces(2).toNumber()).toBe(3238237.39);
  });

  it('PCT_CONCEPTO se resuelve después de su base, sin importar el orden de entrada', () => {
    const r = calcularConceptosEquipo(
      [
        { codigo: 'imprevistos', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_CONCEPTO',
          parametros: { pct: '0.05', concepto_codigo: 'neumaticos' } },
        fijo('neumaticos', '5160000'),
      ],
      CTX
    );
    // 5.160.000 + 5% de 5.160.000 = 5.160.000 + 258.000
    expect(r.mantenimiento_anual.toNumber()).toBe(5418000);
    expect(r.por_concepto.get('imprevistos')!.toNumber()).toBe(258000);
  });

  it('PCT_SUMA_CONCEPTOS suma las bases indicadas', () => {
    const r = calcularConceptosEquipo(
      [
        fijo('a', '1000000'),
        fijo('b', '2000000'),
        { codigo: 'admin', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_SUMA_CONCEPTOS',
          parametros: { pct: '0.03', conceptos_codigos: ['a', 'b'] } },
      ],
      CTX
    );
    expect(r.por_concepto.get('admin')!.toNumber()).toBe(90000);
  });

  it('POR_KM multiplica por los km anuales', () => {
    const r = calcularConceptosEquipo(
      [{ codigo: 'comb', clase: 'MANTENIMIENTO', clase_calculo: 'POR_KM',
         parametros: { monto_por_km: '850' } }],
      CTX
    );
    expect(r.mantenimiento_anual.toNumber()).toBe(102000000);
  });

  it('POR_KM con km_anuales en 0 da cero', () => {
    const r = calcularConceptosEquipo(
      [{ codigo: 'comb', clase: 'MANTENIMIENTO', clase_calculo: 'POR_KM',
         parametros: { monto_por_km: '850' } }],
      { ...CTX, km_anuales: 0 }
    );
    expect(r.mantenimiento_anual.toNumber()).toBe(0);
  });

  it('separa accesorios de mantenimiento por la clase del concepto', () => {
    const r = calcularConceptosEquipo(
      [fijo('acc', '200000', 1, 'ACCESORIO'), fijo('mant', '120000')],
      CTX
    );
    expect(r.accesorios.toNumber()).toBe(200000);
    expect(r.mantenimiento_anual.toNumber()).toBe(120000);
  });

  it('un concepto inactivo no se calcula ni sirve de base', () => {
    const r = calcularConceptosEquipo(
      [
        { ...fijo('neumaticos', '5160000'), is_active: false },
        { codigo: 'imprevistos', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_CONCEPTO',
          parametros: { pct: '0.05', concepto_codigo: 'neumaticos' } },
      ],
      CTX
    );
    expect(r.mantenimiento_anual.toNumber()).toBe(0);
  });

  it('dos equipos con distinto valor de compra dan importes distintos con el mismo concepto', () => {
    const concepto: ConceptoEquipoCalc[] = [
      { codigo: 'patentes', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_VALOR_EQUIPO',
        parametros: { pct: '0.17', base: 'VALOR_COMPRA' } },
    ];
    const a = calcularConceptosEquipo(concepto, { ...CTX, valor_compra: '247625000' });
    const b = calcularConceptosEquipo(concepto, { ...CTX, valor_compra: '32000000' });
    expect(a.mantenimiento_anual.toNumber()).toBe(42096250);
    expect(b.mantenimiento_anual.toNumber()).toBe(5440000);
  });
});

describe('ordenTopologicoConceptos — errores', () => {
  it('detecta un ciclo entre dos conceptos', () => {
    const conceptos: ConceptoEquipoCalc[] = [
      { codigo: 'a', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_CONCEPTO',
        parametros: { pct: '0.1', concepto_codigo: 'b' } },
      { codigo: 'b', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_CONCEPTO',
        parametros: { pct: '0.1', concepto_codigo: 'a' } },
    ];
    expect(() => ordenTopologicoConceptos(conceptos)).toThrow(CicloConceptosEquipoError);
  });

  it('rechaza una referencia a un concepto inexistente', () => {
    const conceptos: ConceptoEquipoCalc[] = [
      { codigo: 'a', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_CONCEPTO',
        parametros: { pct: '0.1', concepto_codigo: 'no_existe' } },
    ];
    expect(() => ordenTopologicoConceptos(conceptos)).toThrow(ReferenciaConceptoEquipoInvalidaError);
  });

  it('un ACCESORIO con base VALOR_COMPRA_MAS_ACCESORIOS es un ciclo', () => {
    const conceptos: ConceptoEquipoCalc[] = [
      { codigo: 'acc', clase: 'ACCESORIO', clase_calculo: 'PCT_VALOR_EQUIPO',
        parametros: { pct: '0.1', base: 'VALOR_COMPRA_MAS_ACCESORIOS' } },
    ];
    expect(() => ordenTopologicoConceptos(conceptos)).toThrow(CicloConceptosEquipoError);
  });
});
