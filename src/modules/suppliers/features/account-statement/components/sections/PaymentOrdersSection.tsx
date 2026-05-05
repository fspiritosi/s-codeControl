'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/shared/components/ui/badge';
import { PAYMENT_ORDER_STATUS_LABELS } from '@/modules/treasury/shared/validators';
import { PaginatedTable, StatBlock, StatusFilterToolbar, SummaryGrid } from './SectionShell';

interface Row {
  id: string;
  full_number: string;
  date: Date | string;
  scheduled_payment_date: Date | string | null;
  total_amount: number;
  status: string;
}

interface Summary {
  totalPaid: number;
  totalScheduled: number;
  countByStatus: Record<string, number>;
  total: number;
}

const fmt = (n: number) =>
  `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function statusVariant(s: string) {
  if (s === 'PAID') return 'success';
  if (s === 'CONFIRMED') return 'default';
  if (s === 'CANCELLED') return 'destructive';
  return 'secondary';
}

export function PaymentOrdersSection({ rows, summary }: { rows: Row[]; summary: Summary | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () => (status === 'ALL' ? rows : rows.filter((r) => r.status === status)),
    [rows, status]
  );

  const statusOptions = Object.entries(summary?.countByStatus ?? {}).map(([value, count]) => ({
    value,
    label: (PAYMENT_ORDER_STATUS_LABELS as Record<string, string>)[value] ?? value,
    count,
  }));

  return (
    <div className="space-y-4 pt-2">
      <SummaryGrid>
        <StatBlock label="Total pagado" value={fmt(summary?.totalPaid ?? 0)} />
        <StatBlock label="Total programado" value={fmt(summary?.totalScheduled ?? 0)} hint="Borradores + confirmadas" />
        <StatBlock label="Pagadas" value={summary?.countByStatus['PAID'] ?? 0} />
        <StatBlock label="Confirmadas" value={summary?.countByStatus['CONFIRMED'] ?? 0} />
        <StatBlock label="Borradores" value={summary?.countByStatus['DRAFT'] ?? 0} />
      </SummaryGrid>

      <StatusFilterToolbar status={status} onStatusChange={(v) => { setStatus(v); setPage(0); }} options={statusOptions} />

      <PaginatedTable
        rows={filtered}
        page={page}
        onPageChange={setPage}
        emptyMessage="No hay órdenes de pago para este filtro"
        onRowClick={(row) => router.push(`/dashboard/treasury/payment-orders/${row.id}`)}
        columns={[
          {
            header: 'Número',
            cell: (r) => <span className="font-mono font-medium">{r.full_number}</span>,
          },
          {
            header: 'Fecha',
            cell: (r) => <span className="text-sm">{format(new Date(r.date), 'dd/MM/yyyy')}</span>,
          },
          {
            header: 'Programada',
            cell: (r) => (
              <span className="text-sm">
                {r.scheduled_payment_date ? format(new Date(r.scheduled_payment_date), 'dd/MM/yyyy') : '-'}
              </span>
            ),
          },
          {
            header: 'Total',
            cell: (r) => <span className="font-medium">{fmt(r.total_amount)}</span>,
            className: 'text-right',
          },
          {
            header: 'Estado',
            cell: (r) => (
              <Badge variant={statusVariant(r.status) as any}>
                {(PAYMENT_ORDER_STATUS_LABELS as Record<string, string>)[r.status] ?? r.status}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
