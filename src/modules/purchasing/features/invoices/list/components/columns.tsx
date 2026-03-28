'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/ui/badge';
import { INVOICE_STATUS_LABELS, VOUCHER_TYPE_LABELS } from '@/modules/purchasing/shared/types';
import { format } from 'date-fns';

export const invoiceColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'full_number',
    header: 'Número',
    meta: { title: 'Número' },
    cell: ({ row }) => <span className="font-mono font-medium">{row.original.full_number}</span>,
  },
  {
    accessorKey: 'voucher_type',
    header: 'Tipo',
    meta: { title: 'Tipo' },
    cell: ({ row }) => (
      <Badge variant="outline">{VOUCHER_TYPE_LABELS[row.original.voucher_type] || row.original.voucher_type}</Badge>
    ),
    filterFn: 'equals',
  },
  {
    id: 'supplier',
    header: 'Proveedor',
    meta: { title: 'Proveedor' },
    cell: ({ row }) => <span className="text-sm">{row.original.supplier?.business_name}</span>,
  },
  {
    accessorKey: 'issue_date',
    header: 'Fecha',
    meta: { title: 'Fecha' },
    cell: ({ row }) => <span className="text-sm">{format(new Date(row.original.issue_date), 'dd/MM/yyyy')}</span>,
  },
  {
    accessorKey: 'total',
    header: 'Total',
    meta: { title: 'Total' },
    cell: ({ row }) => <span className="font-medium">${row.original.total.toFixed(2)}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    meta: { title: 'Estado' },
    cell: ({ row }) => {
      const s = row.original.status;
      const variant = s === 'CONFIRMED' ? 'default' : s === 'PAID' ? 'success' : s === 'CANCELLED' ? 'destructive' : 'secondary';
      return <Badge variant={variant as any}>{INVOICE_STATUS_LABELS[s] || s}</Badge>;
    },
    filterFn: 'equals',
  },
];
