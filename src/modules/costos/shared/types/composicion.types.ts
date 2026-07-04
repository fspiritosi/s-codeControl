import type { composicion_costo, tipo_output_servicio } from '@/generated/prisma/client';
import type { Decimal } from '../utils/decimal';
import type { ResumenMOD } from './mod.types';
import type { ResumenOCP } from './ocp.types';
import type { MargenesServicio } from './servicio.types';

type Num = Decimal | string | number;

// ─── Outputs derivados (fórmulas configurables por servicio) ───────────────────

/**
 * Bases disponibles para las fórmulas de outputs. Referencian magnitudes de la
 * composición ya calculada.
 */
export type BaseComposicion =
  | 'precio_mensual'
  | 'total_directo'
  | 'total_con_margenes'
  | 'mod'
  | 'ocp'
  | 'equipos'
  | 'combustible';

/**
 * Fórmula de un output derivado (unión discriminada, serializable a JSON).
 *
 * Cubre los outputs reales relevados de las planillas PECOM y AESA:
 * - `precio_div_kms_x_factor`: km excedente = precio / kms_base × factor.
 * - `pct_sobre_precio`: descuento/recargo = precio × (1 ∓ porcentaje).
 * - `base_div_divisor`: base × factor_previo / divisor
 *     (día feriado PECOM = precio × 0.93 / 22; hora excedente PECOM = MOD / 341).
 * - `precio_ponderado_div_divisor`: precio × Σ(proporción(base) × factor) / divisor,
 *     donde proporción(base) = base / total_directo (día stand-by AESA).
 */
export type FormulaOutput =
  | { tipo: 'precio_div_kms_x_factor'; kms_base: number; factor: number }
  | { tipo: 'pct_sobre_precio'; porcentaje: number; modo: 'descuento' | 'recargo' }
  | { tipo: 'base_div_divisor'; base: BaseComposicion; divisor: number; factor_previo?: number }
  | {
      tipo: 'precio_ponderado_div_divisor';
      divisor: number;
      componentes: { base: BaseComposicion; factor: number }[];
    };

export const TIPOS_FORMULA_OUTPUT = [
  'precio_div_kms_x_factor',
  'pct_sobre_precio',
  'base_div_divisor',
  'precio_ponderado_div_divisor',
] as const;

/** Input para crear/actualizar un tipo de output configurable de un servicio. */
export type TipoOutputInput = {
  codigo: string;
  nombre: string;
  formula: FormulaOutput;
  orden?: number;
  is_active?: boolean;
};

/** tipo_output_servicio client-safe (formula tipada). */
export type TipoOutputServicioClient = Omit<tipo_output_servicio, 'formula'> & {
  formula: FormulaOutput;
};

/** Configuración mínima de un output usada por el motor. */
export type TipoOutputConfig = {
  id: string;
  codigo: string;
  nombre: string;
  formula: FormulaOutput;
};

/** Output ya calculado sobre una composición concreta. */
export type OutputCalculado = {
  tipo_output_id: string;
  codigo: string;
  nombre: string;
  valor: number;
  detalle_calculo: Record<string, unknown>;
};

// ─── Resúmenes de equipos y combustible por servicio ───────────────────────────

export type ResumenEquiposVehiculo = {
  asignacion_id: string;
  vehicle_id: string;
  interno: string;
  descripcion: string;
  afectacion_pct: number;
  amortizacion_mensual: number;
  mantenimiento_mensual: number;
  /** Costo mensual del equipo ya afectado (amortización + mantenimiento) × afectación. */
  costo_mensual: number;
};

export type ResumenEquipos = {
  servicio_id: string;
  por_vehiculo: ResumenEquiposVehiculo[];
  total_equipos: number;
};

export type ResumenCombustibleVehiculo = {
  vehicle_id: string;
  interno: string;
  litros_mensuales: number;
  precio_gasoil_lt: number;
  litros_urea: number;
  precio_urea_lt: number;
  costo_total: number;
};

export type ResumenCombustible = {
  servicio_id: string;
  periodo: string;
  por_vehiculo: ResumenCombustibleVehiculo[];
  total_combustible: number;
};

// ─── Composición ───────────────────────────────────────────────────────────────

/** Input del motor puro `componerCostos` (subtotales en precisión completa). */
export type ComponerCostosInput = {
  servicio_id: string;
  periodo: string;
  config_cct_id: string;
  subtotales: { mod: Num; ocp: Num; equipos: Num; combustible: Num };
  margenes: MargenesServicio;
  outputs: TipoOutputConfig[];
  resumenMOD?: ResumenMOD;
  resumenOCP?: ResumenOCP;
  resumenEquipos?: ResumenEquipos;
  resumenCombustible?: ResumenCombustible;
};

export type MargenAplicado = {
  /** Porcentaje (0-1). */
  pct: number;
  /** Monto = total_con_margenes × pct (presentación tipo planilla). */
  monto: number;
};

/**
 * Snapshot completo de una composición de costos. Se serializa a `detalle_json`
 * y alimenta tanto la UI de detalle como el PDF.
 */
export type ComposicionDetalle = {
  servicio_id: string;
  periodo: string;
  config_cct_id: string;

  resumenMOD: ResumenMOD | null;
  resumenOCP: ResumenOCP | null;
  resumenEquipos: ResumenEquipos | null;
  resumenCombustible: ResumenCombustible | null;

  subtotales: { mod: number; ocp: number; equipos: number; combustible: number };
  total_costo_directo: number;

  margenes: {
    iibb: MargenAplicado;
    debcred: MargenAplicado;
    estructura: MargenAplicado;
    ganancia: MargenAplicado;
  };
  suma_margenes: number;
  total_con_margenes: number;
  licencia_ordenanza: MargenAplicado;
  precio_mensual: number;

  outputs: OutputCalculado[];
};

// ─── Vistas de listado ─────────────────────────────────────────────────────────

export type ComposicionListItem = {
  id: string;
  servicio_id: string;
  servicio_nombre: string;
  customer_nombre: string;
  periodo: string;
  precio_mensual: number;
  tiene_pdf: boolean;
  created_at: string;
};

/** composicion_costo client-safe (Decimal → number). */
export type ComposicionClient = Omit<
  composicion_costo,
  | 'subtotal_mod'
  | 'subtotal_equipos'
  | 'subtotal_combustible'
  | 'subtotal_ocp'
  | 'total_costo_directo'
  | 'total_con_margenes'
  | 'precio_mensual'
  | 'created_at'
> & {
  subtotal_mod: number;
  subtotal_equipos: number;
  subtotal_combustible: number;
  subtotal_ocp: number;
  total_costo_directo: number;
  total_con_margenes: number;
  precio_mensual: number;
  created_at: string;
};
