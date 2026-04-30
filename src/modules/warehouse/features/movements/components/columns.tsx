'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/ui/badge';
import { STOCK_MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS, type StockMovement } from '@/modules/warehouse/shared/types';
import { format } from 'date-fns';

export function buildMovementColumns({ showCompany }: { showCompany: boolean }): ColumnDef<StockMovement>[] {
  const cols: ColumnDef<StockMovement>[] = [
  {
    accessorKey: 'date',
    header: 'Fecha',
    meta: { title: 'Fecha' },
    cell: ({ row }) => (
      <span className="text-sm">{format(new Date(row.original.date), 'dd/MM/yyyy HH:mm')}</span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    meta: { title: 'Tipo' },
    cell: ({ row }) => {
      const colors = MOVEMENT_TYPE_COLORS[row.original.type] || '';
      return (
        <Badge variant="outline" className={colors}>
          {STOCK_MOVEMENT_TYPE_LABELS[row.original.type] || row.original.type}
        </Badge>
      );
    },
    filterFn: 'equals',
  },
  {
    id: 'product',
    header: 'Producto',
    meta: { title: 'Producto' },
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.product?.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{row.original.product?.code}</p>
      </div>
    ),
  },
  {
    id: 'warehouse',
    header: 'Almacén',
    meta: { title: 'Almacén' },
    cell: ({ row }) => (
      <span className="text-sm">{row.original.warehouse?.name}</span>
    ),
  },
  {
    accessorKey: 'quantity',
    header: 'Cantidad',
    meta: { title: 'Cantidad' },
    cell: ({ row }) => {
      const qty = row.original.quantity;
      const sign = qty > 0 ? '+' : '';
      const color = qty > 0 ? 'text-green-600' : qty < 0 ? 'text-red-600' : '';
      return (
        <span className={`font-mono text-sm font-medium ${color}`}>
          {sign}{qty} {row.original.product?.unit_of_measure || ''}
        </span>
      );
    },
  },
  {
    accessorKey: 'notes',
    header: 'Notas',
    meta: { title: 'Notas' },
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
        {row.original.notes || '-'}
      </span>
    ),
  },
  ];

  if (showCompany) {
    cols.splice(cols.length - 1, 0, {
      id: 'company_name',
      header: 'Empresa',
      meta: { title: 'Empresa' },
      cell: ({ row }) => (
        <span className="text-sm">{(row.original as any).company?.company_name ?? '-'}</span>
      ),
    });
  }

  return cols;
}

export const movementColumns: ColumnDef<StockMovement>[] = buildMovementColumns({ showCompany: false });
