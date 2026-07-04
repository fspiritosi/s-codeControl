import type {
  componente_formula,
  formula_polinomica,
  tipo_indice_polinomico,
} from '@/generated/prisma/client';

export const TIPOS_INDICE = ['cct', 'ipim_34', 'gasoil_g3', 'ipim_ng', 'custom'] as const;
export type TipoIndice = tipo_indice_polinomico;

export const TIPO_INDICE_LABELS: Record<TipoIndice, string> = {
  cct: 'CCT (paritaria)',
  ipim_34: 'IPIM 34 (automotores)',
  gasoil_g3: 'Gasoil Grado 3',
  ipim_ng: 'IPIM Nivel General',
  custom: 'Personalizado',
};

// ─── Inputs (formularios / mutaciones) ────────────────────────────────────────

export type ComponenteInput = {
  codigo: string;
  nombre: string;
  tipo_indice: TipoIndice;
  ponderacion: number; // 0-1
  valor_indice_base: number;
  fuente_indice?: string;
};

export type CreateFormulaInput = {
  descripcion?: string;
  fecha_base: string; // YYYY-MM
  precio_base: number;
  componentes?: ComponenteInput[];
};

export type UpdateFormulaInput = {
  descripcion?: string;
  fecha_base?: string;
  precio_base?: number;
};

/** Índices cargados para un período: { componente_id → valor_indice }. */
export type ValoresIndicesInput = Record<string, number>;

// ─── Tipos client-safe (Decimal → number) ─────────────────────────────────────

export type ComponenteFormulaClient = Omit<componente_formula, 'ponderacion' | 'valor_indice_base'> & {
  ponderacion: number;
  valor_indice_base: number;
};

export type FormulaClient = Omit<formula_polinomica, 'precio_base'> & { precio_base: number };

export type FormulaConDetalle = {
  formula: FormulaClient;
  componentes: ComponenteFormulaClient[];
  servicio_nombre: string;
  customer_nombre: string;
};

/** Fila de la lista de fórmulas (una por servicio). */
export type FormulaListItem = {
  servicio_id: string;
  servicio_nombre: string;
  customer_nombre: string;
  formula_id: string | null;
  tiene_formula: boolean;
  componentes_count: number;
  periodos_count: number;
  ponderacion_valida: boolean;
};

// ─── Motor ────────────────────────────────────────────────────────────────────

export type VariacionComponente = {
  componente_id: string;
  codigo: string;
  nombre: string;
  valor_indice: number;
  variacion_pct: number; // acumulada desde la base: I_t/I_base − 1
  contribucion_pct: number; // ponderacion × variacion
};

export type CalculoPeriodoPolinomico = {
  periodo: string;
  variaciones: VariacionComponente[];
  ajuste_porcentual_acumulado: number;
  ajuste_monto: number;
  valor_ajustado: number;
  importe_certificado?: number;
  retroactivo_periodo?: number;
  retroactivo_acumulado?: number;
};

export type PeriodoConValores = {
  id: string;
  periodo: string;
  ajuste_porcentual_acumulado: number;
  ajuste_monto: number;
  valor_ajustado: number;
  importe_certificado: number | null;
  retroactivo_acumulado: number | null;
  valores: {
    componente_id: string;
    codigo: string;
    valor_indice: number;
    variacion_pct: number;
    contribucion_pct: number;
  }[];
};
