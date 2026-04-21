'use client';

import { DataTableColumnHeader } from '@/shared/components/data-table';
// import { Button } from '@/shared/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { format, parse, isWithinInterval } from 'date-fns';
// import { DailyReportItem } from '../types';
// import { FilePenLine, Trash2 } from 'lucide-react';
// import  UploadDocument  from '../UploadDocument';
// import { Customers, Services, Items, Employee, Equipment} from '../types';
// import { getCustomerName, getServiceName, getItemName,  getEmployeeNames ,getEquipmentNames  } from '../utils/utils';

export const detailColumns:
// (
  // handleViewDocument: (documentPath: string, row_id?: string) => void,
  // handleEdit: (id: string) => void,
  // handleConfirmOpen: (id: string) => void,
  // companyName: string | undefined,
  // customers: Customers[],
  // services: Services[],
  // items: Items[],
  // canEdit: boolean

// ):
 ColumnDef<any>[] =
   [
  {
    accessorKey: 'date',
    id: 'Fecha',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{format(new Date(row.getValue('Fecha')), 'dd/MM/yyyy')}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const rowDate = parse(format(new Date(row.getValue(id)), 'dd/MM/yyyy'), 'dd/MM/yyyy', new Date());
      const startDate = parse(value[0], 'dd/MM/yyyy', new Date());
      const endDate = parse(value[1], 'dd/MM/yyyy', new Date());
      return isWithinInterval(rowDate, { start: startDate, end: endDate });
    },
  },
  {
    accessorKey: 'customer_name',
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
    accessorKey: 'service_name',
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
    accessorKey: 'item_name',
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
          <span>{format(new Date(row.getValue('Hora inicio')), 'dd/MM/yyyy')}</span>
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
          <span>{format(new Date(row.getValue('Hora fin')), 'dd/MM/yyyy')}</span>
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

];