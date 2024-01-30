/**
 * This file contains the definition of the columns used in the dashboard.
 */

'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'

/**
 * The columns used in the dashboard table.
/*

ejemplo de los datos enviados para cada columna
  const data = [
    {
      full_name: 'Juan Perez',
      email: 'empleado1@hotmail.com',
      cuil: '20-12345678-9',
      document_number: '12345678',
      hierarchical_position: 'Empleado',
      company_position: 'Empleado',
      normal_hours: '8',
      type_of_contract: 'Full Time',
      allocated_to: 'Empresa 1',
    }
  ]

*/

type Colum = {
  full_name: string
  email: string
  cuil: string
  document_number: string
  hierarchical_position: string
  company_position: string
  normal_hours: string
  type_of_contract: string
  allocated_to: string
}

export const columns: ColumnDef<Colum>[] = [
  {
    id: 'actions',
    cell: ({ row }: { row: any }) => {
      const user = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copiar DNI
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver empleado</DropdownMenuItem>
            <DropdownMenuItem>Editar empleado</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    accessorKey: 'full_name',
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0"
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'cuil',
    header: 'Cuil',
  },
  {
    accessorKey: 'document_number',
    header: 'Numero de documento',
  },
  {
    accessorKey: 'hierarchical_position',
    header: 'Posicion jerarquica',
  },
  {
    accessorKey: 'company_position',
    header: 'Posicion en la empresa',
  },
  {
    accessorKey: 'normal_hours',
    header: 'Horas normales',
  },
  {
    accessorKey: 'type_of_contract',
    header: 'Tipo de contrato',
  },
  {
    accessorKey: 'allocated_to',
    header: 'Asignado a',
  },
]
