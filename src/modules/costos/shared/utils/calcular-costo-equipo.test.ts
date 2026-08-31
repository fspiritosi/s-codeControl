import { describe, it, expect } from 'vitest';
import {
  calcularCostoMensualEquipo,
  type CostoEquipoCalcInput,
} from './calcular-costo-equipo';
import type { ConceptoEquipoCalc } from './calcular-conceptos-equipo';
import { calcularAmortizacionMensual } from './calcular-amortizacion';

// ─── Fixture golden: IVECO BUS 170S28 NICCOLO 44+1 (interno 112, PECOM/RDLS-BDT, Jun 2025) ───
// Transcrito de la planilla del cliente (composicion-pecom-*.xls, hoja "Equipos").
// Valor de compra 319.325.000 · residual 35% · 5 años · accesorios 4.498.739.
let seq = 0;
const mant = (precio_unitario: string): ConceptoEquipoCalc => ({
  codigo: `m${seq++}`,
  clase: 'MANTENIMIENTO',
  clase_calculo: 'FIJO',
  parametros: { cantidad: 1, precio_unitario },
});

const PECOM_112 = {
  valor_compra: '319325000',
  valor_residual_pct: '0.35',
  anios_amortizacion: 5,
  km_anuales: 0,
  conceptos: [
    { codigo: 'acc', clase: 'ACCESORIO', clase_calculo: 'FIJO',
      parametros: { cantidad: 1, precio_unitario: '4498739' } } as ConceptoEquipoCalc,
    mant('5428525'),   // Patentes
    mant('1680000'),   // Seguros
    mant('1780000'),   // VTV / Habilitaciones 2 x año
    mant('1952000'),   // Opticas delanteras 1 juego x año
    mant('132060'),    // Lamparas 6 juegos x año
    mant('1390000'),   // Bateria alternativa 1 x año
    mant('1080980'),   // Pernos Punta de Eje 2 juegos x año
    mant('790000'),    // Barra de direccion 1 juegos x año
    mant('850180'),    // Extremos direccion 2 juegos x año
    mant('1128571.4285714286'), // Caja de direccion hidraulica duracion 210.000 km
    mant('1952000'),   // Campanas de frenos delanteros 1 juego x año
    mant('840000'),    // Cintas de frenos delanteros 1 juego x año
    mant('2060000'),   // Campanas de frenos traseros 1 juego x año
    mant('940000'),    // Cintas de frenos traseras 1 juegos x año
    mant('980466'),    // Sensores delanteros ABS
    mant('520715'),    // Sensores traseros ABS
    mant('960000'),    // Amortiguadores delanteros 2 juegos x año
    mant('920000'),    // Amortiguadores traseros 2 juegos x año
    mant('1660000'),   // Kit de Filtros 2 x año
    mant('420926'),    // Aceite Motor 5w 30 sintetico
    mant('422400'),    // Aceite de caja y diferencial 75w 90
    mant('6800000'),   // Parabrisas 2 juegos x año
    mant('213634.2857142857'),  // Kit embreague cada 210.000 km
    mant('4916122'),   // Aire Acondicionado
    mant('576937.2857142857'),  // Calefaccion cada 210.000 km
    mant('5160000'),   // Neumáticos 6 x año
    mant('920400'),    // Crucetas + centro de cardan
    mant('1380000'),   // Bolilleros de masas de rueda 2 x año
    mant('1371428.5714285714'), // Inyectores cada 210.000 km
    mant('220000'),    // Mantenimiento Filtro de Particulas 2 x año
    mant('580000'),    // Tapiceria en General
    mant('1100000'),   // Alternador 1 cada dos años
  ],
};

