import { describe, it, expect } from 'vitest';
import { agregarCombustible, type RegistroCombustibleCalc } from './calcular-combustible-servicio';

describe('agregarCombustible', () => {
  it('suma el costo de todos los registros del período', () => {
    const registros: RegistroCombustibleCalc[] = [
      { vehicle_id: 'a', interno: '1', litros_mensuales: '100', precio_gasoil_lt: '10' },
      { vehicle_id: 'b', interno: '2', litros_mensuales: '50', precio_gasoil_lt: '10', litros_urea: '5', precio_urea_lt: '20' },
    ];
    const { total_combustible } = agregarCombustible(registros);
    // 100×10 + (50×10 + 5×20) = 1000 + 600 = 1600
    expect(total_combustible.toNumber()).toBe(1600);
  });

  it('golden — combustible PECOM RDLS-BDT 44+1 → $1.669.506,25', () => {
    // Transcrito de composicion-pecom-*.xls, hoja "Combustible".
    const registros: RegistroCombustibleCalc[] = [
      { vehicle_id: 'niccolo', interno: '112', litros_mensuales: '950', precio_gasoil_lt: '1596', litros_urea: '47.5', precio_urea_lt: '3227.5' },
      { vehicle_id: 'italbus', interno: '86', litros_mensuales: '0', precio_gasoil_lt: '1596', litros_urea: '0', precio_urea_lt: '3227.5' },
    ];
    const { total_combustible } = agregarCombustible(registros);
    expect(total_combustible.toDecimalPlaces(2).toNumber()).toBe(1669506.25);
  });
});
