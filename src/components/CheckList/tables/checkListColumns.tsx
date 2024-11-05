'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ColumnDef } from '@tanstack/react-table';
import { ClipboardList } from 'lucide-react';
import moment from 'moment';
import { frecuencias } from './data';
import { DataTableColumnHeader } from './data-table-column-header';

export const checkListColumns: ColumnDef<{
  title: string;
  description: string;
  frequency: string;
  created_at: string;
  id: string;
  total_responses: number;
}>[] = [
  {
    accessorKey: 'title',
    id: 'Titulo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">{row.getValue('Titulo')}</span>
          <TooltipProvider>
            <Tooltip delayDuration={50}>
              <TooltipTrigger asChild>
                <div className="relative z-50">
                  <Badge variant={'outline'}>
                    <ClipboardList className="size-4 mr-2" />
                    {row.original.total_responses}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>Cantidad de respuestas: {row.original.total_responses}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // console.log('row', row);
      // console.log('id', id);
      // console.log('value', value);

      return (
        row.original.title.toLowerCase().includes(value.toLowerCase()) ||
        row.original.description.toLowerCase().includes(value.toLowerCase())
      );
    },
  },
  {
    accessorKey: 'id',
    id: 'id',
    header: ({ column }) => null,
    cell: ({ row }) => {
      return null;
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
    accessorKey: 'frequency',
    id: 'Frecuencia',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Frecuencia" />,
    cell: ({ row }) => {
      const icon = frecuencias.find((f) => f.label === row.getValue('Frecuencia'));
      return (
        <div className="flex w-[100px] items-center">
          {icon?.icon && <icon.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
          {row.getValue('Frecuencia')}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'created_at',
    id: 'Creación',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Creación" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{moment(row.getValue('Creación')).format('DD/MM/YYYY')}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
];
