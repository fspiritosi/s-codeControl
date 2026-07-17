import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { AlertCircle, Wrench, CalendarClock, PackageSearch } from 'lucide-react';
import { getDashboardMaintenanceCounts } from '@/modules/dashboard/features/overview/actions.server';
import { DashboardStatCard, type StatSeverity } from './DashboardStatCard';

export default async function MaintenanceCards() {
  const counts = await getDashboardMaintenanceCounts();

  const cards: Array<{
    title: string;
    value: number;
    icon: typeof AlertCircle;
    severity: StatSeverity;
    href: string;
    muted?: boolean;
  }> = [
    {
      title: 'Solicitudes pendientes',
      value: counts.pending,
      icon: AlertCircle,
      severity: 'critical',
      href: '/dashboard/maintenance?state=Pendiente',
      muted: counts.pending === 0,
    },
    {
      title: 'Esperando repuestos',
      value: counts.waitingParts,
      icon: PackageSearch,
      severity: 'warning',
      href: '/dashboard/maintenance?state=Esperando_repuestos',
    },
    {
      title: 'Equipos en reparación',
      value: counts.equipmentInRepair,
      icon: Wrench,
      severity: 'info',
      href: '/dashboard/maintenance?state=En_reparacion',
    },
    {
      title: 'Solicitudes programadas',
      value: counts.scheduled,
      icon: CalendarClock,
      severity: 'success',
      href: '/dashboard/maintenance?state=Programado',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <DashboardStatCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          severity={card.severity}
          href={card.href}
          muted={card.muted}
        />
      ))}
    </div>
  );
}

export function MaintenanceCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-l-4 border-l-muted">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-4 rounded" />
            </div>
            <Skeleton className="mt-3 h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
