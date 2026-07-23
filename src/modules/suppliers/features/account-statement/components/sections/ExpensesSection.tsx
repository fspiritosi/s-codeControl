'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateUTC } from '@/shared/lib/utils/formatters';
import { Badge } from '@/shared/components/ui/badge';
import { EXPENSE_STATUS_LABELS } from '@/modules/purchasing/features/expenses/validators';
import { PaginatedTable, StatBlock, StatusFilterToolbar, SummaryGrid } from './SectionShell';

interface Row {
  id: string;
  full_number: string;
  description: string;
  category_name: string;
  date: Date | string;
  due_date: Date | string | null;
  total: number;
  paid: number;
  remaining: number;
  status: string;
}

interface Summary {
  totalDebt: number;
  totalAmount: number;
  pendingCount: number;
  countByStatus: Record<string, number>;
  total: number;
}

const fmt = (n: number) =>
  `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function statusVariant(s: string) {
  if (s === 'PAID') return 'success';
  if (s === 'CONFIRMED') return 'default';
  if (s === 'PARTIAL_PAID') return 'outline';
  if (s === 'CANCELLED') return 'destructive';
  return 'secondary';
}

export function ExpensesSection({ rows, summary }: { rows: Row[]; summary: Summary | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () => (status === 'ALL' ? rows : rows.filter((r) => r.status === status)),
    [rows, status]
  );

  const statusOptions = Object.entries(summary?.countByStatus ?? {}).map(([value, count]) => ({
    value,
    label: (EXPENSE_STATUS_LABELS as Record<string, string>)[value] ?? value,
    count,
  }));

  return (
    <div className="space-y-4 pt-2">
      <SummaryGrid>
        <StatBlock label="Total adeudado" value={fmt(summary?.totalDebt ?? 0)} />
        <StatBlock label="Monto total" value={fmt(summary?.totalAmount ?? 0)} />
        <StatBlock label="Pendientes" value={summary?.pendingCount ?? 0} hint="Gastos con saldo" />
        <StatBlock label="Pagados" value={summary?.countByStatus['PAID'] ?? 0} />
        <StatBlock label="Borradores" value={summary?.countByStatus['DRAFT'] ?? 0} />
      </SummaryGrid>

      <StatusFilterToolbar
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(0);
        }}
        options={statusOptions}
      />

      <PaginatedTable
        rows={filtered}
        page={page}
        onPageChange={setPage}
        emptyMessage="No hay gastos para este filtro"
        onRowClick={() => router.push('/dashboard/purchasing?tab=expenses')}
        columns={[
          {
            header: 'Número',
            cell: (r) => <span className="font-mono font-medium">{r.full_number}</span>,
          },
          {
            header: 'Descripción',
            cell: (r) => (
              <div className="flex flex-col">
                <span className="text-sm">{r.description}</span>
                {r.category_name && (
                  <span className="text-xs text-muted-foreground">{r.category_name}</span>
                )}
              </div>
            ),
          },
          {
            header: 'Fecha',
            cell: (r) => <span className="text-sm">{formatDateUTC(r.date)}</span>,
          },
          {
            header: 'Vencimiento',
            cell: (r) => <span className="text-sm">{formatDateUTC(r.due_date)}</span>,
          },
          {
            header: 'Total',
            cell: (r) => <span className="font-medium">{fmt(r.total)}</span>,
            className: 'text-right',
          },
          {
            header: 'Pagado',
            cell: (r) => (
              <span className="text-sm text-muted-foreground">{r.paid > 0 ? fmt(r.paid) : '-'}</span>
            ),
            className: 'text-right',
          },
          {
            header: 'Saldo',
            cell: (r) => <span className="font-medium">{fmt(r.remaining)}</span>,
            className: 'text-right',
          },
          {
            header: 'Estado',
            cell: (r) => (
              <Badge variant={statusVariant(r.status) as any}>
                {(EXPENSE_STATUS_LABELS as Record<string, string>)[r.status] ?? r.status}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
