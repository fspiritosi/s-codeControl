'use client';

import { Badge } from '@/components/ui/badge';
import { CardTitle } from '@/components/ui/card';
import { FormattedSolicitudesRepair } from '@/types/types';
import { ColumnDef } from '@tanstack/react-table';
import moment from 'moment';
import { criticidad, labels, statuses } from '../data';
import RepairModal from './RepairModal';
import { DataTableColumnHeader } from './data-table-column-header';

export const repairSolicitudesColums: ColumnDef<FormattedSolicitudesRepair[0]>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Titulo" className="ml-2" />,
    cell: ({ row }) => {
      return (
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
      );
    },
    filterFn: (row, columnId, filterValue) => {
      // console.log(filterValue, 'filterValue');
      const cellValue = row.getValue(columnId);

      if (typeof cellValue === 'string' && Array.isArray(filterValue)) {
        return filterValue.some((value) => cellValue.toLowerCase().includes(value.toLowerCase()));
      }

      return false;
    },
  },
  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripcion" />,
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[400px] truncate font-medium">{row.original.user_description}</span>
        </div>
      );
    },
  },
  // {
  //   accessorKey: 'id',
  //   header: ({ column }) => <DataTableColumnHeader column={column} title="Task" />,
  //   cell: ({ row }) => <div className="w-[80px]">{row.getValue('id')}</div>,
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: 'state',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const state = statuses.find((status) => status.value === row.original.state);

      if (!state) {
        return null;
      }

      return (
        <div className={`flex  items-center ${state.color}`}>
          {state.icon && <state.icon className={`mr-2 h-4 w-4 ${state.color}`} />}
          <span>{state.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Criticidad" />,
    cell: ({ row }) => {
      const priority = criticidad.find((priority) => priority.value === row.getValue('priority'));
      const label = labels.find((label) => label.value === row.original.priority);
      if (!priority) {
        return null;
      }

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
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'intern_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Numero interno" />,
    cell: ({ row }) => {
      return <div className="flex items-center">{row.original.intern_number}</div>;
    },
  },
  {
    accessorKey: 'domain',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Equipo" />,
    cell: ({ row }) => {
      return <div className="flex items-center">{row.original.domain}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'fecha',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => {
      return <div className="flex items-center">{moment(row.original.created_at).format('DD/MM/YYYY')}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return <RepairModal row={row} />;
    },
  },
];
