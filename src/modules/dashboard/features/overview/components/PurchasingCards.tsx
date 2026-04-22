import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ShoppingCart, PackageCheck, FileText, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { getDashboardPurchasingCounts } from '@/modules/dashboard/features/overview/actions.server';

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default async function PurchasingCards() {
  const counts = await getDashboardPurchasingCounts();

  const cards = [
    {
      title: 'OC Pendientes de aprobación',
      value: counts.ocPendingApproval,
      icon: ShoppingCart,
      borderColor: 'border-l-yellow-500',
      iconColor: 'text-yellow-500',
      badge: 'yellow' as const,
      href: '/dashboard/purchasing?tab=orders',
    },
    {
      title: 'OC Sin recibir',
      value: counts.ocWithoutReceiving,
      icon: PackageCheck,
      borderColor: 'border-l-blue-500',
      iconColor: 'text-blue-500',
      badge: 'info' as const,
      href: '/dashboard/purchasing?tab=orders',
    },
    {
      title: 'Facturas pendientes',
      value: counts.invoicesPendingPayment,
      icon: FileText,
      borderColor: 'border-l-red-500',
      iconColor: 'text-red-500',
      badge: 'destructive' as const,
      href: '/dashboard/purchasing?tab=invoices',
    },
    {
      title: 'Monto comprometido',
      formattedValue: currencyFormatter.format(counts.committedAmount),
      icon: DollarSign,
      borderColor: 'border-l-green-500',
      iconColor: 'text-green-500',
      href: '/dashboard/purchasing?tab=orders',
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
            {'formattedValue' in card ? (
              <span className="text-lg font-bold">{card.formattedValue}</span>
            ) : (
              <Badge variant={card.badge} className="rounded-full text-lg">
                {card.value}
              </Badge>
            )}
            <Link href={card.href} className="text-xs text-primary hover:underline">
              ver detalle
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PurchasingCardsSkeleton() {
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
