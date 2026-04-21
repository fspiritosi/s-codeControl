'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { RECEIVING_NOTE_STATUS_LABELS } from '@/modules/purchasing/shared/types';
import { confirmReceivingNote, cancelReceivingNote } from '../actions.server';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, CheckCircle, Ban } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

function ActionsCell({ row }: { row: any }) {
  const router = useRouter();
  const status = row.original.status;
  const id = row.original.id;

  const handleAction = (action: () => Promise<{ error: string | null }>, successMsg: string) => {
    toast.promise(
      async () => {
        const result = await action();
        if (result.error) throw new Error(result.error);
        router.refresh();
      },
      { loading: 'Procesando...', success: successMsg, error: (e) => e.message }
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/purchasing/receiving/${id}`}>
            <Eye className="size-4 mr-2" /> Ver detalle
          </Link>
        </DropdownMenuItem>
        {status === 'DRAFT' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction(() => confirmReceivingNote(id), 'Remito confirmado — stock ingresado')}>
              <CheckCircle className="size-4 mr-2" /> Confirmar (ingresar stock)
            </DropdownMenuItem>
          </>
        )}
        {status === 'CONFIRMED' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction(() => cancelReceivingNote(id), 'Remito cancelado — stock revertido')} className="text-destructive">
              <Ban className="size-4 mr-2" /> Cancelar (revertir stock)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const receivingNoteColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'full_number',
    header: 'Número',
    meta: { title: 'Número' },
    cell: ({ row }) => <span className="font-mono font-medium">{row.original.full_number}</span>,
  },
  {
    id: 'supplier',
    header: 'Proveedor',
    meta: { title: 'Proveedor' },
    cell: ({ row }) => <span className="text-sm">{row.original.supplier?.business_name}</span>,
  },
  {
    id: 'warehouse',
    header: 'Almacén',
    meta: { title: 'Almacén' },
    cell: ({ row }) => <span className="text-sm">{row.original.warehouse?.name}</span>,
  },
  {
    accessorKey: 'reception_date',
    header: 'Fecha recepción',
    meta: { title: 'Fecha recepción' },
    cell: ({ row }) => <span className="text-sm">{format(new Date(row.original.reception_date), 'dd/MM/yyyy')}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    meta: { title: 'Estado' },
    cell: ({ row }) => {
      const s = row.original.status;
      const variant = s === 'CONFIRMED' ? 'default' : s === 'CANCELLED' ? 'destructive' : 'secondary';
      return <Badge variant={variant as any}>{RECEIVING_NOTE_STATUS_LABELS[s] || s}</Badge>;
    },
    filterFn: 'equals',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
