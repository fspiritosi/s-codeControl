import { describe, it, expect } from 'vitest';
import { buildMissingMandatoryDocuments } from './mandatory-documents';

const tipo = (id: string, name: string) => ({ id, name });

describe('buildMissingMandatoryDocuments', () => {
  it('arma una fila pendiente por cada obligatorio que falta', () => {
    const filas = buildMissingMandatoryDocuments({
      mandatoryTypes: [tipo('t1', 'Cedula verde'), tipo('t2', 'Cat')],
      existingTypeIds: [],
      appliesId: 'v1',
      userId: 'u1',
    });

    expect(filas).toEqual([
      { applies: 'v1', id_document_types: 't1', validity: null, user_id: 'u1' },
      { applies: 'v1', id_document_types: 't2', validity: null, user_id: 'u1' },
    ]);
  });

  it('no duplica los que el recurso ya tiene', () => {
    const filas = buildMissingMandatoryDocuments({
      mandatoryTypes: [tipo('t1', 'Cedula verde'), tipo('t2', 'Cat')],
      existingTypeIds: ['t1'],
      appliesId: 'v1',
      userId: 'u1',
    });

    expect(filas.map((f) => f.id_document_types)).toEqual(['t2']);
  });

  it('devuelve vacio cuando la empresa no tiene obligatorios configurados', () => {
    const filas = buildMissingMandatoryDocuments({
      mandatoryTypes: [],
      existingTypeIds: [],
      appliesId: 'v1',
      userId: 'u1',
    });

    expect(filas).toEqual([]);
  });

  // El corazon del tkt: el store arrancaba en {} y el `?.forEach` no iteraba,
  // asi que el alta creaba el recurso sin ningun obligatorio y en silencio.
  // "No pude cargar los tipos" tiene que ser distinguible de "no hay ninguno".
  it('falla si los tipos obligatorios no se pudieron cargar', () => {
    expect(() =>
      buildMissingMandatoryDocuments({
        mandatoryTypes: null,
        existingTypeIds: [],
        appliesId: 'v1',
        userId: 'u1',
      })
    ).toThrow(/obligatorios/i);
  });

  it('tolera que no haya usuario logueado', () => {
    const filas = buildMissingMandatoryDocuments({
      mandatoryTypes: [tipo('t1', 'Cat')],
      existingTypeIds: [],
      appliesId: 'v1',
      userId: undefined,
    });

    expect(filas[0].user_id).toBeUndefined();
  });
});
