import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Users, Truck, FileText, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { getDashboardCounts } from '@/modules/dashboard/features/overview/actions.server';
import { format, addMonths } from 'date-fns';
import { Skeleton } from '@/shared/components/ui/skeleton';

async function CardsGrid() {
  const counts = await getDashboardCounts();

  const today = format(new Date(), 'yyyy-MM-dd');
  const in30Days = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

  // Ordenado: Fila 1 = Empleados (Total, Por vencer, Vencidos)
  //           Fila 2 = Equipos   (Total, Por vencer, Vencidos)
  const cards = [
    {
      title: 'Empleados totales',
      value: counts.totalEmployees,
      icon: Users,
      borderColor: 'border-l-primary',
      iconColor: 'text-muted-foreground',
      badge: 'default' as const,
      href: '/dashboard/employee',
    },
    {
      title: 'Docs Empleados por vencer',
      subtitle: 'Próximos 30 días',
      value: counts.employeesExpiring,
      icon: FileText,
      borderColor: 'border-l-yellow-500',
      iconColor: 'text-yellow-500',
      badge: 'yellow' as const,
      href: `/dashboard/document?tab=employees&validity_from=${today}&validity_to=${in30Days}`,
    },
    {
      title: 'Docs Empleados vencidos',
      value: counts.employeesExpired,
      icon: AlertTriangle,
      borderColor: 'border-l-red-500',
      iconColor: 'text-red-500',
      badge: 'destructive' as const,
      href: `/dashboard/document?tab=employees&validity_to=${yesterday}`,
    },
    {
      title: 'Equipos Totales',
      value: counts.totalEquipment,
      icon: Truck,
      borderColor: 'border-l-primary',
      iconColor: 'text-muted-foreground',
      badge: 'default' as const,
      href: '/dashboard/equipment',
    },
    {
      title: 'Docs Equipos por vencer',
      subtitle: 'Próximos 30 días',
      value: counts.equipmentExpiring,
      icon: Truck,
      borderColor: 'border-l-yellow-500',
      iconColor: 'text-yellow-500',
      badge: 'yellow' as const,
      href: `/dashboard/document?tab=equipment&validity_from=${today}&validity_to=${in30Days}`,
    },
    {
      title: 'Docs Equipos vencidos',
      value: counts.equipmentExpired,
      icon: AlertTriangle,
      borderColor: 'border-l-red-500',
      iconColor: 'text-red-500',
      badge: 'destructive' as const,
      href: `/dashboard/document?tab=equipment&validity_to=${yesterday}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {cards.map((card) => (
        <Card key={card.title} className={`border-l-4 ${card.borderColor}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`size-4 ${card.iconColor}`} />
            </div>
            {card.subtitle && <p className="text-xs text-muted-foreground/70">{card.subtitle}</p>}
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <Badge variant={card.badge} className="rounded-full text-lg">{card.value}</Badge>
            <Link href={card.href} className="text-xs text-primary hover:underline">ver detalle</Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CardsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
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

export default CardsGrid;
