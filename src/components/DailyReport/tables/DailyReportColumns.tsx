'use client';

import { DataTableColumnHeader } from '@/components/CheckList/tables/data-table-column-header';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import moment from 'moment';
import { DailyReportItem } from '../DailyReport';

export const dailyColumns: ColumnDef<DailyReportItem>[] = [
  {
    accessorKey: 'customer',
    id: 'Cliente',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
    cell: ({ row }) => {
      return <div className="flex  items-center">{row.getValue('Cliente')}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'services',
    id: 'Servicios',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Servicios" />,
    cell: ({ row }) => {
      return <div className="flex  items-center">{row.getValue('Servicios')}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },

  {
    accessorKey: 'item',
    id: 'Item',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Item" />,
    cell: ({ row }) => {
      return <div className="flex  items-center">{row.getValue('Item')}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'employees',
    id: 'Empleados',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Empleados" />,
    cell: ({ row }) => {
      return <div className="flex  items-center">{row.getValue('Empleados')}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'equipment',
    id: 'Equipos',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Equipos" />,
    cell: ({ row }) => {
      return <div className="flex  items-center">{row.getValue('Equipos')}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'working_day',
    id: 'Jornada',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jornada" />,
    cell: ({ row }) => {
      return <div className="flex  items-center">{row.getValue('Jornada')}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'start_time',
    id: 'Hora inicio',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hora inicio" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{moment(row.getValue('Hora inicio')).format('DD/MM/YYYY')}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'end_time',
    id: 'Hora fin',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hora fin" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{moment(row.getValue('Hora fin')).format('DD/MM/YYYY')}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'status',
    id: 'Estado',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      return <div className="flex  items-center">{row.getValue('Estado')}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'description',
    id: 'Descripción',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
    cell: ({ row }) => {
      return <div className="flex  items-center">{row.getValue('Descripción')}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'document_path',
    id: 'document_path',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Acciones" />,
    cell: ({ row }) => {
      return <Button>Probando</Button>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
];
