import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Building2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { getDashboardSupplierCounts } from '@/modules/dashboard/features/overview/actions.server';

export default async function SupplierCards() {
  const counts = await getDashboardSupplierCounts();

  const cards = [
    {
      title: 'Proveedores activos',
      value: counts.activeSuppliers,
      icon: Building2,
      borderColor: 'border-l-green-500',
      iconColor: 'text-green-500',
      badge: 'success' as const,
      href: '/dashboard/suppliers',
    },
    {
      title: 'Crédito excedido',
      value: counts.creditExceeded,
      icon: CreditCard,
      borderColor: counts.creditExceeded > 0 ? 'border-l-red-500' : 'border-l-muted',
      iconColor: counts.creditExceeded > 0 ? 'text-red-500' : 'text-muted-foreground',
      badge: (counts.creditExceeded > 0 ? 'destructive' : 'secondary') as 'destructive' | 'secondary',
      href: '/dashboard/suppliers',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

export function SupplierCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: 2 }).map((_, i) => (
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
