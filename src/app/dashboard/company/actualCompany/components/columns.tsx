'use client'

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
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SharedUser } from '@/zodSchemas/schemas'
import { ColumnDef } from '@tanstack/react-table'
import { formatRelative } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { supabase } from '../../../../../../supabase/supabase'
import { DataTableColumnHeader } from './data-table-column-header'

export const columns: ColumnDef<SharedUser>[] = [
  {
    accessorKey: 'fullname',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nombre" />
    ),
    cell: ({ row }) => <div className="">{row.getValue('fullname')}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Correo" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2 items-center">
          {
            <Avatar className="">
              <AvatarImage
                src={row.getValue('img') || '/images/avatar-placeholder.svg'}
                alt="Logo de la empresa"
                className="rounded-full object-cover"
              />
              <AvatarFallback>Logo</AvatarFallback>
            </Avatar>
          }
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue('email')}
          </span>
        </div>
      )
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
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rol" />
    ),
    cell: ({ row }) => {
      const changeRole = async (role: string) => {
        toast.promise(
          async () => {
            const { data, error } = await supabase
              .from('share_company_users')
              .update({ role })
              .eq('id', row.getValue('id'))
              .select()
          },
          {
            loading: 'Cargando...',
            success: data => {
              return `El rol ha sido cambiado a ${role}`
            },
            error: 'Error',
          },
        )
      }
      return (
        <div className="flex w-[100px] items-center">
          <Select
            onValueChange={e => changeRole(e)}
            defaultValue={row.getValue('role')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Rol 1">Rol 1</SelectItem>
              <SelectItem value="Rol 2">Rol 2</SelectItem>
              <SelectItem value="Rol 3">Rol 3</SelectItem>
              <SelectItem value="colaborador">Colaborador</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'alta',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha de alta" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>
            {formatRelative(new Date(row.getValue('alta')), new Date(), {
              locale: es,
            })}
          </span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const handleDelete = async () => {
        toast.promise(
          async () => {
            const { data, error } = await supabase
              .from('share_company_users')
              .delete()
              .eq('id', row.getValue('id'))
              .select()
          },
          {
            loading: 'Cargando...',
            success: data => {
              return 'Usuario eliminado'
            },
            error: 'Error',
          },
        )
      }
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant={'destructive'}>Eliminar</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Confirmar eliminación de la empresa
              </AlertDialogTitle>
              <AlertDialogDescription>
                Este usuario dejara de tener acceso a la empresa
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button onClick={handleDelete} variant={'destructive'}>
                  Eliminar
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    },
    header: ({ column }) => 'Eliminar',
  },
]
