'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useLoggedUserStore } from '@/store/loggedUser';
import { SharedUser } from '@/zodSchemas/schemas';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import { formatRelative } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AddCompanyDocumentForm from './AddCompanyDocumentForm';
import { DataTableColumnHeader } from './data-table-column-header';

export const columnsDocuments: ColumnDef<SharedUser>[] = [
  {
    accessorKey: 'fullname',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre del documento" />,
    cell: ({ row }) => <div className="">{row.getValue('fullname')}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subido por" />,
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2 items-center">
          {row.getValue('email') !== 'Documento pendiente' ? (
            <>
              <Avatar className="">
                <AvatarImage src={row.getValue('img')} alt="Logo de la empresa" className="rounded-full object-cover" />
                <AvatarFallback>Logo</AvatarFallback>
              </Avatar>
              <span className="max-w-[500px] truncate font-medium">{row.getValue('email')}</span>
            </>
          ) : (
            <Badge variant="destructive">Documento pendiente</Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'id',
    header: ({ column }) => null,
    cell: ({ row }) => null,
  },
  {
    accessorKey: 'img',
    header: ({ column }) => null,
    cell: ({ row }) => null,
  },
  {
    accessorKey: 'documentId',
    header: ({ column }) => null,
    cell: ({ row }) => null,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rol" />,
    cell: ({ row }) => {
      return (
        <div className="flex w-[100px] items-center">
          <p>
            {row.getValue('role') !== 'Documento pendiente' ? (
              row.getValue('role')
            ) : (
              <Badge className="bg-muted">
                {' '}
                <ExclamationTriangleIcon className="text-red-700" />
              </Badge>
            )}
          </p>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'alta',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subido el" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>
            {row.getValue('alta') !== 'Documento pendiente' ? (
              formatRelative(new Date(row.getValue('alta')), new Date(), {
                locale: es,
              })
            ) : (
              <Badge className="bg-muted">
                {' '}
                <ExclamationTriangleIcon className="text-red-700" />
              </Badge>
            )}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'private',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Acceso" />,
    cell: ({ row }) => {
      const pathname = usePathname();
      const router = useRouter();
      if (!pathname.includes('company')) {
        return (
          <div className="flex items-center">
            <span>
              {row.getValue('private') ? (
                <Badge variant={'outline'} className="bg-muted">
                  {' '}
                  Documento privado
                </Badge>
              ) : (
                <Badge variant={'outline'} className="bg-muted">
                  Documento publico
                </Badge>
              )}
            </span>
          </div>
        );
      } else {
        const handlePrivateChange = async (selected: string) => {
          toast.promise(
            async () => {
              const supabase = supabaseBrowser();
              const documetsFetch = useLoggedUserStore?.getState?.().documetsFetch;
              const { error } = await supabase
                .from('document_types')
                .update({ private: selected === 'Privado' })
                .eq('id', row.original.id);

              if (error) {
                throw new Error(handleSupabaseError(error.message));
              }
              documetsFetch();
              router.refresh();
            },
            {
              loading: 'Cambiando...',
              success: 'Documento actualizado correctamente',
              error: (error) => {
                return error;
              },
            }
          );
        };
        return (
          <div className="flex items-center">
            <Select
              onValueChange={(selected) => handlePrivateChange(selected)}
              defaultValue={row.getValue('private') ? 'Privado' : 'Publico'}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Privado">Privado</SelectItem>
                <SelectItem value="Publico">Público</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      }
    },
  },
  {
    accessorKey: 'vencimiento',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimiento" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>
            {row.getValue('vencimiento') !== 'Documento pendiente' && row.getValue('vencimiento') !== 'No expira' ? (
              row.getValue('vencimiento')
            ) : (
              <Badge className="bg-muted  dark:text-white text-black">
                {' '}
                {row.getValue('vencimiento') === 'No expira' ? (
                  'No vence'
                ) : (
                  <ExclamationTriangleIcon className="text-red-700" />
                )}
              </Badge>
            )}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const documentId = row.getValue('id');
      const email = row.getValue('email');
      // if (email) {
      //   return <Link href={`/dashboard/document/${documentId}`}></Link>;
      // }
      const redirectId = row.getValue('documentId');
      if (
        row.original.email === 'Documento pendiente' &&
        useLoggedUserStore.getState().roleActualCompany === 'Invitado'
      ) {
        return <Button disabled>Falta subir</Button>;
      }
      return (
        <AddCompanyDocumentForm
          documentId={documentId as string}
          documentIsUploaded={email !== 'Documento pendiente'}
          redirectId={redirectId as string}
        />
      );
    },
    header: ({ column }) => 'Visualizar',
  },
];
