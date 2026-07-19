import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';

export type StatSeverity = 'critical' | 'warning' | 'info' | 'success' | 'neutral';

const SEVERITY_STYLES: Record<
  StatSeverity,
  { border: string; bg: string; icon: string; value: string }
> = {
  critical: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/[0.06]',
    icon: 'text-red-500',
    value: 'text-red-600 dark:text-red-400',
  },
  warning: {
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-500/[0.06]',
    icon: 'text-yellow-600 dark:text-yellow-500',
    value: 'text-yellow-700 dark:text-yellow-400',
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/[0.05]',
    icon: 'text-blue-500',
    value: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    border: 'border-l-green-500',
    bg: 'bg-green-500/[0.05]',
    icon: 'text-green-500',
    value: 'text-green-600 dark:text-green-400',
  },
  neutral: {
    border: 'border-l-primary',
    bg: '',
    icon: 'text-muted-foreground',
    value: 'text-foreground',
  },
};

interface DashboardStatCardProps {
  title: string;
  subtitle?: string;
  /** Número o valor ya formateado (ej. moneda). */
  value: React.ReactNode;
  icon: LucideIcon;
  href: string;
  severity?: StatSeverity;
  /** Línea de detalle opcional (ej. próximo documento a vencer). */
  detail?: React.ReactNode;
  /** Atenúa la tarjeta cuando no hay nada que atender (ej. 0 vencidos). */
  muted?: boolean;
}

/**
 * Tarjeta de indicador del dashboard. Toda la tarjeta es un enlace clicable,
 * con fondo/borde según severidad. Reemplaza el molde inline duplicado que
 * existía en cada grid de tarjetas (tsk-427 a tsk-431).
 */
export function DashboardStatCard({
  title,
  subtitle,
  value,
  icon: Icon,
  href,
  severity = 'neutral',
  detail,
  muted = false,
}: DashboardStatCardProps) {
  const s = SEVERITY_STYLES[severity];

  return (
    <Link href={href} className="group block focus:outline-none">
      <Card
        className={cn(
          'h-full border-l-4 transition-all',
          'hover:shadow-md hover:-translate-y-0.5',
          'group-focus-visible:ring-2 group-focus-visible:ring-ring',
          s.border,
          s.bg,
          muted && 'opacity-55'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
              {subtitle && <p className="text-xs text-muted-foreground/70">{subtitle}</p>}
            </div>
            <Icon className={cn('size-4 shrink-0', s.icon)} />
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <span className={cn('text-3xl font-bold leading-none tabular-nums', s.value)}>
              {value}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
          </div>

          {detail && (
            <div className="mt-3 border-t pt-2 text-xs text-muted-foreground">{detail}</div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
