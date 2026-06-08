import { cn } from '@/shared/lib/utils';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { PAYMENT_ORDER_STATUS_LABELS } from '../../../shared/validators';

interface StatusTotal {
  status: string;
  total: number;
  count: number;
}

interface Props {
  byStatus: StatusTotal[];
  grandTotal: number;
  grandCount: number;
}

// Orden lógico del flujo de una OP y color del punto indicador por estado.
const STATUS_ORDER = ['DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED'] as const;
const STATUS_DOT: Record<string, string> = {
  DRAFT: 'bg-muted-foreground',
  CONFIRMED: 'bg-blue-500',
  PAID: 'bg-emerald-500',
  CANCELLED: 'bg-destructive',
};

function ordersLabel(count: number) {
  return count === 1 ? '1 orden' : `${count} órdenes`;
}

/**
 * Panel de sumatoria de órdenes de pago desglosado por estado + total general.
 * Los montos respetan los filtros activos de la tabla (se calculan server-side).
 */
export function PaymentOrderTotals({ byStatus, grandTotal, grandCount }: Props) {
  const ordered = [...byStatus].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status as any) - STATUS_ORDER.indexOf(b.status as any)
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {ordered.map((s) => (
        <div key={s.status} className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2">
            <span
              className={cn('size-2 shrink-0 rounded-full', STATUS_DOT[s.status] ?? 'bg-muted-foreground')}
            />
            <span className="truncate text-xs font-medium text-muted-foreground">
              {PAYMENT_ORDER_STATUS_LABELS[s.status as keyof typeof PAYMENT_ORDER_STATUS_LABELS] ??
                s.status}
            </span>
          </div>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatCurrencyARS(s.total)}</p>
          <p className="text-xs text-muted-foreground">{ordersLabel(s.count)}</p>
        </div>
      ))}

      <div className="rounded-lg border-2 border-primary bg-primary/5 p-3">
        <span className="text-xs font-semibold text-primary">Total general</span>
        <p className="mt-1 text-lg font-bold tabular-nums">{formatCurrencyARS(grandTotal)}</p>
        <p className="text-xs text-muted-foreground">{ordersLabel(grandCount)}</p>
      </div>
    </div>
  );
}
