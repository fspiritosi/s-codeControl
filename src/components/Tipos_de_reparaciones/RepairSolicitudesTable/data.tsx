import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from '@radix-ui/react-icons';

export const labels = [
  {
    value: 'bug',
    label: 'Bug',
  },
  {
    value: 'feature',
    label: 'Feature',
  },
  {
    value: 'documentation',
    label: 'Documentation',
  },
];

// Pendiente, Esperando repuestos, En reparación, Finalizado, Rechazado, Cancelado

export const statuses = [
  {
    value: 'Pendiente',
    label: 'Pendiente',
    icon: QuestionMarkCircledIcon,
  },
  {
    value: 'Esperando repuestos',
    label: 'Esperando repuestos',
    icon: CircleIcon,
  },
  {
    value: 'En reparación',
    label: 'En reparación',
    icon: StopwatchIcon,
  },
  {
    value: 'Finalizado',
    label: 'Finalizado',
    icon: CheckCircledIcon,
  },
  {
    value: 'Cancelado',
    label: 'Cancelado',
    icon: CrossCircledIcon,
  },
  {
    value: 'Rechazado',
    label: 'Rechazado',
    icon: CrossCircledIcon,
  },
];

export const criticidad = [
  {
    label: 'Baja',
    value: 'Baja',
    icon: ArrowDownIcon,
  },
  {
    label: 'Media',
    value: 'Media',
    icon: ArrowRightIcon,
  },
  {
    label: 'Alta',
    value: 'Alta',
    icon: ArrowUpIcon,
  },
];

import { z } from 'zod';

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  state: z.string(),
  label: z.string(),
  priority: z.string(),
});

export type Task = z.infer<typeof taskSchema>;
