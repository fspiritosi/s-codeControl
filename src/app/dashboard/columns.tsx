/**
 * This file contains the definition of the columns used in the dashboard.
 */

'use client'

import { Employee } from '@/types/types'
import { ColumnDef } from '@tanstack/react-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { MoreHorizontal,ArrowUpDown } from "lucide-react"
 

/**
 * The columns used in the dashboard table.
 */
export const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: 'foto',
    header: 'Foto',
  },
  {
    accessorKey: 'nombre',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className='p-0'
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
    accessorKey: 'document',
    header: 'Numero de documento',
  },
  {
    id: "actions",
    cell: ({ row }) => {
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
              Copiar ID del empleado
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver empleado</DropdownMenuItem>
            <DropdownMenuItem>Editar empleado</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
