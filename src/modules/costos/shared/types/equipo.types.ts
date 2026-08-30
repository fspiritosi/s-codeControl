import type { costo_equipo } from '@/generated/prisma/client';

// ─── Inputs (formularios / mutaciones) ────────────────────────────────────────

/** Input para crear/actualizar el costo de un equipo (company_id se infiere del contexto). */
export type CostoEquipoInput = {
  vehicle_id: string;
  valor_compra: number;
  valor_residual_pct: number; // 0.35 = 35%
  anios_amortizacion: number;
  km_anuales: number;
  is_active?: boolean;
};

// ─── Tipos client-safe (Decimal → number) ─────────────────────────────────────

export type CostoEquipoClient = Omit<costo_equipo, 'valor_compra' | 'valor_residual_pct'> & {
  valor_compra: number;
  valor_residual_pct: number;
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
  /** Accesorios heredados del tipo de equipo. */
  accesorios_total: number | null;
  /** Ítems (accesorios + mantenimiento) que aporta el tipo de equipo. */
  items_count: number;
};

/**
 * Detalle de un equipo: costo + cálculos derivados. Los accesorios y el
 * mantenimiento se heredan del tipo de equipo, no se cargan por unidad.
 */
export type CostoEquipoDetalle = {
  vehiculo: VehiculoResumen;
  costo: CostoEquipoClient;
  tipo: { id: string; nombre: string };
  items_tipo_count: number;
  accesorios_total: number;
  amortizacion_mensual: number;
  mantenimiento_mensual: number;
  costo_mensual: number;
};
