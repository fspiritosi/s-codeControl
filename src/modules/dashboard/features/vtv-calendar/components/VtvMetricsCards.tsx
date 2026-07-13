import { AlertTriangle, CalendarClock, CheckCircle2, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import type { VtvMetrics } from '../types';

interface Props {
  metrics: VtvMetrics;
}

export function VtvMetricsCards({ metrics }: Props) {
  const cards = [
    {
      title: 'Sin programar (mes)',
      value: metrics.sinProgramarMes,
      icon: Clock,
      borderColor: 'border-l-amber-500',
      iconColor: 'text-amber-500',
    },
    {
      title: 'Turnos solicitados (mes)',
      value: metrics.solicitadosMes,
      icon: CalendarClock,
      borderColor: 'border-l-blue-500',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Realizadas (mes)',
      value: metrics.realizadasMes,
      icon: CheckCircle2,
      borderColor: 'border-l-green-500',
      iconColor: 'text-green-500',
    },
    {
      title: 'Vencidas sin gestionar',
      value: metrics.vencidasSinGestionar,
      icon: AlertTriangle,
      borderColor: 'border-l-red-500',
      iconColor: 'text-red-500',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className={`border-l-4 ${card.borderColor} min-w-0`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`size-4 shrink-0 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold tabular-nums">{card.value}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
