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
    value: 'Alta',
    label: 'Alta',
  },
  {
    value: 'Media',
    label: 'Media',
  },
  {
    value: 'Baja',
    label: 'Baja',
  },
];

// Pendiente, Esperando repuestos, En reparación, Finalizado, Rechazado, Cancelado

export const statuses = [
  {
    value: 'Pendiente',
    label: 'Pendiente',
    icon: QuestionMarkCircledIcon,
    color: 'text-gray-600',
  },
  {
    value: 'Esperando repuestos',
    label: 'Esperando repuestos',
    icon: CircleIcon,
    color: 'text-yellow-600',
  },
  {
    value: 'En reparación',
    label: 'En reparación',
    icon: StopwatchIcon,
    color: 'text-blue-600',
  },
  {
    value: 'Finalizado',
    label: 'Finalizado',
    icon: CheckCircledIcon,
    color: 'text-green-600',
  },
  {
    value: 'Cancelado',
    label: 'Cancelado',
    icon: CrossCircledIcon,
    color: 'text-red-600',
  },
  {
    value: 'Rechazado',
    label: 'Rechazado',
    icon: CrossCircledIcon,
    color: 'text-red-400',
  },
  {
    value:'Programado',
    label:'Programado',
    icon: StopwatchIcon,
    color: 'text-blue-600',
  }
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
