'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import { DataTableColumnHeader } from '@/shared/components/common/DataTable';

interface StockRow {
  id: string;
  product_id?: string;
  product_code?: string;
  product_name?: string;
  unit_of_measure?: string;
  company_name?: string;
  quantity: number;
  reserved_qty: number;
  available_qty: number;
  updated_at: string | null;
}

export function buildWarehouseStockColumns({
  showCompany,
}: {
  showCompany: boolean;
}): ColumnDef<StockRow>[] {
  const cols: ColumnDef<StockRow>[] = [
    {
      accessorKey: 'product_name',
      meta: { title: 'Producto' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Producto" />,
      cell: ({ row }) =>
        row.original.product_id ? (
          <Link
            href={`/dashboard/products/${row.original.product_id}`}
            className="font-medium hover:underline"
          >
            {row.original.product_name}
          </Link>
        ) : (
          <span className="font-medium">{row.original.product_name}</span>
        ),
      enableSorting: true,
    },
    {
      accessorKey: 'product_code',
      meta: { title: 'Código' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.product_code}</span>
      ),
    },
    {
      accessorKey: 'unit_of_measure',
      meta: { title: 'Unidad' },
      header: 'Unidad',
      cell: ({ row }) => row.original.unit_of_measure ?? '-',
      filterFn: 'equals',
    },
    {
      accessorKey: 'quantity',
      meta: { title: 'Cantidad' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cantidad" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-right block">{row.original.quantity}</span>
      ),
    },
    {
      accessorKey: 'reserved_qty',
      meta: { title: 'Reservado' },
      header: 'Reservado',
      cell: ({ row }) => (
        <span className="tabular-nums text-right block">{row.original.reserved_qty}</span>
      ),
    },
    {
      accessorKey: 'available_qty',
      meta: { title: 'Disponible' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Disponible" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-right font-medium block">
          {row.original.available_qty}
        </span>
      ),
    },
    {
      accessorKey: 'updated_at',
      meta: { title: 'Actualizado' },
      header: 'Actualizado',
      cell: ({ row }) => {
        const v = row.original.updated_at;
        return v ? (
          <span className="text-xs text-muted-foreground">
            {format(new Date(v), 'dd/MM/yyyy HH:mm')}
          </span>
        ) : (
          '-'
        );
      },
    },
  ];

  if (showCompany) {
    cols.splice(2, 0, {
      id: 'company_name',
      accessorKey: 'company_name',
      meta: { title: 'Empresa' },
      header: 'Empresa',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.company_name ?? '-'}</span>
      ),
    });
  }

  return cols;
}
