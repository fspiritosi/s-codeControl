'use client';

import { DataTableColumnHeader } from '@/components/CheckList/tables/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import moment from 'moment';

type Colum = {
  id: string;
  created_at: string;
  employee_id: string;
  diagram_type_id: string;
  name: string;
  color: string;
  company_id: string;
  diagram_type_created_at: string;
  short_description: string;
  day: number;
  month: number;
  year: number;
};

export const DetailDiagramColums: ColumnDef<Colum>[] = [
  {
    accessorKey: 'created_at',
    id: 'Fecha',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => {
      return moment(row.original.created_at).format('DD/MM/YYYY');
    },
    enableHiding: false,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'short_description',
    id: 'Descripción',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripcion" />,
    cell: ({ row }) => (
      <Badge variant={'outline'} style={{ color: row.original.color, border: `1px solid ${row.original.color}` }}>
        {row.getValue('Descripción')}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'name',
    id: 'Estado',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      return <div className="flex gap-2 items-center">{row.original.name}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
];
