'use client';

import { Check, X } from 'lucide-react';
import { DataTable, DataTableColumnHeader } from '@/shared/components/data-table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import type { ColumnDef } from '@tanstack/react-table';
import type { VtvListItem } from '../types';
import { DISPLAY_META, deriveDisplayKey } from './vtvStatusMeta';

interface Props {
  items: VtvListItem[];
  onManage: (item: VtvListItem) => void;
}

// Indicador Sí/No de un flag (Orden o Turno).
function IndicatorCell({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex items-center gap-1 text-green-600">
      <Check className="size-4" /> Sí
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <X className="size-4" /> No
    </span>
  );
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
      id: 'Orden',
      accessorFn: (row) => (row.hasOrder ? 'si' : 'no'),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Orden" />,
      cell: ({ row }) => <IndicatorCell on={row.original.hasOrder} />,
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
      enableColumnFilter: true,
    },
    {
      id: 'Turno',
      accessorFn: (row) => (row.hasAppointment ? 'si' : 'no'),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Turno" />,
      cell: ({ row }) => <IndicatorCell on={row.original.hasAppointment} />,
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
      enableColumnFilter: true,
    },
    {
      id: 'Estado',
      accessorFn: (row) =>
        deriveDisplayKey(row.status, {
          hasOrder: row.hasOrder,
          hasAppointment: row.hasAppointment,
        }),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
      cell: ({ row }) => {
        const key = deriveDisplayKey(row.original.status, {
          hasOrder: row.original.hasOrder,
          hasAppointment: row.original.hasAppointment,
        });
        const meta = DISPLAY_META[key];
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
      enableColumnFilter: true,
    },
    {
      id: 'Fecha turno',
      // Solo hay fecha de turno relevante si el vehículo ya tiene el Turno.
      accessorFn: (row) => (row.hasAppointment ? (row.appointmentDate ?? '') : ''),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha turno" />,
      cell: ({ row }) =>
        row.original.hasAppointment ? (row.original.appointmentDate || '—') : '—',
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
          columnId: 'Orden',
          title: 'Orden',
          options: [
            { value: 'si', label: 'Con orden' },
            { value: 'no', label: 'Sin orden' },
          ],
        },
        {
          columnId: 'Turno',
          title: 'Turno',
          options: [
            { value: 'si', label: 'Con turno' },
            { value: 'no', label: 'Sin turno' },
          ],
        },
        {
          columnId: 'Estado',
          title: 'Estado',
          options: [
            { value: 'red', label: 'Sin gestionar' },
            { value: 'amber', label: 'Incompleta' },
            { value: 'green', label: 'Completa' },
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
