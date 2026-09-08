import { describe, it, expect } from 'vitest';
import { pendingUploadPropsFromRow } from './pending-upload';

const fila = (over: Record<string, unknown> = {}) => ({
  id: 'doc-1',
  applies: 'Persona',
  documentName: 'Carnet de conducir',
  resource: 'Oliveri German Andres',
  expires: true,
  isItMonthly: false,
  ...over,
});

describe('pendingUploadPropsFromRow', () => {
  it('arma los props del dialogo a partir de la fila, sin consultar ningun store', () => {
    expect(pendingUploadPropsFromRow(fila())).toEqual({
      rowId: 'doc-1',
      kind: 'employee',
      documentName: 'Carnet de conducir',
      resourceLabel: 'Oliveri German Andres',
      expires: true,
      monthly: false,
    });
  });

  it('mapea Equipos al kind de equipos', () => {
    expect(pendingUploadPropsFromRow(fila({ applies: 'Equipos' }))?.kind).toBe('equipment');
  });

  // El dialogo de carga solo sabe de empleados y equipos. Devolver null es
  // preferible a caer en 'equipment' por descarte, que es lo que hacia el
  // ternario `applies === 'Persona' ? 'empleado' : 'equipo'` que habia antes.
  it('no soporta documentos de empresa', () => {
    expect(pendingUploadPropsFromRow(fila({ applies: 'Empresa' }))).toBeNull();
  });

  it('devuelve null si la fila no trae id', () => {
    expect(pendingUploadPropsFromRow(fila({ id: null }))).toBeNull();
  });

  it('completa los textos faltantes en vez de mostrar undefined', () => {
    const props = pendingUploadPropsFromRow(fila({ documentName: null, resource: undefined }));

    expect(props?.documentName).toBe('Documento');
    expect(props?.resourceLabel).toBe('');
  });

  it('normaliza a boolean los flags de vencimiento y periodo', () => {
    const props = pendingUploadPropsFromRow(fila({ expires: undefined, isItMonthly: 'Si' }));

    expect(props?.expires).toBe(false);
    expect(props?.monthly).toBe(true);
  });
});
