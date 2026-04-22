import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { AlertCircle, Wrench, CalendarClock, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { getDashboardMaintenanceCounts } from '@/modules/dashboard/features/overview/actions.server';

export default async function MaintenanceCards() {
  const counts = await getDashboardMaintenanceCounts();

  const cards = [
    {
      title: 'Solicitudes pendientes',
      value: counts.pending,
      icon: AlertCircle,
      borderColor: 'border-l-red-500',
      iconColor: 'text-red-500',
      badge: 'destructive' as const,
      href: '/dashboard/maintenance?state=Pendiente',
    },
    {
      title: 'Equipos en reparación',
      value: counts.equipmentInRepair,
      icon: Wrench,
      borderColor: 'border-l-blue-500',
      iconColor: 'text-blue-500',
      badge: 'info' as const,
      href: '/dashboard/maintenance?state=En_reparacion',
    },
    {
      title: 'Solicitudes programadas',
      value: counts.scheduled,
      icon: CalendarClock,
      borderColor: 'border-l-green-500',
      iconColor: 'text-green-500',
      badge: 'default' as const,
      href: '/dashboard/maintenance?state=Programado',
    },
    {
      title: 'Esperando repuestos',
      value: counts.waitingParts,
      icon: PackageSearch,
      borderColor: 'border-l-yellow-500',
      iconColor: 'text-yellow-500',
      badge: 'yellow' as const,
      href: '/dashboard/maintenance?state=Esperando_repuestos',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.title} className={`border-l-4 ${card.borderColor}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`size-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <Badge variant={card.badge} className="rounded-full text-lg">
              {card.value}
            </Badge>
            <Link href={card.href} className="text-xs text-primary hover:underline">
              ver detalle
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function MaintenanceCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-l-4 border-l-muted">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
