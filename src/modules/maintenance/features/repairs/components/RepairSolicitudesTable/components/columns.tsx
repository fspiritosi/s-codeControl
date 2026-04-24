'use client';

import { Badge } from '@/shared/components/ui/badge';
import { CardTitle } from '@/shared/components/ui/card';
import { FormattedSolicitudesRepair } from '@/shared/types/types';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { criticidad, labels, statuses } from '../data';
import RepairModal from './RepairModal';
import { DataTableColumnHeader } from '@/shared/components/data-table';

export const repairSolicitudesColums: ColumnDef<FormattedSolicitudesRepair[0]>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Titulo" className="ml-2" />,
    cell: ({ row }) => (
      <RepairModal
        row={row}
        onlyView
        action={
          <div className="flex space-x-2">
            <CardTitle className="max-w-[300px] truncate font-medium hover:underline">
              {row.getValue('title')}
            </CardTitle>
          </div>
        }
      />
    ),
  },
  {
    accessorKey: 'user_description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripcion" />,
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[400px] truncate font-medium">{row.original.user_description}</span>
      </div>
    ),
  },
  {
    accessorKey: 'state',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const state = statuses.find((status) => status.value === row.original.state);
      if (!state) return null;
      return (
        <div className={`flex items-center ${state.color}`}>
          {state.icon && <state.icon className={`mr-2 h-4 w-4 ${state.color}`} />}
          <span>{state.label}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Criticidad" />,
    cell: ({ row }) => {
      const priority = criticidad.find((priority) => priority.value === row.getValue('priority'));
      const label = labels.find((label) => label.value === row.original.priority);
      if (!priority) return null;
      return (
        <Badge
          variant={label?.value === 'Baja' ? 'success' : label?.value === 'Media' ? 'yellow' : 'destructive'}
          className="flex items-center w-fit"
        >
          {priority.icon && <priority.icon className="mr-2 h-4 w-4" />}
          <span>{priority.label}</span>
        </Badge>
      );
    },
  },
  {
    accessorKey: 'intern_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Numero interno" />,
    cell: ({ row }) => <div className="flex items-center">{row.original.intern_number}</div>,
  },
  {
    accessorKey: 'domain',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Equipo" />,
    cell: ({ row }) => <div className="flex items-center">{row.original.domain}</div>,
  },
  {
    accessorKey: 'created_at',
    id: 'created_at',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => (
      <div className="flex items-center">{format(new Date(row.original.created_at), 'dd/MM/yyyy')}</div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <RepairModal row={row} />,
  },
];
