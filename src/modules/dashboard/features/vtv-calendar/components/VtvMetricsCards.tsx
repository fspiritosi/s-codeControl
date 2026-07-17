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
      title: 'Sin gestionar (mes)',
      value: metrics.sinGestionarMes,
      icon: Clock,
      borderColor: 'border-l-red-500',
      iconColor: 'text-red-500',
    },
    {
      title: 'Incompletas (mes)',
      value: metrics.incompletasMes,
      icon: CalendarClock,
      borderColor: 'border-l-yellow-500',
      iconColor: 'text-yellow-500',
    },
    {
      title: 'Completas (mes)',
      value: metrics.completasMes,
      icon: CheckCircle2,
      borderColor: 'border-l-green-500',
      iconColor: 'text-green-500',
    },
    {
      title: 'Vencidas sin completar',
      value: metrics.vencidasSinCompletar,
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
