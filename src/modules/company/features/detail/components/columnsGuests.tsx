'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { handleSupabaseError } from '@/shared/lib/errorHandler';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { SharedUser } from '@/shared/zodSchemas/schemas';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { toast } from 'sonner';
import { deleteShareCompanyUser } from '@/modules/company/features/users/actions.server';
import { DataTableColumnHeader } from '@/shared/components/data-table';
import { useRouter } from 'next/navigation';

export const columnsGuests: ColumnDef<SharedUser>[] = [
  {
    accessorKey: 'fullname',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) => <div className="">{row.getValue('fullname')}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Correo" />,
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2 items-center">
          {
            <Avatar className="">
              <AvatarImage src={row.getValue('img')} alt="Logo de la empresa" className="rounded-full object-cover" />
              <AvatarFallback>Logo</AvatarFallback>
            </Avatar>
          }
          <span className="max-w-[500px] truncate font-medium">{row.getValue('email')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'customerName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre del cliente" />,
    cell: ({ row }) => {
      return <div className="flex space-x-2 items-center">{<Badge>{row.original.customerName}</Badge>}</div>;
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
  //   {
  //     accessorKey: 'role',
  //     header: ({ column }) => <DataTableColumnHeader column={column} title="Rol" />,
  //     cell: ({ row }) => {
  //       const [roles, setRoles] = useState<any[] | null>([]);

  //       const getRoles = async () => {
  //         let { data: roles, error } = await supabase.from('roles').select('*').eq('intern', false).neq('name', 'Invitado');
  //         setRoles(roles);
  //       };

  //       useEffect(() => {
  //         getRoles();
  //       }, []);

  //       const changeRole = async (role: string) => {
  //         toast.promise(
  //           async () => {
  //             const { data, error } = await supabase
  //               .from('share_company_users')
  //               .update({ role })
  //               .eq('id', row.getValue('id'))
  //               .select();

  //             if (error) {
  //               throw new Error(handleSupabaseError(error.message));
  //             }
  //           },
  //           {
  //             loading: 'Cargando...',
  //             success: (data) => {
  //               return `El rol ha sido cambiado a ${role}`;
  //             },
  //             error: (error) => {
  //               return error;
  //             },
  //           }
  //         );
  //       };
  //       return (
  //         <div className="flex w-[100px] items-center">
  //           <Select
  //             onValueChange={(e) => changeRole(e)}
  //             defaultValue={row.original?.role}
  //             disabled={row.original?.role === 'Propietario'}
  //           >
  //             <SelectTrigger className="w-[180px]">
  //               <SelectValue placeholder="Rol" />
  //             </SelectTrigger>
  //             <SelectContent>
  //               {roles?.map((role) => (
  //                 <SelectItem key={role.id} value={role.name}>
  //                   {role.name}
  //                 </SelectItem>
  //               ))}
  //               {row.original?.role === 'Propietario' ? (
  //                 <SelectItem defaultValue={'Propietario'} disabled value="Propietario">
  //                   Propietario
  //                 </SelectItem>
  //               ) : null}
  //             </SelectContent>
  //           </Select>
  //         </div>
  //       );
  //     },
  //     filterFn: (row, id, value) => {
  //       return value.includes(row.getValue(id));
  //     },
  //   },
  {
    accessorKey: 'alta',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha de alta" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>
            {format(new Date(row.getValue('alta')), 'dd/MM/yyyy')}
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
      const router = useRouter();

      const handleDelete = async () => {
        toast.promise(
          async () => {
            const { error } = await deleteShareCompanyUser(row.getValue('id'));

            if (error) {
              throw new Error(handleSupabaseError(error));
            }
          },
          {
            loading: 'Eliminando...',
            success: (data) => {
              useLoggedUserStore?.getState()?.FetchSharedUsers();
              return 'Usuario eliminado';
            },
            error: (error) => {
              return error;
            },
          }
        );
        router.refresh()
      };
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={row.getValue('role') === 'Propietario'} variant={'destructive'}>
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar eliminación de la empresa</AlertDialogTitle>
              <AlertDialogDescription>Este usuario dejara de tener acceso a la empresa</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  disabled={row.getValue('role') === 'Propietario'}
                  onClick={handleDelete}
                  variant={'destructive'}
                >
                  Eliminar
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
    header: ({ column }) => 'Eliminar',
  },
];
