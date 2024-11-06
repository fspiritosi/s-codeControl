import {
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from '@radix-ui/react-icons';
import { CalendarDays, ClockIcon } from 'lucide-react';
import { z } from 'zod';

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

export const expiredStatuses = [
  {
    value: 'expired',
    label: 'Expired',
    icon: CrossCircledIcon,
  },
  {
    value: 'expiring',
    label: 'Expiring',
    icon: QuestionMarkCircledIcon,
  },
]


export const statuses = [
  {
    value: 'backlog',
    label: 'Backlog',
    icon: QuestionMarkCircledIcon,
  },
  {
    value: 'todo',
    label: 'Todo',
    icon: CircleIcon,
  },
  {
    value: 'in progress',
    label: 'In Progress',
    icon: StopwatchIcon,
  },
  {
    value: 'done',
    label: 'Done',
    icon: CheckCircledIcon,
  },
  {
    value: 'canceled',
    label: 'Canceled',
    icon: CrossCircledIcon,
  },
];


export const frecuencias = [
  {
    label: 'Semanal',
    value: 'Semanal',
    icon: CalendarDays,
  },
  {
    label: 'Diario',
    value: 'Diario',
    icon: ClockIcon,
  },
];

export const tasks = Array.from({ length: 100 }, () => ({
  id: `TASK-`,
  title: 'Task title',
  status: 'todo',
  label: 'Feature',
  priority: 'medium',
}));

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
});

export type Task = z.infer<typeof taskSchema>;
