import type {
  ClaseCalculoConceptoEquipo,
  BaseValorEquipo,
} from '@/modules/costos/shared/utils/calcular-conceptos-equipo';
import type { ClaseItemCosto } from '@/modules/costos/shared/utils/calcular-costo-equipo';

export type { ClaseCalculoConceptoEquipo, BaseValorEquipo };

export type ConceptoEquipoInput = {
  nombre: string;
  clase: ClaseItemCosto;
  clase_calculo: ClaseCalculoConceptoEquipo;
  parametros: Record<string, unknown>;
  product_id?: string | null;
  indice_id?: string | null;
  orden?: number;
  is_active?: boolean;
};

export type ConceptoEquipoClient = {
  id: string;
  codigo: string;
  nombre: string;
  clase: ClaseItemCosto;
  clase_calculo: ClaseCalculoConceptoEquipo;
  parametros: Record<string, unknown>;
  /** Texto legible de cómo se calcula, resuelto en el servidor. */
  descripcion_calculo: string;
  product_id: string | null;
  product_code: string | null;
  indice_id: string | null;
  indice_nombre: string | null;
  precio_actualizado_at: Date | null;
  orden: number;
  is_active: boolean;
  /** En cuántos tipos de equipo se usa este concepto. */
  usado_en_tipos: number;
  /**
   * Id de la fila en `concepto_tipo_equipo`. Sólo viene cuando el concepto se lee desde el
   * perfil de un tipo (para poder desasociarlo); en el catálogo general no aplica.
   */
  asociacion_id?: string;
};

/**
 * Concepto leído desde el perfil de un tipo: ahí `asociacion_id` siempre está, así la UI de
 * desasociación no necesita comprobarlo.
 */
export type ConceptoAsociadoClient = ConceptoEquipoClient & { asociacion_id: string };

/** Fila de la tabla de tipos costeados. */
export type TipoCosteadoResumen = {
  type_id: string;
  perfil_id: string;
  nombre: string;
  equipos_count: number;
  accesorios_count: number;
  mantenimiento_count: number;
  /** Total de los conceptos FIJO; los porcentuales se resuelven por equipo. */
  total_fijo_accesorios: number;
  total_fijo_mantenimiento: number;
  /** Cuántos conceptos asociados dependen del equipo (porcentuales o por km). */
  conceptos_variables: number;
};

/** Detalle del perfil de un tipo: sus conceptos asociados. */
export type CostoTipoEquipoDetalle = {
  type_id: string;
  nombre: string;
  perfil_id: string;
  equipos_count: number;
  accesorios: ConceptoAsociadoClient[];
  mantenimiento: ConceptoAsociadoClient[];
  total_fijo_accesorios: number;
  total_fijo_mantenimiento: number;
  conceptos_variables: number;
};
