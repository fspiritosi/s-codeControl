import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ShoppingCart, PackageCheck, FileText, DollarSign } from 'lucide-react';
import { getDashboardPurchasingCounts } from '@/modules/dashboard/features/overview/actions.server';
import { DashboardStatCard, type StatSeverity } from './DashboardStatCard';

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default async function PurchasingCards() {
  const counts = await getDashboardPurchasingCounts();

  const cards: Array<{
    title: string;
    value: React.ReactNode;
    icon: typeof ShoppingCart;
    severity: StatSeverity;
    href: string;
  }> = [
    {
      title: 'Facturas pendientes',
      value: counts.invoicesPendingPayment,
      icon: FileText,
      severity: 'critical',
      href: '/dashboard/purchasing?tab=invoices',
    },
    {
      title: 'OC Pendientes de aprobación',
      value: counts.ocPendingApproval,
      icon: ShoppingCart,
      severity: 'warning',
      href: '/dashboard/purchasing?tab=orders',
    },
    {
      title: 'OC Sin recibir',
      value: counts.ocWithoutReceiving,
      icon: PackageCheck,
      severity: 'info',
      href: '/dashboard/purchasing?tab=orders',
    },
    {
      title: 'Monto comprometido',
      value: <span className="text-2xl">{currencyFormatter.format(counts.committedAmount)}</span>,
      icon: DollarSign,
      severity: 'success',
      href: '/dashboard/purchasing?tab=orders',
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
        />
      ))}
    </div>
  );
}

export function PurchasingCardsSkeleton() {
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
