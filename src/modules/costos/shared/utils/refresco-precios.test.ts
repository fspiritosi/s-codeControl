import { describe, it, expect } from 'vitest';
import { resolverRefrescoPrecios } from './refresco-precios';

describe('resolverRefrescoPrecios', () => {
  it('actualiza sólo los ítems vinculados cuyo precio cambió', () => {
    const r = resolverRefrescoPrecios(
      [
        { id: 'a', product_id: 'p1', cantidad: '2', precio_unitario: '100' },
        { id: 'b', product_id: 'p2', cantidad: '1', precio_unitario: '500' },
        { id: 'c', product_id: null, cantidad: '1', precio_unitario: '999' },
      ],
      new Map([
        ['p1', '150'], // cambió
        ['p2', '500'], // igual
      ])
    );
    expect(r.actualizados.map((i) => i.id)).toEqual(['a']);
    expect(r.actualizados[0].precio_unitario.toNumber()).toBe(150);
    // delta anual = (150 − 100) × cantidad 2 = 100
    expect(r.delta_total.toNumber()).toBe(100);
  });

  it('ignora los ítems cuyo producto ya no existe', () => {
    const r = resolverRefrescoPrecios(
      [{ id: 'a', product_id: 'borrado', cantidad: '1', precio_unitario: '100' }],
      new Map()
    );
    expect(r.actualizados).toEqual([]);
    expect(r.delta_total.toNumber()).toBe(0);
  });

  it('sin ítems vinculados no hay nada que actualizar', () => {
    const r = resolverRefrescoPrecios(
      [{ id: 'a', product_id: null, cantidad: '1', precio_unitario: '100' }],
      new Map([['p1', '150']])
    );
    expect(r.actualizados).toEqual([]);
    expect(r.delta_total.toNumber()).toBe(0);
  });
});
