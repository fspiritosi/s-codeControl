import type { BadgeProps } from '@/shared/components/ui/badge';
import type { VtvStatusKey } from '../types';

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
