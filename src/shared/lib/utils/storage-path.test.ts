import { describe, it, expect } from 'vitest';
import { calculateNameOFDocument, formatPathSegment } from './storage-path';

// Supabase Storage rechaza con `InvalidKey` cualquier ruta que contenga
// caracteres fuera del rango ASCII imprimible. Este helper es el unico
// lugar donde se sanitiza un segmento de ruta armado con datos cargados
// por el usuario (nombre de empresa, de recurso, serie, tipo de documento).

describe('formatPathSegment', () => {
  it('pasa a minusculas', () => {
    expect(formatPathSegment('Licencia De Conducir')).toBe('licencia-de-conducir');
  });

  it('reemplaza los espacios por guiones', () => {
    expect(formatPathSegment('carnet  de salud')).toBe('carnet-de-salud');
  });

  it('elimina apostrofes y comillas', () => {
    expect(formatPathSegment(`o'brien "juan"`)).toBe('obrien-juan');
  });

  it('convierte las tildes precompuestas a su equivalente ascii', () => {
    expect(formatPathSegment('Sebastián Lázaro')).toBe('sebastian-lazaro');
  });

  it('convierte la ñ a n', () => {
    expect(formatPathSegment('MUÑOZ')).toBe('munoz');
  });

  // Caso real de produccion (handle_errors #1734): el nombre venia en forma
  // NFD, con la "i" y el acento como dos code points separados, por lo que la
  // lista de tildes precompuestas no lo alcanzaba y quedaba "elías" en la ruta.
  it('convierte las tildes descompuestas (NFD) a su equivalente ascii', () => {
    const nfd = 'Munoz Jose Eli\u0301as'; // la tilde de "Elias" como code point aparte
    expect(nfd).not.toBe('Munoz Jose El\u00edas'); // no es la forma precompuesta
    expect(formatPathSegment(nfd)).toBe('munoz-jose-elias');
  });

  it('elimina cualquier otro caracter no ascii que rompa la clave', () => {
    expect(formatPathSegment('tanque 5° cisterna')).toBe('tanque-5-cisterna');
  });

  it('conserva los caracteres ascii que ya se usan en las rutas actuales', () => {
    expect(formatPathSegment('grua-(30711588473)_v2.1')).toBe('grua-(30711588473)_v2.1');
  });

  it('tolera valores vacios o nulos', () => {
    expect(formatPathSegment('')).toBe('');
    expect(formatPathSegment(undefined)).toBe('');
    expect(formatPathSegment(null)).toBe('');
  });

  it('acepta valores no string sin romper', () => {
    expect(formatPathSegment(126 as unknown as string)).toBe('126');
  });
});

describe('calculateNameOFDocument', () => {
  const path = (applies: string, documentName = 'Licencia de conducir') =>
    calculateNameOFDocument('Transporte SP', '30711588473', applies, documentName, 'v0', 'pdf', 'equipos');

  it('arma la ruta con la empresa, el recurso y el tipo de documento', () => {
    expect(path('AB123CD')).toBe(
      'transporte-sp-(30711588473)/equipos/ab123cd/licencia-de-conducir-(v0).pdf'
    );
  });

  it('normaliza las tildes del recurso para no romper la clave de storage', () => {
    expect(path('Grúa Ñandú')).toBe(
      'transporte-sp-(30711588473)/equipos/grua-nandu/licencia-de-conducir-(v0).pdf'
    );
  });

  // Un equipo sin dominio usa la serie, que es texto libre: si trae un simbolo
  // no ascii Supabase responde InvalidKey y la subida se pierde.
  it('descarta los simbolos no ascii de la serie del equipo', () => {
    expect(path('SERIE 5° B')).toBe(
      'transporte-sp-(30711588473)/equipos/serie-5-b/licencia-de-conducir-(v0).pdf'
    );
  });

  it('normaliza tambien el nombre de la empresa y el tipo de documento', () => {
    expect(
      calculateNameOFDocument('Compañía Áurea', '30711588473', 'AB123CD', 'Póliza Anual', 'v0', 'pdf', 'equipos')
    ).toBe('compania-aurea-(30711588473)/equipos/ab123cd/poliza-anual-(v0).pdf');
  });

  // El formateo anterior no tocaba mayusculas ni en la version ni en la
  // extension: cambiarlas moveria la ruta de documentos ya subidos.
  it('conserva las mayusculas de la extension y de la version', () => {
    expect(
      calculateNameOFDocument('Transporte SP', '30711588473', 'AB123CD', 'Seguro', 'V2', 'PDF', 'equipos')
    ).toBe('transporte-sp-(30711588473)/equipos/ab123cd/seguro-(V2).PDF');
  });
});
