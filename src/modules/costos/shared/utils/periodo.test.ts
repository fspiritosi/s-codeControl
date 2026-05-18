import { describe, it, expect } from 'vitest';
import {
  parsePeriodo,
  formatPeriodo,
  comparePeriodos,
  nextPeriodo,
  prevPeriodo,
  PeriodoInvalidoError,
} from './periodo';

describe('parsePeriodo', () => {
  it('parsea un período válido', () => {
    expect(parsePeriodo('2026-05')).toEqual({ year: 2026, month: 5 });
  });
  it('parsea enero', () => {
    expect(parsePeriodo('2026-01')).toEqual({ year: 2026, month: 1 });
  });
  it('parsea diciembre', () => {
    expect(parsePeriodo('2026-12')).toEqual({ year: 2026, month: 12 });
  });
  it('rechaza mes 13', () => {
    expect(() => parsePeriodo('2026-13')).toThrow(PeriodoInvalidoError);
  });
  it('rechaza mes 00', () => {
    expect(() => parsePeriodo('2026-00')).toThrow(PeriodoInvalidoError);
  });
  it('rechaza formato sin guión', () => {
    expect(() => parsePeriodo('202604')).toThrow(PeriodoInvalidoError);
  });
  it('rechaza formato con día', () => {
    expect(() => parsePeriodo('2026-04-15')).toThrow(PeriodoInvalidoError);
  });
  it('rechaza string vacío', () => {
    expect(() => parsePeriodo('')).toThrow(PeriodoInvalidoError);
  });
  it('rechaza año de 2 dígitos', () => {
    expect(() => parsePeriodo('26-05')).toThrow(PeriodoInvalidoError);
  });
});

describe('formatPeriodo', () => {
  it('formatea con mes de 2 dígitos', () => {
    expect(formatPeriodo(2026, 5)).toBe('2026-05');
  });
  it('formatea diciembre', () => {
    expect(formatPeriodo(2026, 12)).toBe('2026-12');
  });
});

describe('comparePeriodos', () => {
  it('a < b retorna negativo', () => {
    expect(comparePeriodos('2026-01', '2026-02')).toBeLessThan(0);
  });
  it('a === b retorna 0', () => {
    expect(comparePeriodos('2026-05', '2026-05')).toBe(0);
  });
  it('a > b retorna positivo', () => {
    expect(comparePeriodos('2026-12', '2026-05')).toBeGreaterThan(0);
  });
  it('compara entre años', () => {
    expect(comparePeriodos('2025-12', '2026-01')).toBeLessThan(0);
  });
});

describe('nextPeriodo', () => {
  it('avanza un mes', () => {
    expect(nextPeriodo('2026-05')).toBe('2026-06');
  });
  it('pasa de diciembre a enero del año siguiente', () => {
    expect(nextPeriodo('2026-12')).toBe('2027-01');
  });
});

describe('prevPeriodo', () => {
  it('retrocede un mes', () => {
    expect(prevPeriodo('2026-05')).toBe('2026-04');
  });
  it('pasa de enero al diciembre del año anterior', () => {
    expect(prevPeriodo('2026-01')).toBe('2025-12');
  });
});
