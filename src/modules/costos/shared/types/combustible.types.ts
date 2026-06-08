import type { registro_combustible } from '@/generated/prisma/client';

// ─── Input (formulario / mutación) ────────────────────────────────────────────

/** Input para crear/actualizar un registro mensual de combustible. */
export type RegistroCombustibleInput = {
  id?: string;
  servicio_id: string;
  vehicle_id: string;
  periodo: string; // YYYY-MM
  litros_mensuales: number;
  precio_gasoil_lt: number;
  litros_urea?: number;
  precio_urea_lt?: number;
};

// ─── Tipo client-safe (Decimal → number + costo calculado) ────────────────────

export type RegistroCombustibleClient = Omit<
  registro_combustible,
  'litros_mensuales' | 'precio_gasoil_lt' | 'litros_urea' | 'precio_urea_lt'
> & {
  litros_mensuales: number;
  precio_gasoil_lt: number;
  litros_urea: number;
  precio_urea_lt: number;
  /** Costo total mensual calculado: gasoil + urea. */
  costo_total: number;
  vehiculo?: { interno: string; dominio: string | null };
};
