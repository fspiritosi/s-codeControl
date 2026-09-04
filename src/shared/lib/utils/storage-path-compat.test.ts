import { describe, it, expect } from 'vitest';
import { formatPathSegment } from './storage-path';

// Implementacion anterior a la correccion del TKT-646, tal cual estaba en
// `formatDocumentTypeName`. Se conserva solo aca para probar que la nueva no
// mueve ninguna ruta que hoy exista en el bucket.
const formatoAnterior = (documentType: string) =>
  documentType
    .toLowerCase()
    .replace(/[\u00e1\u00e4\u00e0\u00e2]/g, 'a')
    .replace(/[\u00e9\u00eb\u00e8\u00ea]/g, 'e')
    .replace(/[\u00ed\u00ef\u00ec\u00ee]/g, 'i')
    .replace(/[\u00f3\u00f6\u00f2\u00f4]/g, 'o')
    .replace(/[\u00fa\u00fc\u00f9\u00fb]/g, 'u')
    .replace(/\u00f1/g, 'n')
    .replace(/['"]/g, '')
    .replace(/\s+/g, '-');

describe('formatPathSegment vs. el formateo anterior', () => {
  // Una ruta que hoy existe en el bucket es, por definicion, ascii: Supabase
  // rechazo con InvalidKey todas las demas. Si para esas entradas la salida
  // coincide, ningun documento ya subido queda inaccesible.
  it('da el mismo resultado para toda entrada ascii', () => {
    const entradas = [
      'Transporte SP',
      'GRUPO HORIZONTE S.A.',
      'AB123CD',
      'ab 123 cd',
      'licencia de conducir (lnc)',
      "o'brien",
      'seguro - poliza n 4520',
      'carnet  con   espacios',
      'equipos',
      'persona',
      'multirecursos',
      'v0',
      '2026-06',
      '11-06-2026',
      'perez_juan/carlos',
      'TANQUE #5 [azul]',
      'serie-(30711588473)',
      '',
      '   ',
      '100%_ok',
    ];

    for (const entrada of entradas) {
      expect(formatPathSegment(entrada), `entrada: ${JSON.stringify(entrada)}`).toBe(formatoAnterior(entrada));
    }
  });

  it('da el mismo resultado para las tildes precompuestas que el formato anterior ya cubria', () => {
    const entradas = [
      'Sebasti\u00e1n L\u00e1zaro',
      'MU\u00d1OZ',
      'Jos\u00e9 Mar\u00eda',
      'P\u00f3liza A\u00fanica',
      'compa\u00f1\u00eda',
    ];

    for (const entrada of entradas) {
      expect(formatPathSegment(entrada), `entrada: ${JSON.stringify(entrada)}`).toBe(formatoAnterior(entrada));
    }
  });

  it('todas las combinaciones ascii imprimibles de dos caracteres coinciden', () => {
    const ascii = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i));
    const diferencias: string[] = [];

    for (const a of ascii) {
      for (const b of ascii) {
        const entrada = a + b;
        if (formatPathSegment(entrada) !== formatoAnterior(entrada)) {
          diferencias.push(JSON.stringify(entrada));
        }
      }
    }

    expect(diferencias).toEqual([]);
  });
});
