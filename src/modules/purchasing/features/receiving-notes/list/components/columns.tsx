'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/ui/badge';
import { RECEIVING_NOTE_STATUS_LABELS } from '@/modules/purchasing/shared/types';
import { format } from 'date-fns';

export const receivingNoteColumns: ColumnDef<any>[] = [
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
    cell: ({ row }) => <span className="text-sm">{row.original.supplier?.business_name}</span>,
  },
  {
    id: 'warehouse',
    header: 'Almacén',
    meta: { title: 'Almacén' },
    cell: ({ row }) => <span className="text-sm">{row.original.warehouse?.name}</span>,
  },
  {
    accessorKey: 'reception_date',
    header: 'Fecha recepción',
    meta: { title: 'Fecha recepción' },
    cell: ({ row }) => <span className="text-sm">{format(new Date(row.original.reception_date), 'dd/MM/yyyy')}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    meta: { title: 'Estado' },
    cell: ({ row }) => {
      const s = row.original.status;
      const variant = s === 'CONFIRMED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';
      return <Badge variant={variant as any}>{RECEIVING_NOTE_STATUS_LABELS[s] || s}</Badge>;
    },
    filterFn: 'equals',
  },
];
