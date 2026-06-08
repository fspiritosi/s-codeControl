import type { asignacion_mod } from '@/generated/prisma/client';
import type { LineaConcepto } from './cct.types';

/** Inputs estimados mensuales para el cálculo MOD del servicio (no son los reales del recibo). */
export type OverridesCalculo = {
  dias_trabajados?: number;
  hs_nocturnas?: number;
  hs_extras_50?: number;
  hs_extras_100?: number;
  dias_feriado?: number;
  dias_desarraigo?: number;
  [key: string]: number | undefined;
};

export type AsignacionMODInput = {
  employee_id: string;
  categoria_cct_id: string;
  afectacion_pct: number; // 1 = 100%
  antiguedad_anios: number;
  overrides_calculo?: OverridesCalculo;
};

/** asignacion_mod client-safe + datos de empleado/categoría para la tabla. */
export type AsignacionMODConDetalle = Omit<asignacion_mod, 'afectacion_pct' | 'overrides_calculo'> & {
  afectacion_pct: number;
  overrides_calculo: OverridesCalculo | null;
  employee_nombre: string;
  categoria_codigo: string;
  categoria_nombre: string;
};

export type ResumenMODChofer = {
  asignacion_id: string;
  employee_id: string;
  employee_nombre: string;
  categoria_codigo: string;
  antiguedad_anios: number;
  afectacion_pct: number;
  lineas: LineaConcepto[];
  bruto_chofer: number; // antes de afectación
  total_chofer: number; // bruto × afectación
};

export type ResumenMOD = {
  servicio_id: string;
  periodo: string;
  config_cct_id: string;
  por_chofer: ResumenMODChofer[];
  total_mod: number;
};
