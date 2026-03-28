'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/ui/badge';
import { PO_STATUS_LABELS, PO_STATUS_COLORS, PO_INVOICING_STATUS_LABELS } from '@/modules/purchasing/shared/types';
import { format } from 'date-fns';

export const purchaseOrderColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'full_number',
    header: 'Número',
    meta: { title: 'Número' },
    cell: ({ row }) => <span className="font-mono font-medium">{row.original.full_number}</span>,
  },
  {
    id: 'supplier',
    header: 'Proveedor',
    meta: { title: 'Proveedor' },
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.supplier?.business_name}</p>
        <p className="text-xs text-muted-foreground">{row.original.supplier?.tax_id}</p>
      </div>
    ),
  },
  {
    accessorKey: 'issue_date',
    header: 'Fecha',
    meta: { title: 'Fecha' },
    cell: ({ row }) => (
      <span className="text-sm">{format(new Date(row.original.issue_date), 'dd/MM/yyyy')}</span>
    ),
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
      const status = row.original.status;
      return (
        <Badge variant={(PO_STATUS_COLORS[status] as any) || 'secondary'}>
          {PO_STATUS_LABELS[status] || status}
        </Badge>
      );
    },
    filterFn: 'equals',
  },
  {
    accessorKey: 'invoicing_status',
    header: 'Facturación',
    meta: { title: 'Facturación' },
    cell: ({ row }) => (
      <Badge variant="outline">
        {PO_INVOICING_STATUS_LABELS[row.original.invoicing_status] || row.original.invoicing_status}
      </Badge>
    ),
    filterFn: 'equals',
  },
];
