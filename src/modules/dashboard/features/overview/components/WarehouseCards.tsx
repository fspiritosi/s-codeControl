import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { AlertTriangle, ClipboardList, ArrowUpDown } from 'lucide-react';
import { getDashboardWarehouseCounts } from '@/modules/dashboard/features/overview/actions.server';
import { DashboardStatCard, type StatSeverity } from './DashboardStatCard';

export default async function WarehouseCards() {
  const counts = await getDashboardWarehouseCounts();

  const cards: Array<{
    title: string;
    value: number;
    icon: typeof AlertTriangle;
    severity: StatSeverity;
    href: string;
    muted?: boolean;
  }> = [
    {
      title: 'Productos bajo stock',
      value: counts.productsLowStock,
      icon: AlertTriangle,
      severity: 'critical',
      href: '/dashboard/warehouse?tab=products',
      muted: counts.productsLowStock === 0,
    },
    {
      title: 'ORM pendientes',
      value: counts.ormPending,
      icon: ClipboardList,
      severity: 'warning',
      href: '/dashboard/warehouse?tab=withdrawals',
    },
    {
      title: 'Movimientos del mes',
      value: counts.movementsThisMonth,
      icon: ArrowUpDown,
      severity: 'info',
      href: '/dashboard/warehouse?tab=movements',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

export function WarehouseCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
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
