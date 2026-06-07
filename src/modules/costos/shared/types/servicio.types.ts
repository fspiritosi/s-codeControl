import type { servicio_contrato } from '@/generated/prisma/client';

/** Configuración operativa del servicio para el cálculo de outputs (E-4). */
export type ConfigServicio = {
  km_contratados?: number;
  dias_habiles?: number;
  horas_dia?: number;
  pasajeros?: number;
  [key: string]: number | undefined;
};

export type MargenesServicio = {
  margen_iibb: number;
  margen_debcred: number;
  margen_estructura: number;
  margen_ganancia: number;
  licencia_ordenanza: number;
};

export type CreateServicioInput = {
  customer_id: string;
  config_cct_id: string;
  nombre: string;
  descripcion?: string;
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin?: string;
  config_servicio?: ConfigServicio;
} & Partial<MargenesServicio>;

export type UpdateServicioInput = Partial<CreateServicioInput> & { is_active?: boolean };

export type ServicioListItem = {
  id: string;
  nombre: string;
  customer_nombre: string;
  cct_codigo: string;
  cct_nombre: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  is_active: boolean;
  asignaciones_mod_count: number;
  items_ocp_count: number;
  equipos_count: number;
};

/** servicio_contrato client-safe (Decimal → number). */
export type ServicioClient = Omit<
  servicio_contrato,
  'margen_iibb' | 'margen_debcred' | 'margen_estructura' | 'margen_ganancia' | 'licencia_ordenanza' | 'config_servicio'
> &
  MargenesServicio & { config_servicio: ConfigServicio | null };

export type ServicioDetalle = {
  servicio: ServicioClient;
  customer_nombre: string;
  cct_codigo: string;
  cct_nombre: string;
};
