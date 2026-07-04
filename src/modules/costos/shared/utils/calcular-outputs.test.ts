import { describe, it, expect } from 'vitest';
import { Decimal } from './decimal';
import { calcularOutput, type ContextoOutput } from './calcular-outputs';
import type { FormulaOutput } from '../types/composicion.types';

function ctx(overrides: Partial<Record<keyof ContextoOutput, number>> = {}): ContextoOutput {
  const base = {
    precio_mensual: 1000,
    total_directo: 100,
    total_con_margenes: 900,
    mod: 40,
    ocp: 10,
    equipos: 40,
    combustible: 10,
  };
  const merged = { ...base, ...overrides };
  return {
    precio_mensual: new Decimal(merged.precio_mensual),
    total_directo: new Decimal(merged.total_directo),
    total_con_margenes: new Decimal(merged.total_con_margenes),
    mod: new Decimal(merged.mod),
    ocp: new Decimal(merged.ocp),
    equipos: new Decimal(merged.equipos),
    combustible: new Decimal(merged.combustible),
  };
}

describe('calcularOutput', () => {
  it('precio_div_kms_x_factor: precio / kms × factor', () => {
    const f: FormulaOutput = { tipo: 'precio_div_kms_x_factor', kms_base: 100, factor: 2 };
    // 1000 / 100 × 2 = 20
    expect(calcularOutput(ctx(), f).valor.toNumber()).toBe(20);
  });

  it('pct_sobre_precio (descuento): precio × (1 − pct)', () => {
    const f: FormulaOutput = { tipo: 'pct_sobre_precio', porcentaje: 0.07, modo: 'descuento' };
    expect(calcularOutput(ctx(), f).valor.toNumber()).toBe(930);
  });

  it('pct_sobre_precio (recargo): precio × (1 + pct)', () => {
    const f: FormulaOutput = { tipo: 'pct_sobre_precio', porcentaje: 0.1, modo: 'recargo' };
    expect(calcularOutput(ctx(), f).valor.toNumber()).toBe(1100);
  });

  it('base_div_divisor: base / divisor (sin factor previo)', () => {
    const f: FormulaOutput = { tipo: 'base_div_divisor', base: 'mod', divisor: 4 };
    // mod 40 / 4 = 10
    expect(calcularOutput(ctx({ mod: 40 }), f).valor.toNumber()).toBe(10);
  });

  it('base_div_divisor: base × factor_previo / divisor', () => {
    const f: FormulaOutput = { tipo: 'base_div_divisor', base: 'precio_mensual', divisor: 2, factor_previo: 0.93 };
    // 1000 × 0.93 / 2 = 465
    expect(calcularOutput(ctx(), f).valor.toNumber()).toBe(465);
  });

  it('precio_ponderado_div_divisor: precio × Σ(proporción × factor) / divisor', () => {
    const f: FormulaOutput = {
      tipo: 'precio_ponderado_div_divisor',
      divisor: 10,
      componentes: [
        { base: 'mod', factor: 1 },
        { base: 'equipos', factor: 0.5 },
      ],
    };
    // prop_mod = 40/100 = 0.4 ; prop_eq = 40/100 = 0.4
    // Σ = 0.4×1 + 0.4×0.5 = 0.6 ; 1000 × 0.6 / 10 = 60
    expect(calcularOutput(ctx({ mod: 40, equipos: 40, total_directo: 100 }), f).valor.toNumber()).toBe(60);
  });

  it('rechaza divisor y kms inválidos', () => {
    expect(() => calcularOutput(ctx(), { tipo: 'precio_div_kms_x_factor', kms_base: 0, factor: 1 })).toThrow();
    expect(() => calcularOutput(ctx(), { tipo: 'base_div_divisor', base: 'mod', divisor: 0 })).toThrow();
  });
});
