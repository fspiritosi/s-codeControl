'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/shared/components/ui/badge';
import {
  PO_STATUS_LABELS,
  PO_INVOICING_STATUS_LABELS,
} from '@/modules/purchasing/shared/types';
import { PaginatedTable, StatBlock, StatusFilterToolbar, SummaryGrid } from './SectionShell';

interface Row {
  id: string;
  full_number: string;
  issue_date: Date | string;
  expected_delivery_date: Date | string | null;
  total: number;
  status: string;
  invoicing_status: string;
}

interface Summary {
  totalAmount: number;
  countByStatus: Record<string, number>;
  total: number;
}

const fmt = (n: number) =>
  `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function statusVariant(s: string) {
  if (s === 'APPROVED') return 'default';
  if (s === 'COMPLETED') return 'success';
  if (s === 'CANCELLED') return 'destructive';
  if (s === 'PENDING_APPROVAL') return 'outline';
  return 'secondary';
}

export function PurchaseOrdersSection({ rows, summary }: { rows: Row[]; summary: Summary | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () => (status === 'ALL' ? rows : rows.filter((r) => r.status === status)),
    [rows, status]
  );

  const statusOptions = Object.entries(summary?.countByStatus ?? {}).map(([value, count]) => ({
    value,
    label: PO_STATUS_LABELS[value] ?? value,
    count,
  }));

  return (
    <div className="space-y-4 pt-2">
      <SummaryGrid>
        <StatBlock label="Monto total (no anuladas)" value={fmt(summary?.totalAmount ?? 0)} />
        <StatBlock label="Aprobadas" value={summary?.countByStatus['APPROVED'] ?? 0} />
        <StatBlock label="Recibidas parcialmente" value={summary?.countByStatus['PARTIALLY_RECEIVED'] ?? 0} />
        <StatBlock label="Completadas" value={summary?.countByStatus['COMPLETED'] ?? 0} />
        <StatBlock label="Borradores" value={summary?.countByStatus['DRAFT'] ?? 0} />
      </SummaryGrid>

      <StatusFilterToolbar status={status} onStatusChange={(v) => { setStatus(v); setPage(0); }} options={statusOptions} />

      <PaginatedTable
        rows={filtered}
        page={page}
        onPageChange={setPage}
        emptyMessage="No hay órdenes de compra para este filtro"
        onRowClick={(row) => router.push(`/dashboard/purchasing/orders/${row.id}`)}
        columns={[
          {
            header: 'Número',
            cell: (r) => <span className="font-mono font-medium">{r.full_number}</span>,
          },
          {
            header: 'Fecha emisión',
            cell: (r) => <span className="text-sm">{format(new Date(r.issue_date), 'dd/MM/yyyy')}</span>,
          },
          {
            header: 'Entrega esperada',
            cell: (r) => (
              <span className="text-sm">
                {r.expected_delivery_date ? format(new Date(r.expected_delivery_date), 'dd/MM/yyyy') : '-'}
              </span>
            ),
          },
          {
            header: 'Total',
            cell: (r) => <span className="font-medium">{fmt(r.total)}</span>,
            className: 'text-right',
          },
          {
            header: 'Facturación',
            cell: (r) => (
              <Badge variant="outline">
                {PO_INVOICING_STATUS_LABELS[r.invoicing_status] ?? r.invoicing_status}
              </Badge>
            ),
          },
          {
            header: 'Estado',
            cell: (r) => (
              <Badge variant={statusVariant(r.status) as any}>
                {PO_STATUS_LABELS[r.status] ?? r.status}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
