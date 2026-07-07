import { describe, it, expect } from 'vitest';
import {
  calcularPeriodoFormula,
  calcularSerieFormula,
  validarPonderaciones,
  type FormulaCalc,
} from './calcular-formula-polinomica';

// ─── Fixture golden PECOM RDLS-BDT 44+1 (formula-polinomica-*.xlsx) ────────────
// PB = costo directo Jun25. Ponderaciones = proporción sobre costo directo.
const FORMULA: FormulaCalc = {
  precio_base: '18924708.03',
  componentes: [
    { id: 'I001', codigo: 'I001', nombre: 'Mano de Obra Directa', ponderacion: '0.3128', valor_indice_base: '5920054.312596719' },
    { id: 'I002', codigo: 'I002', nombre: 'Equipos', ponderacion: '0.5714', valor_indice_base: '10812700.718452381' },
    { id: 'I003', codigo: 'I003', nombre: 'Combustible', ponderacion: '0.0882', valor_indice_base: '1596' },
    { id: 'I004', codigo: 'I004', nombre: 'Otros Costos', ponderacion: '0.0276', valor_indice_base: '522446.75' },
  ],
};

// Índices crudos por período (hojas I001..I004), en orden Jun25 → Feb26.
const INDICES = {
  I001: ['5920054.312596719', '6638687.483628828', '6638687.483628828', '6638687.483628828', '6814939.878132448', '6814939.878132448', '6814939.878132448', '6991181.901427207', '6991181.901427207'],
  I002: ['10812700.718452381', '11120862.688928273', '11465609.432285052', '11888690.42033637', '12017088.276876003', '12208159.980478331', '12501155.82000981', '12709925.122203976', '12834482.388401574'],
  I003: ['1596', '1644', '1728', '1796', '1892', '1944', '1972', '1997', '2026'],
  I004: ['522446.75', '537336.482375', '553993.913328625', '574436.2887304513', '580640.2006487402', '589872.3798390551', '604029.3169551925', '614116.6065483443', '620134.949292518'],
};

const PERIODOS = ['2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02'];

function indicesDe(i: number): Map<string, string> {
  return new Map([
    ['I001', INDICES.I001[i]],
    ['I002', INDICES.I002[i]],
    ['I003', INDICES.I003[i]],
    ['I004', INDICES.I004[i]],
  ]);
}

// Valores ajustados esperados (hoja "Ev. Tarifa" fila 12), redondeados a 2 dec.
const VALOR_AJUSTADO_ESPERADO = [
  18924708.03, 20016565.39, 20465844.05, 20980513.92, 21391765.5,
  21646466.32, 21982922.99, 22404170.04, 22565083.65,
];

describe('validarPonderaciones', () => {
  it('acepta suma 1.0 (±0.0001) y rechaza suma 0.99', () => {
    expect(validarPonderaciones(FORMULA.componentes).valid).toBe(true);
    expect(validarPonderaciones([{ ponderacion: '0.5' }, { ponderacion: '0.49' }]).valid).toBe(false);
    expect(validarPonderaciones([{ ponderacion: '0.5' }, { ponderacion: '0.5001' }]).valid).toBe(true);
  });
});

describe('calcularPeriodoFormula', () => {
  it('golden — PECOM Jul25 → ajuste 5.7695% y valor ajustado $20.016.565,39', () => {
    const calc = calcularPeriodoFormula(FORMULA, '2025-07', indicesDe(1));
    expect(calc.ajuste_porcentual_acumulado).toBe(0.057695); // 5,7695% (6 dec)
    expect(calc.valor_ajustado).toBe(20016565.39);
  });

  it('calcula el retroactivo cuando hay importe certificado', () => {
    const calc = calcularPeriodoFormula(FORMULA, '2025-07', indicesDe(1), '18924708.03');
    // valor_ajustado − certificado
    expect(calc.retroactivo_periodo).toBe(1091857.36);
  });
});

describe('calcularSerieFormula', () => {
  it('golden — serie completa Jun25→Feb26 coincide con la planilla [P-3]', () => {
    const serie = calcularSerieFormula(
      FORMULA,
      PERIODOS.map((periodo, i) => ({ periodo, valoresIndices: indicesDe(i) }))
    );
    serie.forEach((calc, i) => {
      expect(calc.valor_ajustado, `período ${PERIODOS[i]}`).toBe(VALOR_AJUSTADO_ESPERADO[i]);
    });
  });

  it('acumula el retroactivo a lo largo de la serie', () => {
    const serie = calcularSerieFormula(
      FORMULA,
      PERIODOS.map((periodo, i) => ({ periodo, valoresIndices: indicesDe(i), importe_certificado: '18924708.03' }))
    );
    // el retroactivo acumulado del último período = Σ (ajustado − base) de todos
    const esperado = VALOR_AJUSTADO_ESPERADO.reduce((s, v) => s + (v - 18924708.03), 0);
    expect(serie.at(-1)!.retroactivo_acumulado).toBeCloseTo(esperado, 2);
  });
});
