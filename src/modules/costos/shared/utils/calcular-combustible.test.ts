import { describe, it, expect } from 'vitest';
import { calcularCostoCombustible } from './calcular-combustible';

describe('calcularCostoCombustible', () => {
  it('suma gasoil + urea', () => {
    // 100 × 1000 + 10 × 2000 = 120.000
    const r = calcularCostoCombustible({
      litros_mensuales: 100,
      precio_gasoil_lt: 1000,
      litros_urea: 10,
      precio_urea_lt: 2000,
    });
    expect(r.toNumber()).toBe(120000);
  });

  it('funciona sin urea (valores por defecto en 0)', () => {
    const r = calcularCostoCombustible({ litros_mensuales: 50, precio_gasoil_lt: 1500 });
    expect(r.toNumber()).toBe(75000);
  });

  it('golden — IVECO 170S28 NICCOLO (PECOM Jun25) → $1.669.506,25', () => {
    // 950 lts × 1596 + 47,5 lts × 3227,5 = 1.516.200 + 153.306,25
    const r = calcularCostoCombustible({
      litros_mensuales: 950,
      precio_gasoil_lt: 1596,
      litros_urea: 47.5,
      precio_urea_lt: 3227.5,
    });
    expect(r.toDecimalPlaces(2).toNumber()).toBe(1669506.25);
  });
});
