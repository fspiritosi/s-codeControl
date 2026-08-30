import { describe, it, expect } from 'vitest';
import { agregarEquipos, type EquipoServicioCalc } from './calcular-equipos-servicio';
import type { ItemCostoTipoCalc } from './calcular-costo-equipo';

describe('agregarEquipos', () => {
  it('costo_mensual = (amortización + mantenimiento) × afectación', () => {
    const equipos: EquipoServicioCalc[] = [
      {
        asignacion_id: 'a1',
        vehicle_id: 'v1',
        interno: '1',
        descripcion: 'Unidad 1',
        afectacion_pct: '1',
        valor_compra: '1200000',
        valor_residual_pct: '0', // sin residual
        anios_amortizacion: 1, // amort mensual = 1.200.000 / 1 / 12 = 100.000
        items_tipo: [{ clase: 'MANTENIMIENTO', cantidad: 1, precio_unitario: '120000' }], // mant mensual = 10.000
      },
    ];
    const { por_vehiculo, total_equipos } = agregarEquipos(equipos);
    // (100.000 + 10.000) × 1 = 110.000
    expect(por_vehiculo[0].costo_mensual.toNumber()).toBe(110000);
    expect(total_equipos.toNumber()).toBe(110000);
  });

  it('aplica la afectación de cada equipo al total (unidad relevo al 50%)', () => {
    const equipos: EquipoServicioCalc[] = [
      {
        asignacion_id: 'a1', vehicle_id: 'v1', interno: '1', descripcion: 'Titular',
        afectacion_pct: '1', valor_compra: '1200000', valor_residual_pct: '0', anios_amortizacion: 1, items_tipo: [],
      },
      {
        asignacion_id: 'a2', vehicle_id: 'v2', interno: '2', descripcion: 'Relevo',
        afectacion_pct: '0.5', valor_compra: '1200000', valor_residual_pct: '0', anios_amortizacion: 1, items_tipo: [],
      },
    ];
    const { total_equipos } = agregarEquipos(equipos);
    // 100.000 + (100.000 × 0.5) = 150.000
    expect(total_equipos.toNumber()).toBe(150000);
  });

  it('dos equipos del mismo tipo comparten la lista de ítems', () => {
    const itemsTipo: ItemCostoTipoCalc[] = [
      { clase: 'ACCESORIO', cantidad: 1, precio_unitario: '200000' },
      { clase: 'MANTENIMIENTO', cantidad: 1, precio_unitario: '120000' },
    ];
    const { por_vehiculo, total_equipos } = agregarEquipos([
      {
        asignacion_id: 'a1', vehicle_id: 'v1', interno: '101', descripcion: 'Uno',
        afectacion_pct: 1, valor_compra: '1000000', valor_residual_pct: '0.35',
        anios_amortizacion: 5, items_tipo: itemsTipo,
      },
      {
        asignacion_id: 'a2', vehicle_id: 'v2', interno: '102', descripcion: 'Dos',
        afectacion_pct: 1, valor_compra: '1000000', valor_residual_pct: '0.35',
        anios_amortizacion: 5, items_tipo: itemsTipo,
      },
    ]);
    // (1.000.000 − 35% + 200.000) / 60 = 14.166,666… ; mantenimiento 120.000 / 12 = 10.000
    expect(por_vehiculo[0].costo_mensual.toDecimalPlaces(2).toNumber()).toBe(24166.67);
    expect(por_vehiculo[0].costo_mensual.eq(por_vehiculo[1].costo_mensual)).toBe(true);
    expect(total_equipos.toDecimalPlaces(2).toNumber()).toBe(48333.33);
  });
});
