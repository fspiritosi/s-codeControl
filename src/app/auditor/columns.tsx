'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'

type Colum = {
  date: string
  companyName: string
  allocated_to: string
  documentName: string
  multiresource: string
  validity: string
  id: string
  resource: string
  state: string
}

export const AuditorColums: ColumnDef<Colum>[] = [
  {
    accessorKey: 'date',
    sortingFn: 'datetime',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'companyName',
    header: 'Empresa',
  },
  {
    accessorKey: 'resource',
    header: 'Recurso',
  },
  {
    accessorKey: 'allocated_to',
    header: 'Afectado a',
  },
  {
    accessorKey: 'documentName',
    header: 'Documento',
  },
  {
    accessorKey: 'state',
    header: 'Estado',
    cell: ({ row }) => {
      const variants: {
        [key: string]:
          | 'destructive'
          | 'success'
          | 'default'
          | 'secondary'
          | 'outline'
          | 'yellow'
          | null
          | undefined
      } = {
        vencido: 'yellow',
        rechazado: 'destructive',
        aprobado: 'success',
        presentado: 'default',
      }
      return (
        <Badge variant={variants[row.original.state]}>
          {row.original.state}
        </Badge>
      )
    },
  },

  {
    accessorKey: 'multiresource',
    header: 'Multirecurso',
  },
  {
    accessorKey: 'validity',
    header: 'Vence',
  },
  {
    accessorKey: 'id',
    header: 'Auditar',
    cell: ({ row }) => {
      console.log(row.original, 'row')
      return (
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="default">Auditar</Button>
          </DrawerTrigger>
          <DrawerContent className='bg-red-200'>
            <div className="mx-auto max-w-sm  w-screen flex justify-center">
              <div className="flex w-screen">
                <DrawerHeader>
                  <DrawerTitle>
                    Este documeto pertenece a {row.original.resource}
                  </DrawerTitle>
                  <DrawerDescription>
                    La empresa {row.original.companyName} ha presentado el
                    documento
                  </DrawerDescription>
                </DrawerHeader>

                <embed
                  src="https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/document_files/12341234-AltaTempranaAFIP.pdf"
                  className="w-[70vw] h-[90vh] max-h-[80vh] relative"
                />
              </div>
              {/* <DrawerFooter>
                <Button>Aprobar </Button>
                <DrawerClose asChild>
                  <Button variant="outline">Rechazar</Button>
                </DrawerClose>
              </DrawerFooter> */}
            </div>
          </DrawerContent>
        </Drawer>
      )
    },
  },
]
