'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { DataTableColumnHeader } from '@/shared/components/data-table';
import { formatDateUTC } from '@/shared/lib/utils/formatters';
import type { TorqueCertificateRow } from '../actions.server';
import { SHEET_FORMATS } from '../shared/torque-spec';

/**
 * Columnas del listado de certificados de torqueo (tsk-575 task 6). El
 * vehículo se muestra con los campos snapshot (`vehicle_domain` /
 * `vehicle_intern_number`), no con la relación, para que un certificado ya
 * emitido no cambie si después se corrige el equipo.
 */

const SHEET_FORMAT_LABEL = new Map(SHEET_FORMATS.map((f) => [f.value, f.label]));

export const torqueCertificateColumns: ColumnDef<TorqueCertificateRow>[] = [
  {
    accessorKey: 'full_number',
    id: 'full_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Número" />,
    cell: ({ row }) => (
      <Link
        href={`/dashboard/maintenance/torque/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.full_number}
      </Link>
    ),
  },
  {
    id: 'date',
    accessorFn: (row) => formatDateUTC(row.date),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => <span>{formatDateUTC(row.original.date)}</span>,
  },
  {
    accessorKey: 'vehicle_domain',
    id: 'vehicle_domain',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vehículo" />,
    cell: ({ row }) => <span>{row.original.vehicle_domain ?? '—'}</span>,
  },
  {
    accessorKey: 'vehicle_intern_number',
    id: 'vehicle_intern_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Interno" />,
    cell: ({ row }) => <span>{row.original.vehicle_intern_number ?? '—'}</span>,
  },
  {
    accessorKey: 'mechanic_name',
    id: 'mechanic_name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Mecánico" />,
    cell: ({ row }) => <span>{row.original.mechanic_name}</span>,
  },
  {
    accessorKey: 'sheet_format',
    id: 'sheet_format',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Formato" />,
    cell: ({ row }) => <span>{SHEET_FORMAT_LABEL.get(row.original.sheet_format) ?? row.original.sheet_format}</span>,
  },
];
