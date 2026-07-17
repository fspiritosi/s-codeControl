import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Building2, CreditCard } from 'lucide-react';
import { getDashboardSupplierCounts } from '@/modules/dashboard/features/overview/actions.server';
import { DashboardStatCard, type StatSeverity } from './DashboardStatCard';

export default async function SupplierCards() {
  const counts = await getDashboardSupplierCounts();

  const cards: Array<{
    title: string;
    value: number;
    icon: typeof Building2;
    severity: StatSeverity;
    href: string;
    muted?: boolean;
  }> = [
    {
      title: 'Crédito excedido',
      value: counts.creditExceeded,
      icon: CreditCard,
      severity: counts.creditExceeded > 0 ? 'critical' : 'neutral',
      href: '/dashboard/purchasing?tab=suppliers',
      muted: counts.creditExceeded === 0,
    },
    {
      title: 'Proveedores activos',
      value: counts.activeSuppliers,
      icon: Building2,
      severity: 'success',
      href: '/dashboard/purchasing?tab=suppliers',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

export function SupplierCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
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
