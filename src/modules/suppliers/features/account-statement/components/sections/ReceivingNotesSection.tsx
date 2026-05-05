'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/shared/components/ui/badge';
import { RECEIVING_NOTE_STATUS_LABELS } from '@/modules/purchasing/shared/types';
import { PaginatedTable, StatBlock, StatusFilterToolbar, SummaryGrid } from './SectionShell';

interface Row {
  id: string;
  full_number: string;
  reception_date: Date | string;
  status: string;
  warehouse_name: string | null;
  related_order: string | null;
  related_invoice: string | null;
  line_count: number;
}

interface Summary {
  countByStatus: Record<string, number>;
  total: number;
}

function statusVariant(s: string) {
  if (s === 'CONFIRMED') return 'success';
  if (s === 'CANCELLED') return 'destructive';
  return 'secondary';
}

export function ReceivingNotesSection({ rows, summary }: { rows: Row[]; summary: Summary | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () => (status === 'ALL' ? rows : rows.filter((r) => r.status === status)),
    [rows, status]
  );

  const statusOptions = Object.entries(summary?.countByStatus ?? {}).map(([value, count]) => ({
    value,
    label: RECEIVING_NOTE_STATUS_LABELS[value] ?? value,
    count,
  }));

  return (
    <div className="space-y-4 pt-2">
      <SummaryGrid>
        <StatBlock label="Total remitos" value={summary?.total ?? 0} />
        <StatBlock label="Confirmados" value={summary?.countByStatus['CONFIRMED'] ?? 0} />
        <StatBlock label="Borradores" value={summary?.countByStatus['DRAFT'] ?? 0} />
        <StatBlock label="Anulados" value={summary?.countByStatus['CANCELLED'] ?? 0} />
      </SummaryGrid>

      <StatusFilterToolbar status={status} onStatusChange={(v) => { setStatus(v); setPage(0); }} options={statusOptions} />

      <PaginatedTable
        rows={filtered}
        page={page}
        onPageChange={setPage}
        emptyMessage="No hay remitos para este filtro"
        onRowClick={(row) => router.push(`/dashboard/purchasing/receiving/${row.id}`)}
        columns={[
          {
            header: 'Número',
            cell: (r) => <span className="font-mono font-medium">{r.full_number}</span>,
          },
          {
            header: 'Fecha recepción',
            cell: (r) => <span className="text-sm">{format(new Date(r.reception_date), 'dd/MM/yyyy')}</span>,
          },
          {
            header: 'Almacén',
            cell: (r) => <span className="text-sm">{r.warehouse_name ?? '-'}</span>,
          },
          {
            header: 'OC vinculada',
            cell: (r) => <span className="text-sm font-mono">{r.related_order ?? '-'}</span>,
          },
          {
            header: 'Factura vinculada',
            cell: (r) => <span className="text-sm font-mono">{r.related_invoice ?? '-'}</span>,
          },
          {
            header: 'Líneas',
            cell: (r) => <span className="text-sm">{r.line_count}</span>,
            className: 'text-right',
          },
          {
            header: 'Estado',
            cell: (r) => (
              <Badge variant={statusVariant(r.status) as any}>
                {RECEIVING_NOTE_STATUS_LABELS[r.status] ?? r.status}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
