import type { item_ocp } from '@/generated/prisma/client';

/** Grupos de OCP (Otros Costos de Personal). */
export const GRUPOS_OCP = ['vestimenta', 'epp', 'medicos', 'carnet', 'otros'] as const;
export type GrupoOCP = (typeof GRUPOS_OCP)[number];

export const GRUPO_OCP_LABELS: Record<string, string> = {
  vestimenta: 'Vestimenta',
  epp: 'EPP',
  medicos: 'Médicos',
  carnet: 'Carnet / Licencias',
  otros: 'Otros',
};

export type ItemOCPInput = {
  grupo: string;
  concepto: string;
  costo_anual: number;
  cantidad_personas: number;
};

/** item_ocp client-safe (Decimal → number). */
export type ItemOCPClient = Omit<item_ocp, 'costo_anual' | 'cantidad_personas'> & {
  costo_anual: number;
  cantidad_personas: number;
};

export type ResumenOCPGrupo = {
  grupo: string;
  items: ItemOCPClient[];
  total_anual: number; // Σ costo_anual × cantidad_personas
  provision_mensual: number; // total_anual / 12
};

export type ResumenOCP = {
  servicio_id: string;
  por_grupo: ResumenOCPGrupo[];
  total_ocp: number; // provisión mensual total
};
