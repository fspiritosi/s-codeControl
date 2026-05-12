'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { PAYMENT_ORDER_STATUS_LABELS } from '../../../shared/validators';
import { DataTableColumnHeader } from '@/shared/components/data-table';

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'PAID'
      ? 'success'
      : status === 'CONFIRMED'
        ? 'default'
        : status === 'CANCELLED'
          ? 'destructive'
          : 'outline';
  return (
    <Badge variant={variant as any}>
      {PAYMENT_ORDER_STATUS_LABELS[status as keyof typeof PAYMENT_ORDER_STATUS_LABELS] ?? status}
    </Badge>
  );
}

export const paymentOrderColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'full_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nº" />,
    meta: { title: 'Nº' },
    cell: ({ row }) => (
      <Link
        href={`/dashboard/treasury/payment-orders/${row.original.id}`}
        className="font-mono font-medium hover:underline"
      >
        {row.original.full_number}
      </Link>
    ),
  },
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    meta: { title: 'Fecha' },
    cell: ({ row }) => (
      <span className="text-sm">{format(new Date(row.original.date), 'dd/MM/yyyy')}</span>
    ),
  },
  {
    accessorKey: 'scheduled_payment_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pago programado" />,
    meta: { title: 'Pago programado' },
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.scheduled_payment_date
          ? format(new Date(row.original.scheduled_payment_date), 'dd/MM/yyyy')
          : '-'}
      </span>
    ),
  },
  {
    id: 'supplier',
    accessorFn: (row) => row.supplier?.business_name ?? '',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Proveedor" />,
    meta: { title: 'Proveedor' },
    cell: ({ row }) =>
      row.original.supplier?.business_name ?? (
        <span className="text-muted-foreground">Sin proveedor</span>
      ),
  },
  {
    accessorKey: 'total_amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
    meta: { title: 'Total' },
    cell: ({ row }) => (
      <span className="text-right font-mono block">
        ${Number(row.original.total_amount).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    meta: { title: 'Estado' },
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    filterFn: 'equals',
  },
  {
    id: 'actions',
    meta: { excludeFromExport: true },
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" className="size-8" asChild>
        <Link href={`/dashboard/treasury/payment-orders/${row.original.id}`}>
          <Eye className="size-4" />
        </Link>
      </Button>
    ),
  },
];
