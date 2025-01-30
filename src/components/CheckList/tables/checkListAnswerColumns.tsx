'use client';

import { PDFPreviewDialog } from '@/components/pdf-preview-dialog';
import { TransporteSPANAYCHKHYS04 } from '@/components/pdf/generators/TransporteSPANAYCHKHYS04';
import { PersonIcon } from '@radix-ui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import moment from 'moment';
import { DataTableColumnHeader } from './data-table-column-header';

export const checkListAnswerColumns: ColumnDef<{
  id: string;
  domain: string;
  chofer: string;
  kilometer: string;
  created_at: string;
}>[] = [
  {
    accessorKey: 'domain',
    id: 'Dominio',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Dominio" />,
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">{row.original.domain}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'id',
    header: ({ column }) => null,
    cell: ({ row }) => {
      return null;
    },
  },
  {
    accessorKey: 'chofer',
    id: 'Chofer',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Chofer" />,
    cell: ({ row }) => {
      return (
        <div className="flex  items-center">
          <PersonIcon className="mr-1 text-gray-600" />
          {row.getValue('Chofer')}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'kilometer',
    id: 'Kilometraje',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kilometraje" />,
    cell: ({ row }) => {
      return <div className="flex w-[100px] items-center">{row.getValue('Kilometraje')}</div>;
    },
  },
  {
    accessorKey: 'created_at',
    id: 'Fecha',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Creación" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{moment(row.getValue('Fecha')).format('DD/MM/YYYY')}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  // {
  //   id: 'actions',
  //   cell: ({ row }) => {
  //     return (
  //       <PDFPreviewDialog
  //         title="Inspección Diaria de Vehículo"
  //         description={`Conductor: ${row.original.chofer || 'No especificado'} - Vehículo: ${row.original.domain || 'No especificado'}`}
  //         buttonText="Ver PDF"
  //         className="ml-auto"
  //       >
  //         <div className="h-full w-full bg-white">
  //           <TransporteSPANAYCHKHYS04
  //             data={{
  //               movil: row.original.domain,
  //               kilometraje: row.original.kilometer,
  //               fecha: row.original.created_at,
  //               ...row.original,
  //               chofer: row.original.chofer,
  //             }}
  //             preview={true}
  //           />
  //         </div>
  //       </PDFPreviewDialog>
  //     );
  //   },
  
];
