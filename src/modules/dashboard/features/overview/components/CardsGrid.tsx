import { Card, CardContent } from '@/shared/components/ui/card';
import { Users, Truck, FileText, AlertTriangle, CalendarClock } from 'lucide-react';
import {
  getDashboardCounts,
  getNextExpiringDocuments,
  type NextExpiringDoc,
} from '@/modules/dashboard/features/overview/actions.server';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { getSessionPermissions } from '@/shared/lib/permissions';
import { DashboardStatCard, type StatSeverity } from './DashboardStatCard';

function ExpiringDetail({ doc }: { doc: NextExpiringDoc | null }) {
  if (!doc) return null;
  let fecha = doc.validity;
  const parsed = new Date(doc.validity);
  if (!Number.isNaN(parsed.getTime())) {
    fecha = format(parsed, "d 'de' MMM", { locale: es });
  }
  return (
    <span className="flex items-center gap-1.5">
      <CalendarClock className="size-3.5 shrink-0" />
      <span className="truncate">
        <span className="font-medium text-foreground/80">{doc.docType}</span>
        {doc.holder ? ` · ${doc.holder}` : ''} · vence {fecha}
      </span>
    </span>
  );
}

async function CardsGrid() {
  const [counts, next, perms] = await Promise.all([
    getDashboardCounts(),
    getNextExpiringDocuments(),
    getSessionPermissions(),
  ]);
  const canEmployees = perms.has('empleados.view');
  const canEquipment = perms.has('equipos.view');
  const canDocuments = perms.has('documentacion.view');

  const today = format(new Date(), 'yyyy-MM-dd');
  const in30Days = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

  type CardDef = {
    title: string;
    subtitle?: string;
    value: number;
    icon: typeof Users;
    severity: StatSeverity;
    href: string;
    detail?: React.ReactNode;
    muted?: boolean;
  };

  // Orden por severidad (tsk-429): primero los vencidos (críticos),
  // luego los que están por vencer, y por último los totales.
  const cards: Array<CardDef | false> = [
    // --- Críticos: documentación vencida ---
    canDocuments && {
      title: 'Docs Empleados vencidos',
      value: counts.employeesExpired,
      icon: AlertTriangle,
      severity: 'critical',
      href: `/dashboard/document?tab=employees&validity_to=${yesterday}`,
      muted: counts.employeesExpired === 0,
    },
    canDocuments && {
      title: 'Docs Equipos vencidos',
      value: counts.equipmentExpired,
      icon: AlertTriangle,
      severity: 'critical',
      href: `/dashboard/document?tab=equipment&validity_to=${yesterday}`,
      muted: counts.equipmentExpired === 0,
    },
    // --- Advertencia: por vencer (próximos 30 días) ---
    canDocuments && {
      title: 'Docs Empleados por vencer',
      subtitle: 'Próximos 30 días',
      value: counts.employeesExpiring,
      icon: FileText,
      severity: 'warning',
      href: `/dashboard/document?tab=employees&validity_from=${today}&validity_to=${in30Days}`,
      detail: <ExpiringDetail doc={next.employee} />,
      muted: counts.employeesExpiring === 0,
    },
    canDocuments && {
      title: 'Docs Equipos por vencer',
      subtitle: 'Próximos 30 días',
      value: counts.equipmentExpiring,
      icon: FileText,
      severity: 'warning',
      href: `/dashboard/document?tab=equipment&validity_from=${today}&validity_to=${in30Days}`,
      detail: <ExpiringDetail doc={next.equipment} />,
      muted: counts.equipmentExpiring === 0,
    },
    // --- Neutro: totales ---
    canEmployees && {
      title: 'Empleados totales',
      value: counts.totalEmployees,
      icon: Users,
      severity: 'neutral',
      href: '/dashboard/employee',
    },
    canEquipment && {
      title: 'Equipos totales',
      value: counts.totalEquipment,
      icon: Truck,
      severity: 'neutral',
      href: '/dashboard/equipment',
    },
  ];

  const visibleCards = cards.filter(Boolean) as CardDef[];

  if (visibleCards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {visibleCards.map((card) => (
        <DashboardStatCard
          key={card.title}
          title={card.title}
          subtitle={card.subtitle}
          value={card.value}
          icon={card.icon}
          severity={card.severity}
          href={card.href}
          detail={card.detail}
          muted={card.muted}
        />
      ))}
    </div>
  );
}

export function CardsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
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

export default CardsGrid;
