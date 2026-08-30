import type { ClaseItemCosto } from '@/modules/costos/shared/utils/calcular-costo-equipo';

export type { ClaseItemCosto };

/** Input para crear/actualizar un ítem de costo de un tipo de equipo. */
export type ItemCostoTipoInput = {
  clase: ClaseItemCosto;
  nombre: string;
  product_id?: string | null;
  cantidad: number;
  precio_unitario: number;
  orden?: number;
  is_active?: boolean;
};

/** Ítem tal como lo consume la UI (Decimal → number, con datos del producto resueltos). */
export type ItemCostoTipoClient = {
  id: string;
  clase: ClaseItemCosto;
  nombre: string;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  cantidad: number;
  precio_unitario: number;
  /** cantidad × precio_unitario, calculado en el servidor. */
  subtotal: number;
  precio_actualizado_at: Date | null;
  orden: number;
  is_active: boolean;
};

/** Fila de la tabla de tipos de equipo. */
export type TipoEquipoResumen = {
  type_id: string;
  nombre: string;
  perfil_id: string | null;
  equipos_count: number;
  accesorios_count: number;
  mantenimiento_count: number;
  total_accesorios: number;
  mantenimiento_anual: number;
};

/** Detalle de un tipo: perfil + sus dos listas de ítems. */
export type CostoTipoEquipoDetalle = {
  type_id: string;
  nombre: string;
  perfil_id: string | null;
  equipos_count: number;
  accesorios: ItemCostoTipoClient[];
  mantenimiento: ItemCostoTipoClient[];
  total_accesorios: number;
  mantenimiento_anual: number;
};
