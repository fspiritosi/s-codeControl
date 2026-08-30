import { Decimal } from './decimal';

type Num = Decimal | string | number;

export type ItemRefrescable = {
  id: string;
  product_id: string | null;
  cantidad: Num;
  precio_unitario: Num;
};

export type RefrescoResultado = {
  actualizados: { id: string; precio_unitario: Decimal }[];
  /** Suma de (precio_nuevo − precio_viejo) × cantidad sobre los ítems que cambian. */
  delta_total: Decimal;
};

/**
 * Decide qué ítems hay que reprecificar contra el catálogo de productos.
 * `precios` mapea product_id → cost_price actual. Un producto ausente del mapa
 * (borrado o inactivo) deja el ítem intacto.
 */
export function resolverRefrescoPrecios(
  items: ItemRefrescable[],
  precios: Map<string, Num>
): RefrescoResultado {
  const actualizados: { id: string; precio_unitario: Decimal }[] = [];
  let delta_total = new Decimal(0);

  for (const item of items) {
    if (!item.product_id) continue;
    const precioNuevoRaw = precios.get(item.product_id);
    if (precioNuevoRaw == null) continue;

    const precioNuevo = new Decimal(precioNuevoRaw);
    const precioViejo = new Decimal(item.precio_unitario);
    if (precioNuevo.eq(precioViejo)) continue;

    actualizados.push({ id: item.id, precio_unitario: precioNuevo });
    delta_total = delta_total.add(precioNuevo.sub(precioViejo).mul(new Decimal(item.cantidad)));
  }

  return { actualizados, delta_total };
}
