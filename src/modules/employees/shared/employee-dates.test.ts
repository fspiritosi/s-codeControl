// El bug del tkt-648 solo se manifiesta en zonas horarias detras de UTC, que
// es donde estan los usuarios. Se fija la TZ para que el test no dependa de la
// maquina que lo corre.
process.env.TZ = 'America/Argentina/Buenos_Aires';

import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import { parseEmployeeDate } from './employee-dates';

describe('parseEmployeeDate', () => {
  // Caso exacto del tkt-648: la fecha guardada era 2025-12-01 y el legajo
  // mostraba 30/11/2025, porque `new Date('2025-12-01')` es medianoche UTC y
  // date-fns la formatea en hora local (UTC-3).
  it('interpreta un yyyy-MM-dd como dia civil local, no como medianoche UTC', () => {
    const fecha = parseEmployeeDate('2025-12-01');

    expect(format(fecha!, 'dd/MM/yyyy')).toBe('01/12/2025');
  });

  it('devuelve la medianoche local del dia indicado', () => {
    expect(parseEmployeeDate('2025-12-01')?.getTime()).toBe(new Date(2025, 11, 1).getTime());
  });

  it('no corre el dia al ida y vuelta contra la base', () => {
    // Asi lo lee `page.tsx` de una columna @db.Date, y asi lo vuelve a guardar
    // `toISODate`: el dia tiene que sobrevivir el viaje redondo.
    const leidoDeLaBase = '2025-12-01';

    const guardado = parseEmployeeDate(leidoDeLaBase)!.toISOString().split('T')[0];

    expect(guardado).toBe('2025-12-01');
  });

  it('conserva el instante de un ISO completo con zona', () => {
    const fecha = parseEmployeeDate('2025-12-01T15:30:00.000Z');

    expect(fecha?.toISOString()).toBe('2025-12-01T15:30:00.000Z');
  });

  it('devuelve el mismo Date cuando ya viene parseado', () => {
    const original = new Date(2025, 11, 1);

    expect(parseEmployeeDate(original)?.getTime()).toBe(original.getTime());
  });

  it('devuelve null para un Date invalido', () => {
    expect(parseEmployeeDate(new Date('no es fecha'))).toBeNull();
  });

  it('devuelve null para vacios y basura', () => {
    expect(parseEmployeeDate(null)).toBeNull();
    expect(parseEmployeeDate(undefined)).toBeNull();
    expect(parseEmployeeDate('')).toBeNull();
    expect(parseEmployeeDate('cualquier cosa')).toBeNull();
    expect(parseEmployeeDate(42)).toBeNull();
  });
});
