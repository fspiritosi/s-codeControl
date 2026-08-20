'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/shared/components/ui/badge';
import { PAYMENT_ORDER_STATUS_LABELS } from '@/modules/treasury/shared/validators';
import { PaginatedTable, StatBlock, StatusFilterToolbar, SummaryGrid, MoneyCell, fmtMoney, fmtMoneyIn } from './SectionShell';

interface Row {
  id: string;
  full_number: string;
  date: Date | string;
  scheduled_payment_date: Date | string | null;
  total_amount: number;
  /** Moneda de la orden: los importes de la fila están en ella. */
  currency: string;
  /** `total_amount` convertido a pesos con el TC de la orden. */
  total_in_base: number;
  applied_to_invoices: number;
  applied_to_expenses: number;
  on_account: number;
  unallocated: number;
  status: string;
}

interface Summary {
  totalPaid: number;
  totalScheduled: number;
  paidToInvoices: number;
  paidToExpenses: number;
  paidOnAccount: number;
  paidUnallocated: number;
  countByStatus: Record<string, number>;
  total: number;
  hasForeignCurrency: boolean;
}

const fmt = fmtMoney;

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
        <StatBlock
          label="Total pagado"
          value={fmt(summary?.totalPaid ?? 0)}
          hint={summary?.hasForeignCurrency ? 'En pesos, al TC de cada orden' : undefined}
        />
        <StatBlock
          label="Aplicado a facturas"
          value={fmt(summary?.paidToInvoices ?? 0)}
          hint="Descuenta saldo de facturas"
        />
        <StatBlock
          label="Aplicado a gastos"
          value={fmt(summary?.paidToExpenses ?? 0)}
          hint="Descuenta saldo de gastos"
        />
        {(summary?.paidOnAccount ?? 0) > 0 ? (
          <StatBlock
            label="Pagado a cuenta"
            value={fmt(summary?.paidOnAccount ?? 0)}
            hint="Genera saldo a favor"
          />
        ) : (summary?.paidUnallocated ?? 0) !== 0 ? (
          <StatBlock
            label="Sin imputar"
            value={fmt(summary?.paidUnallocated ?? 0)}
            hint="Descuadre a revisar"
          />
        ) : (
          <StatBlock label="Pagadas" value={summary?.countByStatus['PAID'] ?? 0} />
        )}
        <StatBlock label="Total programado" value={fmt(summary?.totalScheduled ?? 0)} hint="Borradores + confirmadas" />
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
            cell: (r) => (
              <MoneyCell
                amount={r.total_amount}
                currency={r.currency}
                inBase={r.total_in_base}
                className="font-medium"
              />
            ),
            className: 'text-right',
          },
          {
            header: 'Imputación',
            cell: (r) => (
              <div className="flex flex-col text-xs text-muted-foreground">
                {r.applied_to_invoices > 0 && <span>Facturas {fmtMoneyIn(r.applied_to_invoices, r.currency)}</span>}
                {r.applied_to_expenses > 0 && <span>Gastos {fmtMoneyIn(r.applied_to_expenses, r.currency)}</span>}
                {r.on_account > 0 && (
                  <span className="text-sky-600 dark:text-sky-400">
                    A cuenta {fmtMoneyIn(r.on_account, r.currency)}
                  </span>
                )}
                {r.unallocated !== 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    Sin imputar {fmtMoneyIn(r.unallocated, r.currency)}
                  </span>
                )}
                {r.applied_to_invoices === 0 &&
                  r.applied_to_expenses === 0 &&
                  r.on_account === 0 &&
                  r.unallocated === 0 && <span>-</span>}
              </div>
            ),
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
