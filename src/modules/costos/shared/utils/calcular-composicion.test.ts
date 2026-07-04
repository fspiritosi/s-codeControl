import { describe, it, expect } from 'vitest';
import { componerCostos } from './calcular-composicion';
import type { ComponerCostosInput, TipoOutputConfig } from '../types/composicion.types';

// Márgenes comerciales comunes a ambos servicios (hoja "Resumen" de las planillas).
const MARGENES = {
  margen_debcred: 0.01,
  margen_iibb: 0.03,
  margen_estructura: 0.05,
  margen_ganancia: 0.1,
  licencia_ordenanza: 0.0084, // 8,4 x 1000
};

// ─── Fixture golden PECOM RDLS-BDT ómnibus 44+1 (Jun 2025) ─────────────────────
// Subtotales en precisión completa transcritos de composicion-pecom-*.xls, hoja "Resumen".
const PECOM_OUTPUTS: TipoOutputConfig[] = [
  {
    id: 'km',
    codigo: 'KM_EXCEDENTE',
    nombre: 'Valor unitario por Km excedente',
    formula: { tipo: 'precio_div_kms_x_factor', kms_base: 2500, factor: 0.5 },
  },
  {
    id: 'dia',
    codigo: 'DIA_FERIADO',
    nombre: 'Precio unitario por día feriado / sábado / domingo',
    // día feriado = precio con descuento (×0.93) / 22 días hábiles
    formula: { tipo: 'base_div_divisor', base: 'precio_mensual', factor_previo: 0.93, divisor: 22 },
  },
  {
    id: 'hora',
    codigo: 'HORA_EXCEDENTE',
    nombre: 'Hora excedente 44+1 plazas',
    // hora excedente = MOD / 341
    formula: { tipo: 'base_div_divisor', base: 'mod', divisor: 341 },
  },
  {
    id: 'desc',
    codigo: 'DESCUENTO',
    nombre: 'Valor servicio mensual con descuento',
    formula: { tipo: 'pct_sobre_precio', porcentaje: 0.07, modo: 'descuento' },
  },
];

const PECOM: ComponerCostosInput = {
  servicio_id: 'pecom',
  periodo: '2025-06',
  config_cct_id: 'cct-545-08',
  subtotales: {
    mod: '5920054.312596719',
    ocp: '522446.75',
    equipos: '10812700.718452381',
    combustible: '1669506.25',
  },
  margenes: MARGENES,
  outputs: PECOM_OUTPUTS,
};

// ─── Fixture golden AESA RDLS-CHNS/LM 14+1 10hs (Abr 2026) ─────────────────────
const AESA_OUTPUTS: TipoOutputConfig[] = [
  {
    id: 'km',
    codigo: 'KM_EXCEDENTE',
    nombre: 'Valor unitario por kilómetro excedente',
    formula: { tipo: 'precio_div_kms_x_factor', kms_base: 5800, factor: 0.5145 },
  },
  {
    id: 'standby',
    codigo: 'DIA_STANDBY',
    nombre: 'Valor por día tarifa stand by',
    // (precio / 30) × (prop_MOD + prop_Equipos/2), prop = base / total_directo
    formula: {
      tipo: 'precio_ponderado_div_divisor',
      divisor: 30,
      componentes: [
        { base: 'mod', factor: 1 },
        { base: 'equipos', factor: 0.5 },
      ],
    },
  },
];

const AESA: ComponerCostosInput = {
  servicio_id: 'aesa',
  periodo: '2026-04',
  config_cct_id: 'cct-545-08',
  subtotales: {
    mod: '8527470.211394832',
    ocp: '486939.425',
    equipos: '8878370.261169977',
    combustible: '3942550',
  },
  margenes: MARGENES,
  outputs: AESA_OUTPUTS,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

describe('componerCostos', () => {
  it('golden — PECOM Jun25 → precio mensual $23.560.093,31', () => {
    const r = componerCostos(PECOM);

    expect(r.total_costo_directo).toBe(18924708.03);
    expect(r.suma_margenes).toBe(0.19);
    expect(r.total_con_margenes).toBe(23363837.08);
    expect(r.licencia_ordenanza.monto).toBe(196256.23);
    expect(r.precio_mensual).toBe(23560093.31);
  });

  it('golden — PECOM outputs (km / día feriado / hora excedente / descuento)', () => {
    const r = componerCostos(PECOM);
    const out = (codigo: string) => round2(r.outputs.find((o) => o.codigo === codigo)!.valor);

    expect(out('KM_EXCEDENTE')).toBe(4712.02);
    expect(out('DIA_FERIADO')).toBe(995949.4);
    expect(out('HORA_EXCEDENTE')).toBe(17360.86);
    expect(out('DESCUENTO')).toBe(21910886.78);
  });

  it('golden — AESA Abr26 → precio mensual $27.183.637,86', () => {
    const r = componerCostos(AESA);

    expect(r.total_costo_directo).toBe(21835329.9);
    expect(r.total_con_margenes).toBe(26957197.4);
    expect(r.licencia_ordenanza.monto).toBe(226440.46);
    expect(r.precio_mensual).toBe(27183637.86);
  });

  it('golden — AESA outputs (km excedente / día stand by)', () => {
    const r = componerCostos(AESA);
    const out = (codigo: string) => round2(r.outputs.find((o) => o.codigo === codigo)!.valor);

    expect(out('KM_EXCEDENTE')).toBe(2411.38);
    expect(out('DIA_STANDBY')).toBe(538089.52);
  });

  it('es idempotente: dos llamadas con las mismas fuentes dan el mismo resultado', () => {
    expect(componerCostos(PECOM)).toEqual(componerCostos(PECOM));
  });

  it('rechaza una suma de márgenes ≥ 100%', () => {
    expect(() =>
      componerCostos({
        ...PECOM,
        margenes: { ...MARGENES, margen_ganancia: 0.95 },
      })
    ).toThrow();
  });
});
