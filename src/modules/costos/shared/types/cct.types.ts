import type {
  config_cct,
  categoria_cct,
  concepto_cct,
  valor_concepto_categoria,
  tope_imponible,
  tipo_concepto_cct,
  ambito_concepto_cct,
  clase_calculo_concepto,
} from '@/generated/prisma/client';

// ─── Re-exports de enums ──────────────────────────────────────────────────────

export type { tipo_concepto_cct, ambito_concepto_cct, clase_calculo_concepto };

// ─── Parámetros por clase de cálculo ─────────────────────────────────────────

export type ParamsFijoGlobal = { valor: number };
export type ParamsFijoPorCategoria = Record<string, never>;
export type ParamsPctConcepto = { concepto_codigo: string; porcentaje: number };
export type ParamsPctSumaConceptos = {
  conceptos_codigos: string[];
  porcentaje: number;
  tope_codigo?: string;
};
export type ParamsPorAntiguedadValor = { valor_por_anio: number };
export type ParamsPorAntiguedadPct = {
  porcentaje_por_anio: number;
  concepto_base_codigo: string;
};
export type ParamsPorUnidad = {
  unidad: 'horas' | 'dias';
  recargo?: number;
  derivacion?: { base: string; divisor: string };
};

export type ParametrosConcepto =
  | ParamsFijoGlobal
  | ParamsFijoPorCategoria
  | ParamsPctConcepto
  | ParamsPctSumaConceptos
  | ParamsPorAntiguedadValor
  | ParamsPorAntiguedadPct
  | ParamsPorUnidad;

// ─── Tipos client-safe (Decimal → number) ────────────────────────────────────

export type ValorConceptoCategoriaClient = Omit<valor_concepto_categoria, 'valor'> & {
  valor: number;
};

export type ConceptoCCTClient = Omit<concepto_cct, 'parametros'> & {
  parametros: ParametrosConcepto;
  valores?: ValorConceptoCategoriaClient[];
};

export type CategoriaCCTClient = categoria_cct & {
  valores?: ValorConceptoCategoriaClient[];
};

export type ConfigCCTClient = Omit<config_cct, never> & {
  categorias?: CategoriaCCTClient[];
  conceptos?: ConceptoCCTClient[];
};

export type TopeImponibleClient = Omit<tope_imponible, 'valor'> & { valor: number };

// ─── Contexto para el motor de cálculo ───────────────────────────────────────

export type ContextoCalculo = {
  categoria_codigo: string;
  antiguedad_anios: number;
  dias_trabajados: number;
  hs_nocturnas: number;
  hs_extras_50: number;
  hs_extras_100: number;
  dias_feriado: number;
  dias_desarraigo: number;
  overrides?: Record<string, number>;
};

// ─── Resultado de un concepto calculado ──────────────────────────────────────

export type LineaConcepto = {
  concepto_codigo: string;
  concepto_nombre: string;
  tipo: tipo_concepto_cct;
  aplica_en: ambito_concepto_cct[];
  importe: number;
};

export type ResultadoMotor = {
  lineas: LineaConcepto[];
  total_remunerativo: number;
  total_no_remunerativo: number;
  total_descuentos: number;
  total_aportes_patronales: number;
  total_provisiones: number;
  total_prevision: number;
  total_ausentismo: number;
};
