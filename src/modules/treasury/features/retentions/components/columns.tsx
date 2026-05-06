'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Badge } from '@/shared/components/ui/badge';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { PAYMENT_ORDER_STATUS_LABELS } from '@/modules/treasury/shared/validators';
import type { RetentionRow } from '../actions.server';

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export const retentionColumns: ColumnDef<RetentionRow>[] = [
  {
    accessorKey: 'payment_order_date',
    header: 'Fecha',
    cell: ({ row }) => format(new Date(row.original.payment_order_date), 'dd/MM/yyyy'),
  },
  {
    accessorKey: 'payment_order_full_number',
    header: 'OP',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/treasury/payment-orders/${row.original.payment_order_id}`}
        className="font-mono text-primary hover:underline inline-flex items-center gap-1"
      >
        {row.original.payment_order_full_number}
        <ExternalLink className="size-3" />
      </Link>
    ),
  },
  {
    accessorKey: 'supplier',
    header: 'Proveedor',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.supplier}</div>
        {row.original.supplier_tax_id && (
          <div className="text-xs text-muted-foreground font-mono">
            {row.original.supplier_tax_id}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'tax_type_name',
    header: 'Tipo',
    cell: ({ row }) => (
      <div>
        <div className="text-sm">{row.original.tax_type_name}</div>
        {row.original.tax_type_jurisdiction && (
          <div className="text-xs text-muted-foreground">
            {row.original.tax_type_jurisdiction}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'base_amount',
    header: 'Base',
    cell: ({ row }) => (
      <span className="font-mono text-sm">{fmt(row.original.base_amount)}</span>
    ),
  },
  {
    accessorKey: 'rate',
    header: 'Alícuota',
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.rate}%</span>,
  },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Monto</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono font-semibold text-amber-600">
        {fmt(row.original.amount)}
      </div>
    ),
  },
  {
    accessorKey: 'certificate_number',
    header: 'Certificado',
    cell: ({ row }) =>
      row.original.certificate_number ? (
        <a
          href={`/api/retention-certificates/${row.original.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-mono text-xs"
        >
          {row.original.certificate_number}
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">Pendiente</span>
      ),
  },
  {
    accessorKey: 'payment_order_status',
    header: 'Estado OP',
    cell: ({ row }) => {
      const status = row.original
        .payment_order_status as keyof typeof PAYMENT_ORDER_STATUS_LABELS;
      const variant =
        status === 'PAID'
          ? 'success'
          : status === 'CONFIRMED'
            ? 'default'
            : status === 'CANCELLED'
              ? 'destructive'
              : 'outline';
      return <Badge variant={variant as any}>{PAYMENT_ORDER_STATUS_LABELS[status]}</Badge>;
    },
  },
];
