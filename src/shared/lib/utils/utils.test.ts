import { describe, it, expect } from 'vitest';
import { formatDocumentTypeName } from './utils';

// `formatDocumentTypeName` se usa siempre para armar rutas de Supabase
// Storage, asi que delega en `formatPathSegment`. Estos tests fijan las dos
// garantias que importan: normaliza lo que rompe la clave y no altera lo que
// ya es ascii (moverlo dejaria inaccesibles documentos ya subidos).

describe('formatDocumentTypeName', () => {
  it('normaliza las tildes precompuestas', () => {
    expect(formatDocumentTypeName('El\u00edas')).toBe('elias');
  });

  it('normaliza las tildes descompuestas (NFD)', () => {
    expect(formatDocumentTypeName('Eli\u0301as')).toBe('elias');
  });

  it('descarta los simbolos no ascii', () => {
    expect(formatDocumentTypeName('serie 5\u00b0')).toBe('serie-5');
  });

  it('no altera un valor que ya es ascii', () => {
    expect(formatDocumentTypeName('licencia de conducir (lnc)')).toBe('licencia-de-conducir-(lnc)');
  });
});
