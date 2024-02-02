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
import Link from 'next/link'

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
  picture: string
  nationality: string
  lastname: string
  firstname: string
  bitrhplace: string
  document_type: undefined //Este header debe ser un select a partir de un arreglo de opciones
  gender: string
  marital_status: string
  level_of_education: string
  street: string
  street_number: string
  province: string
  postal_code: string
  phone: string
  file: string
  date_of_admission: string
  affiliate_status: string
  city: string
  hierrical_position: string
  workflow_diagram: string
  birthplace: string
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
              onClick={() =>
                navigator.clipboard.writeText(user.document_number)
              }
            >
              Copiar DNI
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/dashboard/employee/view/${user.document_number}`}>
                Ver empleado
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/dashboard/employee/edit/${user.document_number}`}>
                Editar empleado
              </Link>
            </DropdownMenuItem>
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
          Nombre completo
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
  {
    accessorKey: 'picture',
    header: 'Foto',
  },
  {
    accessorKey: 'nationality',
    header: 'Nacionalidad',
  },
  {
    accessorKey: 'lastname',
    header: 'Apellido',
  },
  {
    accessorKey: 'firstname',
    header: 'Nombre',
  },
  {
    accessorKey: 'birthplace',
    header: 'Lugar de nacimiento',
  },
  {
    accessorKey: 'document_type',
    header: 'Tipo de documento',
  },
  {
    accessorKey: 'gender',
    header: 'Genero',
  },
  {
    accessorKey: 'marital_status',
    header: 'Estado civil',
  },
  {
    accessorKey: 'level_of_education',
    header: 'Nivel de estudios',
  },
  {
    accessorKey: 'street',
    header: 'Calle',
  },
  {
    accessorKey: 'street_number',
    header: 'Numero de calle',
  },
  {
    accessorKey: 'province',
    header: 'Provincia',
  },
  {
    accessorKey: 'postal_code',
    header: 'Codigo postal',
  },
  {
    accessorKey: 'phone',
    header: 'Telefono',
  },
  {
    accessorKey: 'file',
    header: 'Legajo',
  },
  {
    accessorKey: 'date_of_admission',
    header: 'Fecha de ingreso',
  },
  {
    accessorKey: 'affiliate_status',
    header: 'Estado de afiliado',
  },
  {
    accessorKey: 'city',
    header: 'Ciudad',
  },
  {
    accessorKey: 'hierrical_position',
    header: 'Posicion jerarquica',
  },
  {
    accessorKey: 'workflow_diagram',
    header: 'Diagrama de flujo',
  },
]
