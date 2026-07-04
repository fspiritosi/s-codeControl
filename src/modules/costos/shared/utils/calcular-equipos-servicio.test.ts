import { describe, it, expect } from 'vitest';
import { agregarEquipos, type EquipoServicioCalc } from './calcular-equipos-servicio';

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
        accesorios: '0',
        items: [{ precio_anual: '120000' }], // mant mensual = 10.000
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
        afectacion_pct: '1', valor_compra: '1200000', valor_residual_pct: '0', anios_amortizacion: 1, items: [],
      },
      {
        asignacion_id: 'a2', vehicle_id: 'v2', interno: '2', descripcion: 'Relevo',
        afectacion_pct: '0.5', valor_compra: '1200000', valor_residual_pct: '0', anios_amortizacion: 1, items: [],
      },
    ];
    const { total_equipos } = agregarEquipos(equipos);
    // 100.000 + (100.000 × 0.5) = 150.000
    expect(total_equipos.toNumber()).toBe(150000);
  });
});
