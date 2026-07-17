import type { BadgeProps } from '@/shared/components/ui/badge';
import type { VtvIndicators, VtvStatusKey } from '../types';

export const STATUS_META: Record<
  VtvStatusKey,
  { label: string; variant: BadgeProps['variant'] }
> = {
  sin_programar: { label: 'Sin programar', variant: 'outline' },
  pendiente: { label: 'Pendiente', variant: 'red' },
  orden_solicitada: { label: 'Orden solicitada', variant: 'success' },
  realizada: { label: 'Realizada', variant: 'secondary' },
  cancelada: { label: 'Cancelada', variant: 'outline' },
};

// Semáforo derivado de los dos indicadores independientes (tkt-480).
export type VtvSemaphore = 'green' | 'amber' | 'red';

export function deriveSemaphore(i: VtvIndicators): VtvSemaphore {
  if (i.hasOrder && i.hasAppointment) return 'green';
  if (i.hasOrder || i.hasAppointment) return 'amber';
  return 'red';
}

export const SEMAPHORE_META: Record<
  VtvSemaphore,
  { label: string; variant: BadgeProps['variant'] }
> = {
  green: { label: 'Completa', variant: 'success' },
  amber: { label: 'Incompleta', variant: 'yellow' },
  red: { label: 'Sin gestionar', variant: 'red' },
};

// Clave de estado unificada para badges y filtros del listado/calendario:
// los estados terminales (realizada/cancelada) tienen prioridad; en gestión
// el estado es el semáforo derivado de los indicadores.
export type VtvDisplayKey = VtvSemaphore | 'realizada' | 'cancelada';

export function deriveDisplayKey(
  status: VtvStatusKey,
  indicators: VtvIndicators
): VtvDisplayKey {
  if (status === 'realizada') return 'realizada';
  if (status === 'cancelada') return 'cancelada';
  return deriveSemaphore(indicators);
}

export const DISPLAY_META: Record<
  VtvDisplayKey,
  { label: string; variant: BadgeProps['variant'] }
> = {
  green: SEMAPHORE_META.green,
  amber: SEMAPHORE_META.amber,
  red: SEMAPHORE_META.red,
  realizada: STATUS_META.realizada,
  cancelada: STATUS_META.cancelada,
};
