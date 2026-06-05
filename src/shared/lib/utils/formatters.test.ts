import { describe, it, expect } from 'vitest';
import { formatCurrencyARS, formatPercentage } from './formatters';

const NBSP = ' '; // non-breaking space usado por Intl.NumberFormat es-AR

describe('formatCurrencyARS', () => {
  it('formatea 100000', () => {
    expect(formatCurrencyARS(100000)).toBe(`$${NBSP}100.000,00`);
  });
  it('formatea 0', () => {
    expect(formatCurrencyARS(0)).toBe(`$${NBSP}0,00`);
  });
  it('retorna — para null', () => {
    expect(formatCurrencyARS(null)).toBe('—');
  });
  it('retorna — para undefined', () => {
    expect(formatCurrencyARS(undefined)).toBe('—');
  });
  it('retorna — para NaN', () => {
    expect(formatCurrencyARS(NaN)).toBe('—');
  });
  it('formatea número negativo', () => {
    expect(formatCurrencyARS(-500)).toBe(`-$${NBSP}500,00`);
  });
});

describe('formatPercentage', () => {
  it('formatea 0.85 como 85,00%', () => {
    expect(formatPercentage(0.85)).toBe('85,00%');
  });
  it('formatea 1 como 100,00%', () => {
    expect(formatPercentage(1)).toBe('100,00%');
  });
  it('formatea 0 como 0,00%', () => {
    expect(formatPercentage(0)).toBe('0,00%');
  });
  it('retorna — para null', () => {
    expect(formatPercentage(null)).toBe('—');
  });
  it('retorna — para undefined', () => {
    expect(formatPercentage(undefined)).toBe('—');
  });
  it('retorna — para NaN', () => {
    expect(formatPercentage(NaN)).toBe('—');
  });
});
