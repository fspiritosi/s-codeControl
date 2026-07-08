'use client';

import { DataTable, DataTableColumnHeader } from '@/shared/components/data-table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import type { ColumnDef } from '@tanstack/react-table';
import type { VtvListItem } from '../types';
import { STATUS_META } from './vtvStatusMeta';

interface Props {
  items: VtvListItem[];
  onManage: (item: VtvListItem) => void;
}

function getColumns(
  onManage: (item: VtvListItem) => void
): ColumnDef<VtvListItem>[] {
  return [
    {
      id: 'Vehículo',
      accessorFn: (row) => [row.domain, row.internNumber].filter(Boolean).join(' '),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vehículo" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.domain || 'Sin patente'}</span>
          {row.original.internNumber && (
            <span className="text-xs text-muted-foreground">
              Interno {row.original.internNumber}
            </span>
          )}
        </div>
      ),
      filterFn: 'includesString',
      enableColumnFilter: true,
    },
    {
      id: 'Marca/Modelo',
      accessorFn: (row) => [row.brand, row.model].filter(Boolean).join(' '),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Marca/Modelo" />,
      cell: ({ row }) =>
        [row.original.brand, row.original.model].filter(Boolean).join(' ') || '—',
      enableColumnFilter: false,
    },
    {
      id: 'Vencimiento',
      accessorFn: (row) => row.validity ?? '',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimiento" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className={row.original.isExpired ? 'text-red-500 font-medium' : ''}>
            {row.original.validity ?? 'Sin documento'}
          </span>
          {row.original.isExpired && (
            <span className="text-xs font-medium text-red-500">Vencida</span>
          )}
        </div>
      ),
      filterFn: 'includesString',
      enableColumnFilter: true,
    },
    {
      id: 'Estado',
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
      cell: ({ row }) => {
        const meta = STATUS_META[row.original.status];
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
      enableColumnFilter: true,
    },
    {
      id: 'Fecha turno',
      // Solo hay fecha de turno si está programado; 'sin_programar' no tiene turno real
      // (su appointment_date es solo un placeholder = vencimiento).
      accessorFn: (row) =>
        row.status === 'sin_programar' ? '' : (row.appointmentDate ?? ''),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha turno" />,
      cell: ({ row }) =>
        row.original.status === 'sin_programar'
          ? '—'
          : row.original.appointmentDate || '—',
      filterFn: 'includesString',
      enableColumnFilter: true,
    },
    {
      id: 'acciones',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => onManage(row.original)}>
          Gestionar
        </Button>
      ),
      enableColumnFilter: false,
      enableSorting: false,
    },
  ];
}

export function VtvListTable({ items, onManage }: Props) {
  return (
    <DataTable
      columns={getColumns(onManage) as ColumnDef<Record<string, unknown>>[]}
      data={items as unknown as Record<string, unknown>[]}
      tableId="vtvListTable"
      showFilterToggle
      initialFilterVisibility={{
        Vehículo: true,
        Vencimiento: true,
        Estado: true,
        'Fecha turno': true,
      }}
      facetedFilters={[
        {
          columnId: 'Vehículo',
          title: 'Vehículo',
          type: 'text',
          placeholder: 'Patente o interno',
        },
        {
          columnId: 'Vencimiento',
          title: 'Vencimiento',
          type: 'text',
          placeholder: 'Ej: 2026-07',
        },
        {
          columnId: 'Estado',
          title: 'Estado',
          options: [
            { value: 'sin_programar', label: 'Sin programar' },
            { value: 'orden_solicitada', label: 'Orden solicitada' },
            { value: 'realizada', label: 'Realizada' },
          ],
        },
        {
          columnId: 'Fecha turno',
          title: 'Fecha turno',
          type: 'text',
          placeholder: 'Ej: 2026-07',
        },
      ]}
      emptyMessage="No hay documentos de VTV para mostrar."
    />
  );
}
