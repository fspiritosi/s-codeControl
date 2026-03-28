'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/ui/badge';
import { WAREHOUSE_TYPE_LABELS, type Warehouse } from '@/modules/warehouse/shared/types';

export const warehouseColumns: ColumnDef<Warehouse>[] = [
  {
    accessorKey: 'name',
    header: 'Almacén',
    meta: { title: 'Almacén' },
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{row.original.code}</p>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    meta: { title: 'Tipo' },
    cell: ({ row }) => (
      <Badge variant="outline">{WAREHOUSE_TYPE_LABELS[row.original.type] || row.original.type}</Badge>
    ),
    filterFn: 'equals',
  },
  {
    accessorKey: 'city',
    header: 'Ubicación',
    meta: { title: 'Ubicación' },
    cell: ({ row }) => {
      const parts = [row.original.city, row.original.province].filter(Boolean);
      return <span className="text-sm">{parts.join(', ') || '-'}</span>;
    },
  },
  {
    id: 'stocks',
    header: 'Productos',
    meta: { title: 'Productos' },
    cell: ({ row }) => <span className="text-sm">{row.original._count?.stocks || 0}</span>,
  },
  {
    id: 'movements',
    header: 'Movimientos',
    meta: { title: 'Movimientos' },
    cell: ({ row }) => <span className="text-sm">{row.original._count?.movements || 0}</span>,
  },
  {
    accessorKey: 'is_active',
    header: 'Estado',
    meta: { title: 'Estado' },
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
        {row.original.is_active ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
];
