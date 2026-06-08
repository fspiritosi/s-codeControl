import type { costo_equipo, item_mantenimiento } from '@/generated/prisma/client';

// ─── Inputs (formularios / mutaciones) ────────────────────────────────────────

/** Input para crear/actualizar el costo de un equipo (company_id se infiere del contexto). */
export type CostoEquipoInput = {
  vehicle_id: string;
  valor_compra: number;
  valor_residual_pct: number; // 0.35 = 35%
  anios_amortizacion: number;
  km_anuales: number;
  accesorios: number;
  is_active?: boolean;
};

/** Input para crear/actualizar un ítem de mantenimiento. */
export type ItemMantInput = {
  nombre: string;
  precio_anual: number;
  orden?: number;
  is_active?: boolean;
};

// ─── Tipos client-safe (Decimal → number) ─────────────────────────────────────

export type ItemMantenimientoClient = Omit<item_mantenimiento, 'precio_anual'> & {
  precio_anual: number;
};

export type CostoEquipoClient = Omit<
  costo_equipo,
  'valor_compra' | 'valor_residual_pct' | 'accesorios'
> & {
  valor_compra: number;
  valor_residual_pct: number;
  accesorios: number;
};

// ─── Vistas compuestas ────────────────────────────────────────────────────────

/** Identificación legible de un vehículo (interno + dominio + marca/modelo). */
export type VehiculoResumen = {
  id: string;
  interno: string;
  dominio: string | null;
  marca: string;
  modelo: string;
  anio: string;
};

/** Fila de la tabla principal de equipos. `costo_mensual` con afectación 100%. */
export type VehiculoConCosto = VehiculoResumen & {
  tiene_costo: boolean;
  valor_compra: number | null;
  costo_mensual: number | null;
  items_count: number;
};

/** Detalle de un equipo: costo + ítems + cálculos derivados. */
export type CostoEquipoDetalle = {
  vehiculo: VehiculoResumen;
  costo: CostoEquipoClient;
  items: ItemMantenimientoClient[];
  amortizacion_mensual: number;
  mantenimiento_mensual: number;
  costo_mensual: number;
};
