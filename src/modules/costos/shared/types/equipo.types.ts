import type { costo_equipo } from '@/generated/prisma/client';
import type { ClaseItemCosto } from '@/modules/costos/shared/utils/calcular-costo-equipo';

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

/** Un concepto del tipo ya resuelto para una unidad concreta, con su importe. */
export type ConceptoResueltoClient = {
  codigo: string;
  nombre: string;
  clase: ClaseItemCosto;
  /** Texto legible de cómo se calcula, resuelto en el servidor. */
  descripcion_calculo: string;
  importe: number;
};

/** Fila de la tabla principal de equipos. `costo_mensual` con afectación 100%. */
export type VehiculoConCosto = VehiculoResumen & {
  tiene_costo: boolean;
  valor_compra: number | null;
  costo_mensual: number | null;
  /** Accesorios heredados del tipo de equipo. */
  accesorios_total: number | null;
  /** Conceptos (accesorios + mantenimiento) que aporta el tipo de equipo. */
  items_count: number;
};
