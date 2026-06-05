import { describe, it, expect } from 'vitest';
import { toClientNumber, toClientString, parseDecimal, Decimal } from './decimal';

describe('toClientNumber', () => {
  it('convierte Decimal a number', () => {
    expect(toClientNumber(new Decimal('100000.50'))).toBe(100000.5);
  });
  it('convierte string a number', () => {
    expect(toClientNumber('42.5')).toBe(42.5);
  });
  it('convierte number a number', () => {
    expect(toClientNumber(99)).toBe(99);
  });
  it('retorna 0 para null', () => {
    expect(toClientNumber(null)).toBe(0);
  });
  it('retorna 0 para undefined', () => {
    expect(toClientNumber(undefined)).toBe(0);
  });
});

describe('toClientString', () => {
  it('retorna string con precisión completa', () => {
    expect(toClientString(new Decimal('100000.123456'))).toBe('100000.123456');
  });
  it('retorna "0" para null', () => {
    expect(toClientString(null)).toBe('0');
  });
  it('retorna "0" para undefined', () => {
    expect(toClientString(undefined)).toBe('0');
  });
});

describe('parseDecimal', () => {
  it('parsea string numérico', () => {
    expect(parseDecimal('123.45').toNumber()).toBe(123.45);
  });
  it('parsea number', () => {
    expect(parseDecimal(99).toNumber()).toBe(99);
  });
  it('retorna 0 para null', () => {
    expect(parseDecimal(null).toNumber()).toBe(0);
  });
  it('retorna 0 para undefined', () => {
    expect(parseDecimal(undefined).toNumber()).toBe(0);
  });
  it('retorna 0 para string no numérico', () => {
    expect(parseDecimal('abc').toNumber()).toBe(0);
  });
});
