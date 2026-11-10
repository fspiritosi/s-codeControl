import { describe, expect, it } from 'vitest';
import {
  buildSupersedeUpdate,
  buildSupersededCloseFields,
  canCreateVersion,
  certificatePathsForAttempts,
  materialPathsSafeToDelete,
  supersededClosureNote,
  versionedTitle,
} from './versioning';

const empty = { effectiveness_method: null, requires_new_actions: null, new_actions_detail: null };

describe('canCreateVersion', () => {
  it('solo una capacitación publicada con intentos se versiona', () => {
    expect(canCreateVersion({ status: 'Publicado', attemptsCount: 1 })).toBe(true);
    expect(canCreateVersion({ status: 'Publicado', attemptsCount: 0 })).toBe(false);
    expect(canCreateVersion({ status: 'Borrador', attemptsCount: 3 })).toBe(false);
    expect(canCreateVersion({ status: 'Cerrada', attemptsCount: 3 })).toBe(false);
  });
});

describe('buildSupersededCloseFields', () => {
  it('completa los campos vacíos', () => {
    expect(buildSupersededCloseFields(empty, 2)).toEqual({
      effectiveness_method: 'Cerrada por cambio de versión',
      requires_new_actions: true,
      new_actions_detail: 'Se emite la versión 2',
    });
  });

  it('trata el texto en blanco como vacío', () => {
    expect(
      buildSupersededCloseFields({ effectiveness_method: '  ', requires_new_actions: null, new_actions_detail: null }, 2)
        .effectiveness_method
    ).toBe('Cerrada por cambio de versión');
  });

  it('no pisa lo cargado a mano', () => {
    const manual = { effectiveness_method: 'Encuesta', requires_new_actions: false, new_actions_detail: null };
    expect(buildSupersededCloseFields(manual, 3)).toEqual(manual);

    const conAcciones = { effectiveness_method: 'Encuesta', requires_new_actions: true, new_actions_detail: 'Charla' };
    expect(buildSupersededCloseFields(conAcciones, 3)).toEqual(conAcciones);
  });

  it('con nuevas acciones en Sí y sin detalle, completa solo el detalle', () => {
    expect(
      buildSupersededCloseFields({ effectiveness_method: 'X', requires_new_actions: true, new_actions_detail: null }, 2)
    ).toEqual({ effectiveness_method: 'X', requires_new_actions: true, new_actions_detail: 'Se emite la versión 2' });
  });
});

describe('buildSupersedeUpdate', () => {
  const now = new Date('2026-11-10T12:00:00Z');

  it('una versión publicada se cierra y queda marcada como reemplazada', () => {
    expect(buildSupersedeUpdate({ status: 'Publicado', close: empty }, 2, now, 'u1')).toEqual({
      status: 'Cerrada',
      closed_at: now,
      closed_by: 'u1',
      superseded_at: now,
      updated_at: now,
      effectiveness_method: 'Cerrada por cambio de versión',
      requires_new_actions: true,
      new_actions_detail: 'Se emite la versión 2',
    });
  });

  it('una versión ya cerrada a mano solo se marca como reemplazada', () => {
    expect(buildSupersedeUpdate({ status: 'Cerrada', close: empty }, 2, now, 'u1')).toEqual({
      superseded_at: now,
      updated_at: now,
    });
  });
});

describe('versionedTitle / supersededClosureNote', () => {
  it('agrega la versión solo si la capacitación está versionada', () => {
    expect(versionedTitle('Difusión', 2, true)).toBe('Difusión (versión 2)');
    expect(versionedTitle('Difusión', 1, true)).toBe('Difusión (versión 1)');
    expect(versionedTitle('Difusión', 1, false)).toBe('Difusión');
  });

  it('arma la nota de cierre por cambio de versión', () => {
    expect(supersededClosureNote(2)).toBe('Cerrada por cambio de versión (reemplazada por la versión 2)');
  });
});

describe('materialPathsSafeToDelete', () => {
  it('excluye los archivos que otra versión sigue usando y deduplica', () => {
    expect(materialPathsSafeToDelete(['a', 'b', 'b', 'c'], ['b'])).toEqual(['a', 'c']);
  });

  it('descarta rutas vacías', () => {
    expect(materialPathsSafeToDelete(['', 'a', '  '], [])).toEqual(['a']);
  });
});

describe('certificatePathsForAttempts', () => {
  it('arma el document_path con que se archiva cada constancia', () => {
    expect(
      certificatePathsForAttempts('c1', [
        { id: 'a1', employee_id: 'e1' },
        { id: 'a2', employee_id: 'e1' },
      ])
    ).toEqual(['capacitaciones/c1/e1/a1.pdf', 'capacitaciones/c1/e1/a2.pdf']);
  });
});
