import { describe, it, expect } from 'vitest';
import { calcularAmortizacionMensual } from './calcular-amortizacion';
import {
  calcularMantenimientoMensual,
  calcularCostoMensualEquipo,
  type ItemMantCalc,
} from './calcular-mantenimiento';

// ─── Fixture golden: IVECO BUS 170S28 NICCOLO 44+1 (interno 112, PECOM/RDLS-BDT, Jun 2025) ───
// Transcrito de la planilla del cliente (composicion-pecom-*.xls, hoja "Equipos").
// Valor de compra 319.325.000 · residual 35% · 5 años · accesorios 4.498.739.
const PECOM_112 = {
  valor_compra: '319325000',
  valor_residual_pct: '0.35',
  anios_amortizacion: 5,
  accesorios: '4498739',
  items: [
    { nombre: 'Patentes', precio_anual: '5428525' },
    { nombre: 'Seguros', precio_anual: '1680000' },
    { nombre: 'VTV / Habilitaciones 2 x año', precio_anual: '1780000' },
    { nombre: 'Opticas delanteras 1 juego x año', precio_anual: '1952000' },
    { nombre: 'Lamparas 6 juegos x año', precio_anual: '132060' },
    { nombre: 'Bateria alternativa 1 x año', precio_anual: '1390000' },
    { nombre: 'Pernos Punta de Eje 2 juegos x año', precio_anual: '1080980' },
    { nombre: 'Barra de direccion 1 juegos x año', precio_anual: '790000' },
    { nombre: 'Extremos direccion 2 juegos x año', precio_anual: '850180' },
    { nombre: 'Caja de direccion hidraulica duracion 210.000 km', precio_anual: '1128571.4285714286' },
    { nombre: 'Campanas de frenos delanteros 1 juego x año', precio_anual: '1952000' },
    { nombre: 'Cintas de frenos delanteros 1 juego x año', precio_anual: '840000' },
    { nombre: 'Campanas de frenos traseros 1 juego x año', precio_anual: '2060000' },
    { nombre: 'Cintas de frenos traseras 1 juegos x año', precio_anual: '940000' },
    { nombre: 'Sensores delanteros ABS Control de traccion 1 x año', precio_anual: '980466' },
    { nombre: 'Sensores traseros ABS Control de traccion 1 x año', precio_anual: '520715' },
    { nombre: 'Amortiguadores delanteros 2 juegos x año', precio_anual: '960000' },
    { nombre: 'Amortiguadores traseros 2 juegos x año', precio_anual: '920000' },
    { nombre: 'Kit de Filtros 2 x año', precio_anual: '1660000' },
    { nombre: 'Aceite Motor 5w 30 sintetico 36,1 Lts x año', precio_anual: '420926' },
    { nombre: 'Aceite de caja y diferencial 75w 90 32 Ltrs x año', precio_anual: '422400' },
    { nombre: 'Parabrisas 2 juegos x año', precio_anual: '6800000' },
    { nombre: 'Kit embreague cada 210.000 km', precio_anual: '213634.2857142857' },
    { nombre: 'Aire Acondicionado compresores/condensador/gas x año', precio_anual: '4916122' },
    { nombre: 'Calefaccion delantera y trasera cada 210.000 km', precio_anual: '576937.2857142857' },
    { nombre: 'Neumáticos 1 juego cada 30.000 km 6 neumat x año', precio_anual: '5160000' },
    { nombre: 'Crucetas 2 x año mas centro de cardan 2 x año', precio_anual: '920400' },
    { nombre: 'Bolilleros de masas de rueda 2 x año', precio_anual: '1380000' },
    { nombre: 'Inyectores 1 juego (6) cada 210.000 km', precio_anual: '1371428.5714285714' },
    { nombre: 'Mantenimiento Filtro de Particulas 2 x año', precio_anual: '220000' },
    { nombre: 'Tapiceria en General (cortinas, tapizados, fundas)', precio_anual: '580000' },
    { nombre: 'Alternador 1 cada dos años', precio_anual: '1100000' },
  ],
};

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

describe('calcularMantenimientoMensual', () => {
  it('suma precios anuales activos y divide por 12', () => {
    const items: ItemMantCalc[] = [
      { precio_anual: '120000' },
      { precio_anual: '60000' },
    ];
    expect(calcularMantenimientoMensual(items).toNumber()).toBe(15000); // 180000/12
  });

  it('excluye ítems inactivos', () => {
    const items: ItemMantCalc[] = [
      { precio_anual: '120000', is_active: true },
      { precio_anual: '999999', is_active: false },
    ];
    expect(calcularMantenimientoMensual(items).toNumber()).toBe(10000); // 120000/12
  });

  it('suma anual del fixture PECOM 112 = 51.127.345,571…', () => {
    const anual = calcularMantenimientoMensual(PECOM_112.items).mul(12);
    expect(anual.toDecimalPlaces(4).toNumber()).toBe(51127345.5714);
  });
});

describe('golden — costo mensual de equipo (planilla Transporte SP)', () => {
  it('IVECO 170S28 interno 112 (PECOM) → $7.794.945,28', () => {
    const { costo_mensual } = calcularCostoMensualEquipo({
      valor_compra: PECOM_112.valor_compra,
      valor_residual_pct: PECOM_112.valor_residual_pct,
      anios_amortizacion: PECOM_112.anios_amortizacion,
      accesorios: PECOM_112.accesorios,
      items: PECOM_112.items,
      afectacion_pct: 1,
    });
    expect(costo_mensual.toDecimalPlaces(2).toNumber()).toBe(7794945.28);
  });

  it('afectación 50% reduce el costo a la mitad', () => {
    const full = calcularCostoMensualEquipo({
      ...PECOM_112,
      afectacion_pct: 1,
    }).costo_mensual;
    const half = calcularCostoMensualEquipo({
      ...PECOM_112,
      afectacion_pct: '0.5',
    }).costo_mensual;
    expect(half.toDecimalPlaces(6).toNumber()).toBe(
      full.div(2).toDecimalPlaces(6).toNumber()
    );
  });
});
