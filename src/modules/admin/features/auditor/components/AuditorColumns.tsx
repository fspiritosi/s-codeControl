'use client';

import { Badge } from '@/shared/components/ui/badge';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

type Colum = {
  date: string;
  companyName: string;
  allocated_to: string;
  documentName: string;
  multiresource: string;
  validity: string;
  id: string;
  resource: string;
  state: string;
};

export const AuditorColums: ColumnDef<Colum>[] = [
  {
    accessorKey: 'date',
    sortingFn: 'datetime',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Subido el
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue('date') as string;
      return value ? format(new Date(value), 'dd/MM/yyyy') : '';
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
        [key: string]: 'destructive' | 'success' | 'default' | 'secondary' | 'outline' | 'yellow' | null | undefined;
      } = {
        vencido: 'yellow',
        rechazado: 'destructive',
        aprobado: 'success',
        presentado: 'default',
      };
      return <Badge variant={variants[row.original.state]}>{row.original.state}</Badge>;
    },
  },

  {
    accessorKey: 'multiresource',
    header: 'Multirecurso',
  },
  {
    accessorKey: 'validity',
    header: 'Vence',
    cell: ({ row }) => {
      const value = row.getValue('validity') as string;
      return value ? format(new Date(value), 'dd/MM/yyyy') : '';
    },
  },
  {
    accessorKey: 'id',
    header: 'Auditar',
    cell: ({ row }) => {
      return (
        <Link href={`/admin/auditor/${row.original.id}`} className={buttonVariants({ variant: 'default' })}>
          Auditar
        </Link>
      );
    },
  },
];
