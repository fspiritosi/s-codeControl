import { describe, it, expect } from 'vitest';
import { validarParametros, derivarCodigo, describirCalculo } from './concepto-equipo';

describe('validarParametros', () => {
  it('acepta FIJO con cantidad y precio', () => {
    expect(() => validarParametros('FIJO', { cantidad: 6, precio_unitario: 860000 })).not.toThrow();
  });

  it('rechaza FIJO sin precio_unitario', () => {
    expect(() => validarParametros('FIJO', { cantidad: 6 })).toThrow();
  });

  it('acepta PCT_VALOR_EQUIPO con pct en fracción y base válida', () => {
    expect(() => validarParametros('PCT_VALOR_EQUIPO', { pct: 0.17, base: 'VALOR_COMPRA' })).not.toThrow();
  });

  it('rechaza una base inexistente', () => {
    expect(() => validarParametros('PCT_VALOR_EQUIPO', { pct: 0.17, base: 'VALOR_INVENTADO' })).toThrow();
  });

  it('rechaza un pct mayor a 1 (se guarda en fracción, no en porcentaje)', () => {
    expect(() => validarParametros('PCT_VALOR_EQUIPO', { pct: 17, base: 'VALOR_COMPRA' })).toThrow();
  });

  it('acepta PCT_SUMA_CONCEPTOS con al menos un código', () => {
    expect(() => validarParametros('PCT_SUMA_CONCEPTOS', { pct: 0.03, conceptos_codigos: ['a'] })).not.toThrow();
  });

  it('rechaza PCT_SUMA_CONCEPTOS con lista vacía', () => {
    expect(() => validarParametros('PCT_SUMA_CONCEPTOS', { pct: 0.03, conceptos_codigos: [] })).toThrow();
  });

  it('acepta POR_KM con monto_por_km', () => {
    expect(() => validarParametros('POR_KM', { monto_por_km: 850 })).not.toThrow();
  });
});

describe('derivarCodigo', () => {
  it('normaliza acentos, mayúsculas y símbolos', () => {
    expect(derivarCodigo('Opticas delanteras 1 juego x año', [])).toBe('opticas_delanteras_1_juego_x_ano');
  });

  it('trunca a 40 caracteres', () => {
    const codigo = derivarCodigo('a'.repeat(60), []);
    expect(codigo.length).toBe(40);
  });

  it('agrega sufijo numérico ante colisión', () => {
    expect(derivarCodigo('Patentes', ['patentes'])).toBe('patentes_2');
    expect(derivarCodigo('Patentes', ['patentes', 'patentes_2'])).toBe('patentes_3');
  });

  it('es determinista: mismo nombre y mismos existentes dan el mismo código', () => {
    expect(derivarCodigo('Seguros', ['x'])).toBe(derivarCodigo('Seguros', ['x']));
  });
});

describe('describirCalculo', () => {
  it('describe un fijo con su importe', () => {
    expect(describirCalculo('FIJO', { cantidad: 6, precio_unitario: 860000 })).toBe('6 × $860.000');
  });

  it('describe un porcentaje del valor de compra', () => {
    expect(describirCalculo('PCT_VALOR_EQUIPO', { pct: 0.17, base: 'VALOR_COMPRA' })).toBe(
      '17% del valor de compra'
    );
  });

  it('describe un porcentaje de otro concepto', () => {
    expect(describirCalculo('PCT_CONCEPTO', { pct: 0.05, concepto_codigo: 'neumaticos' })).toBe(
      '5% de neumaticos'
    );
  });

  it('describe un monto por kilómetro', () => {
    expect(describirCalculo('POR_KM', { monto_por_km: 850 })).toBe('$850 por km');
  });
});
