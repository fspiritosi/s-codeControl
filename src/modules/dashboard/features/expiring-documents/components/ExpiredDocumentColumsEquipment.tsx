'use client';

import { DataTableColumnHeader } from '@/modules/hse/features/checklist/components/tables/data-table-column-header';
import SimpleDocument from '@/modules/documents/features/upload/components/SimpleDocument';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTrigger } from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { ExclamationTriangleIcon, PersonIcon } from '@radix-ui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import { format, differenceInDays } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';
import { DataTableOptions } from './data-table-options';
import { Truck } from 'lucide-react';

type Colum = {
  vehicle_id?: string | undefined;
  applies: any;
  date: string;
  allocated_to: string | null;
  documentName: string;
  multiresource: string;
  validity: string | null;
  id: string;
  resource: string;
  state: string | null;
  document_number?: string;
  mandatory?: string;
  id_document_types?: string;
  intern_number?: string | undefined | null;
  serie?: string | undefined | null;
  employee_id?: string | undefined;
};

export const ExpiredDocumentColumsEquipment: ColumnDef<Colum>[] = [
  {
    id: 'actions',
    cell: ({ row }: { row: any }) => {
      return <DataTableOptions row={row} />;
    },
  },
  {
    accessorKey: 'resource',
    id: 'Equipment',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Equipos" />,
    cell: ({ row }) => (
      <Link
        href={
           `/dashboard/equipment/action?action=view&id=${row.original.vehicle_id}`
        }
        className="hover:underline"
      >
        <div className="flex gap-2">
          <Truck size={20} />
          {row.getValue('Equipment')}
        </div>
      </Link>
    ),
    enableHiding: false,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'documentName',
    id: 'Documentos',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Documentos" />,
    cell: ({ row }) => <div>{row.getValue('Documentos')}</div>,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'validity',
    id: 'Vencimiento',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimiento" />,
    cell: ({ row }) => {
      const expirationDate = new Date(row.getValue('Vencimiento'));
      const currentDate = new Date();
      const daysDifference = differenceInDays(expirationDate, currentDate);

      let iconColor = '';

      if (daysDifference < 0) {
        iconColor = 'red';
      } else if (daysDifference <= 7) {
        iconColor = 'orange';
      }

      return (
        <div className="flex gap-2 items-center">
          {' '}
          {iconColor && <ExclamationTriangleIcon style={{ color: iconColor }} />}
          {format(expirationDate, 'dd/MM/yyyy')}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'created_at',
    id: 'Subido el',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subido el" />,
    cell: ({ row }) => <div>{format(new Date(row.getValue('Subido el')), 'dd/MM/yyyy')}</div>,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    header: 'Revisar documento',
    cell: ({ row }) => {
      const isNoPresented = row.original.state === 'pendiente';
      const role = useLoggedUserStore?.getState?.().roleActualCompany;

      const [open, setOpen] = useState(false);

      const handleOpen = () => setOpen(!open);
      const applies = row.original.applies === 'Persona' ? 'empleado' : 'equipo';

      if (isNoPresented) {
        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              {role !== 'Invitado' && <Button variant="outline">Subir documento</Button>}
            </AlertDialogTrigger>
            <AlertDialogContent asChild>
              <AlertDialogHeader>
                <div className="max-h-[90vh] overflow-y-auto">
                  <div className="space-y-3">
                    <div>
                      <SimpleDocument
                        resource={applies}
                        handleOpen={() => handleOpen()}
                        defaultDocumentId={row.original.id_document_types}
                        // document={document}
                        numberDocument={row.original.document_number || row.original.vehicle_id}
                      />
                    </div>
                  </div>
                </div>
              </AlertDialogHeader>
            </AlertDialogContent>
          </AlertDialog>
        );
      }

      return (
        <Link href={`/dashboard/document/${row.original.id}?resource=${row.original.applies}`}>
          <Button>Ver documento</Button>
        </Link>
      );
    },
  },
];
