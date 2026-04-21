'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/ui/badge';
import { TAX_CONDITION_LABELS, SUPPLIER_STATUS_LABELS, type Supplier } from '@/modules/suppliers/shared/types';

function formatCuit(cuit: string) {
  const clean = cuit.replace(/-/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
  }
  return cuit;
}

export const supplierColumns: ColumnDef<Supplier>[] = [
  {
    accessorKey: 'business_name',
    header: 'Razón Social',
    meta: { title: 'Razón Social' },
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.business_name}</p>
        {row.original.trade_name && (
          <p className="text-xs text-muted-foreground">{row.original.trade_name}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'tax_id',
    header: 'CUIT',
    meta: { title: 'CUIT' },
    cell: ({ row }) => <span className="font-mono text-sm">{formatCuit(row.original.tax_id)}</span>,
  },
  {
    accessorKey: 'tax_condition',
    header: 'Condición IVA',
    meta: { title: 'Condición IVA' },
    cell: ({ row }) => (
      <span className="text-sm">{TAX_CONDITION_LABELS[row.original.tax_condition] || row.original.tax_condition}</span>
    ),
    filterFn: 'equals',
  },
  {
    accessorKey: 'email',
    header: 'Email',
    meta: { title: 'Email' },
    cell: ({ row }) => (
      <span className="text-sm truncate max-w-[200px] block">{row.original.email || '-'}</span>
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Teléfono',
    meta: { title: 'Teléfono' },
    cell: ({ row }) => <span className="text-sm">{row.original.phone || '-'}</span>,
  },
  {
    accessorKey: 'payment_term_days',
    header: 'Plazo de pago',
    meta: { title: 'Plazo de pago' },
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.payment_term_days === 0 ? 'Contado' : `${row.original.payment_term_days} días`}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    meta: { title: 'Estado' },
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={status === 'ACTIVE' ? 'default' : status === 'BLOCKED' ? 'destructive' : 'secondary'}>
          {SUPPLIER_STATUS_LABELS[status] || status}
        </Badge>
      );
    },
    filterFn: 'equals',
  },
];