describe('calcularCostoMensualEquipo', () => {
  it('golden — IVECO 170S28 interno 112 (PECOM) → $7.794.945,28', () => {
    const r = calcularCostoMensualEquipo({ ...PECOM_112, afectacion_pct: 1 });
    expect(r.costo_mensual.toDecimalPlaces(2).toNumber()).toBe(7794945.28);
  });

  it('golden — desglose: accesorios, amortización y mantenimiento', () => {
    const r = calcularCostoMensualEquipo({ ...PECOM_112, afectacion_pct: 1 });
    expect(r.accesorios_total.toNumber()).toBe(4498739);
    expect(r.amortizacion_mensual.toDecimalPlaces(2).toNumber()).toBe(3534333.15);
    expect(r.mantenimiento_mensual.toDecimalPlaces(2).toNumber()).toBe(4260612.13);
  });

  it('un accesorio impacta la base amortizable y no el mantenimiento', () => {
    const sinAccesorio = calcularCostoMensualEquipo({
      valor_compra: '1000000',
      valor_residual_pct: '0.35',
      anios_amortizacion: 5,
      km_anuales: 0,
      conceptos: [],
    });
    const conAccesorio = calcularCostoMensualEquipo({
      valor_compra: '1000000',
      valor_residual_pct: '0.35',
      anios_amortizacion: 5,
      km_anuales: 0,
      conceptos: [
        { codigo: 'acc', clase: 'ACCESORIO', clase_calculo: 'FIJO',
          parametros: { cantidad: 2, precio_unitario: '100000' } },
      ],
    });
    // (1.000.000 − 35%) / 60 = 10.833,33 ; con 200.000 de accesorios: 850.000 / 60 = 14.166,67
    expect(sinAccesorio.amortizacion_mensual.toDecimalPlaces(2).toNumber()).toBe(10833.33);
    expect(conAccesorio.amortizacion_mensual.toDecimalPlaces(2).toNumber()).toBe(14166.67);
    expect(conAccesorio.mantenimiento_mensual.toNumber()).toBe(0);
  });

  it('sin conceptos del tipo, amortiza igual con accesorios y mantenimiento en cero', () => {
    const r = calcularCostoMensualEquipo({
      valor_compra: '1000000',
      valor_residual_pct: '0.35',
      anios_amortizacion: 5,
      km_anuales: 0,
      conceptos: [],
    });
    expect(r.accesorios_total.toNumber()).toBe(0);
    expect(r.mantenimiento_mensual.toNumber()).toBe(0);
    expect(r.costo_mensual.toDecimalPlaces(2).toNumber()).toBe(10833.33);
  });

  it('la afectación escala linealmente el costo mensual', () => {
    const full = calcularCostoMensualEquipo({ ...PECOM_112, afectacion_pct: 1 }).costo_mensual;
    const half = calcularCostoMensualEquipo({ ...PECOM_112, afectacion_pct: '0.5' }).costo_mensual;
    expect(half.toDecimalPlaces(6).toNumber()).toBe(full.div(2).toDecimalPlaces(6).toNumber());
  });

  it('un concepto porcentual da distinto importe según el valor de compra de la unidad', () => {
    const conceptos: ConceptoEquipoCalc[] = [
      { codigo: 'patentes', clase: 'MANTENIMIENTO', clase_calculo: 'PCT_VALOR_EQUIPO',
        parametros: { pct: '0.17', base: 'VALOR_COMPRA' } },
    ];
    const caro = calcularCostoMensualEquipo({
      valor_compra: '247625000', valor_residual_pct: '0.35', anios_amortizacion: 5,
      km_anuales: 0, conceptos,
    });
    const barato = calcularCostoMensualEquipo({
      valor_compra: '32000000', valor_residual_pct: '0.35', anios_amortizacion: 5,
      km_anuales: 0, conceptos,
    });
    // 17% de cada valor de compra, prorrateado a mes
    expect(caro.mantenimiento_mensual.toDecimalPlaces(2).toNumber()).toBe(3508020.83);
    expect(barato.mantenimiento_mensual.toDecimalPlaces(2).toNumber()).toBe(453333.33);
  });
});

describe('calcularAmortizacionMensual', () => {
  it('aplica residual y prorratea por años y meses', () => {
    // (1.000.000 − 35%) / 5 / 12 = 650.000 / 60 = 10.833,33…
    const r = calcularAmortizacionMensual('1000000', '0.35', 5);
    expect(r.toDecimalPlaces(2).toNumber()).toBe(10833.33);
  });

  it('suma accesorios a la base amortizable', () => {
    // (1.000.000 − 35% + 200.000) / 60 = 850.000 / 60 = 14.166,67
    const r = calcularAmortizacionMensual('1000000', '0.35', 5, '200000');
    expect(r.toDecimalPlaces(2).toNumber()).toBe(14166.67);
  });

  it('retorna 0 si los años son 0', () => {
    expect(calcularAmortizacionMensual('1000000', '0.35', 0).toNumber()).toBe(0);
  });
});
