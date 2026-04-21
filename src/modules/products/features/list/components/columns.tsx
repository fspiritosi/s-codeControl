'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/ui/badge';
import { PRODUCT_TYPE_LABELS, PRODUCT_STATUS_LABELS, type Product } from '@/modules/products/shared/types';

export const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: 'code',
    header: 'Código',
    meta: { title: 'Código' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
    meta: { title: 'Nombre' },
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        {row.original.description && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{row.original.description}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    meta: { title: 'Tipo' },
    cell: ({ row }) => <Badge variant="outline">{PRODUCT_TYPE_LABELS[row.original.type] || row.original.type}</Badge>,
    filterFn: 'equals',
  },
  {
    accessorKey: 'unit_of_measure',
    header: 'Unidad',
    meta: { title: 'Unidad' },
  },
  {
    accessorKey: 'cost_price',
    header: 'Costo',
    meta: { title: 'Costo' },
    cell: ({ row }) => <span>${row.original.cost_price.toFixed(2)}</span>,
  },
  {
    accessorKey: 'sale_price',
    header: 'Venta',
    meta: { title: 'Venta' },
    cell: ({ row }) => <span>${row.original.sale_price.toFixed(2)}</span>,
  },
  {
    accessorKey: 'track_stock',
    header: 'Stock',
    meta: { title: 'Stock' },
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.track_stock ? `Min: ${row.original.min_stock ?? 0}` : 'No controlado'}
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
        <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
          {PRODUCT_STATUS_LABELS[status] || status}
        </Badge>
      );
    },
    filterFn: 'equals',
  },
];
