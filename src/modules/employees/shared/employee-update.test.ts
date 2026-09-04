import { describe, expect, it } from 'vitest';
import {
  findMissingRequiredFields,
  REQUIRED_EMPLOYEE_UPDATE_FIELDS,
  toISODate,
} from './employee-update';

/**
 * tkt-631: al cambiar la fecha de ingreso el sistema avisaba "guardado" pero
 * el legajo seguía con la fecha anterior.
 *
 * La cadena era: el Calendar deselecciona al clickear el día ya elegido y
 * emite `onSelect(undefined)` -> `toISODate(undefined)` devuelve `undefined`
 * -> Prisma interpreta `undefined` como "no toques este campo" y lo borra del
 * UPDATE. El resto de los campos se guardaba, el UPDATE devolvía count 1 y la
 * UI mostraba éxito.
 */

describe('toISODate', () => {
  it('convierte la fecha que emite el datepicker', () => {
    const picked = new Date(2020, 0, 10, 0, 0, 0);
    expect(toISODate(picked)).toBe(picked.toISOString());
  });

  it('convierte el string yyyy-MM-dd con el que se carga el legajo', () => {
    expect(toISODate('2025-11-30')).toBe('2025-11-30T00:00:00.000Z');
  });

  it('devuelve undefined si no hay fecha o no se puede parsear', () => {
    expect(toISODate(undefined)).toBeUndefined();
    expect(toISODate(null)).toBeUndefined();
    expect(toISODate('')).toBeUndefined();
    expect(toISODate('no es una fecha')).toBeUndefined();
    expect(toISODate(new Date('invalid'))).toBeUndefined();
  });
});

describe('findMissingRequiredFields', () => {
  const validPayload = () => ({
    lastname: 'Gomez',
    firstname: 'Julio Ariel',
    cuil: '20294541793',
    document_number: '29454179',
    date_of_admission: '2025-11-30T00:00:00.000Z',
    file: '29454179',
    type_of_contract: 'Periodo de prueba',
  });

  it('no reporta nada cuando el payload está completo', () => {
    expect(findMissingRequiredFields(validPayload())).toEqual([]);
  });

  // El caso exacto del tkt-631: la clave llega con undefined y Prisma la
  // descarta, guardando el resto del legajo sin la fecha.
  it('detecta date_of_admission en undefined', () => {
    const payload: Record<string, unknown> = { ...validPayload(), date_of_admission: undefined };
    expect(findMissingRequiredFields(payload)).toEqual(['date_of_admission']);
  });

  // Variante: la clave directamente no viaja en el objeto.
  it('detecta date_of_admission ausente', () => {
    const { date_of_admission, ...payload } = validPayload();
    expect(findMissingRequiredFields(payload)).toEqual(['date_of_admission']);
  });

  it('detecta null y string vacío, que en una columna NOT NULL tampoco sirven', () => {
    expect(findMissingRequiredFields({ ...validPayload(), date_of_admission: null })).toEqual([
      'date_of_admission',
    ]);
    expect(findMissingRequiredFields({ ...validPayload(), lastname: '   ' })).toEqual(['lastname']);
  });

  it('reporta todos los faltantes juntos, en el orden del catálogo', () => {
    expect(findMissingRequiredFields({ cuil: '20294541793' })).toEqual(
      REQUIRED_EMPLOYEE_UPDATE_FIELDS.filter((f) => f !== 'cuil')
    );
  });

  // Un update parcial legítimo (ej: solo la foto) no manda estos campos: el
  // guard es para updateEmployeeByDocNumberFull, que sí es un update completo.
  it('solo mira los campos NOT NULL del catálogo, ignora el resto', () => {
    expect(findMissingRequiredFields({ ...validPayload(), email: undefined })).toEqual([]);
  });
});
