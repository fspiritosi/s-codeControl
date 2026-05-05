'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/shared/components/ui/badge';
import {
  INVOICE_STATUS_LABELS,
  VOUCHER_TYPE_LABELS,
} from '@/modules/purchasing/shared/types';
import { PaginatedTable, StatBlock, StatusFilterToolbar, SummaryGrid } from './SectionShell';

interface Row {
  id: string;
  full_number: string;
  voucher_type: string;
  issue_date: Date | string;
  due_date: Date | string | null;
  total: number;
  paid: number;
  remaining: number;
  status: string;
}

interface Summary {
  totalDebt: number;
  totalAmount: number;
  countByStatus: Record<string, number>;
  total: number;
}

const fmt = (n: number) =>
  `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function statusVariant(s: string) {
  if (s === 'CONFIRMED') return 'default';
  if (s === 'PAID') return 'success';
  if (s === 'PARTIAL_PAID') return 'outline';
  if (s === 'CANCELLED') return 'destructive';
  return 'secondary';
}

export function InvoicesSection({ rows, summary }: { rows: Row[]; summary: Summary | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () => (status === 'ALL' ? rows : rows.filter((r) => r.status === status)),
    [rows, status]
  );

  const statusOptions = Object.entries(summary?.countByStatus ?? {}).map(([value, count]) => ({
    value,
    label: INVOICE_STATUS_LABELS[value] ?? value,
    count,
  }));

  return (
    <div className="space-y-4 pt-2">
      <SummaryGrid>
        <StatBlock label="Total adeudado" value={fmt(summary?.totalDebt ?? 0)} />
        <StatBlock label="Monto total facturado" value={fmt(summary?.totalAmount ?? 0)} />
        <StatBlock
          label="Pendientes"
          value={(summary?.countByStatus['CONFIRMED'] ?? 0) + (summary?.countByStatus['PARTIAL_PAID'] ?? 0)}
        />
        <StatBlock label="Pagadas" value={summary?.countByStatus['PAID'] ?? 0} />
        <StatBlock label="Borradores" value={summary?.countByStatus['DRAFT'] ?? 0} />
      </SummaryGrid>

      <StatusFilterToolbar status={status} onStatusChange={(v) => { setStatus(v); setPage(0); }} options={statusOptions} />

      <PaginatedTable
        rows={filtered}
        page={page}
        onPageChange={setPage}
        emptyMessage="No hay facturas para este filtro"
        onRowClick={(row) => router.push(`/dashboard/purchasing/invoices/${row.id}`)}
        columns={[
          {
            header: 'Número',
            cell: (r) => <span className="font-mono font-medium">{r.full_number}</span>,
          },
          {
            header: 'Tipo',
            cell: (r) => <Badge variant="outline">{VOUCHER_TYPE_LABELS[r.voucher_type] ?? r.voucher_type}</Badge>,
          },
          {
            header: 'Fecha',
            cell: (r) => <span className="text-sm">{format(new Date(r.issue_date), 'dd/MM/yyyy')}</span>,
          },
          {
            header: 'Vencimiento',
            cell: (r) => (
              <span className="text-sm">
                {r.due_date ? format(new Date(r.due_date), 'dd/MM/yyyy') : '-'}
              </span>
            ),
          },
          {
            header: 'Total',
            cell: (r) => <span className="font-medium">{fmt(r.total)}</span>,
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
                {INVOICE_STATUS_LABELS[r.status] ?? r.status}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
