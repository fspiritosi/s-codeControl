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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { RECEIPT_STATUS_LABELS, RECEIPT_STATUS_COLORS } from '@/modules/sales/shared/types';
import { confirmReceipt, cancelReceipt, deleteReceipt } from '../actions.server';
import { formatDateUTC, formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { MoreHorizontal, Eye, CheckCircle, Pencil, Trash2, Ban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export interface ReceiptRow {
  id: string;
  full_number: string | null;
  status: string;
  date: string | Date;
  total_amount: number;
  items_count: number;
  customer?: { name: string } | null;
}

export interface ReceiptColumnHandlers {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

function ActionsCell({ row, onView, onEdit }: { row: ReceiptRow } & ReceiptColumnHandlers) {
  const router = useRouter();
  const { id, status } = row;
  const fullNumber = row.full_number ?? '';
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const handleConfirm = () => {
    toast.promise(
      async () => {
        const result = await confirmReceipt(id);
        if (result.error) throw new Error(result.error);
        router.refresh();
      },
      { loading: 'Confirmando...', success: 'Recibo confirmado', error: (e) => e.message }
    );
  };

  const handleCancel = () => {
    toast.promise(
      async () => {
        const result = await cancelReceipt(id);
        if (result.error) throw new Error(result.error);
        router.refresh();
      },
      { loading: 'Anulando...', success: 'Recibo anulado', error: (e) => e.message }
    );
  };

  const handleDelete = () => {
    toast.promise(
      async () => {
        const result = await deleteReceipt(id);
        if (result.error) throw new Error(result.error);
        router.refresh();
      },
      { loading: 'Eliminando...', success: 'Recibo eliminado', error: (e) => e.message }
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onView(id)}>
            <Eye className="size-4 mr-2" /> Ver detalle
          </DropdownMenuItem>

          {status === 'DRAFT' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onEdit(id)}>
                <Pencil className="size-4 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleConfirm}>
                <CheckCircle className="size-4 mr-2" /> Confirmar
              </DropdownMenuItem>
            </>
          )}

          {status === 'CONFIRMED' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  setConfirmCancelOpen(true);
                }}
              >
                <Ban className="size-4 mr-2" /> Anular
              </DropdownMenuItem>
            </>
          )}

          {status === 'DRAFT' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  setConfirmDeleteOpen(true);
                }}
              >
                <Trash2 className="size-4 mr-2" /> Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular recibo {fullNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              Al anular el recibo se recalculará el saldo de las facturas que cobraba. Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancel}
            >
              Anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar recibo {fullNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción elimina el borrador de forma permanente. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function makeReceiptColumns(handlers: ReceiptColumnHandlers): ColumnDef<ReceiptRow>[] {
  return [
    {
      accessorKey: 'full_number',
      header: 'Número',
      meta: { title: 'Número' },
      cell: ({ row }) => (
        <button
          type="button"
          className="font-mono font-medium text-primary hover:underline"
          onClick={() => handlers.onView(row.original.id)}
        >
          {row.original.full_number}
        </button>
      ),
    },
    {
      id: 'customer',
      header: 'Cliente',
      meta: { title: 'Cliente' },
      cell: ({ row }) => <span className="text-sm">{row.original.customer?.name ?? '—'}</span>,
    },
    {
      accessorKey: 'date',
      header: 'Fecha',
      meta: { title: 'Fecha' },
      cell: ({ row }) => <span className="text-sm">{formatDateUTC(row.original.date)}</span>,
    },
    {
      accessorKey: 'items_count',
      header: 'Facturas',
      meta: { title: 'Facturas' },
      cell: ({ row }) => {
        const count = row.original.items_count ?? 0;
        return (
          <span className="text-sm text-muted-foreground">
            {count} {count === 1 ? 'factura' : 'facturas'}
          </span>
        );
      },
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
      meta: { title: 'Total' },
      cell: ({ row }) => (
        <div className="text-right font-medium">{formatCurrencyARS(row.original.total_amount)}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      meta: { title: 'Estado' },
      cell: ({ row }) => {
        const s = row.original.status;
        const variant = (RECEIPT_STATUS_COLORS[s] ?? 'secondary') as
          | 'default'
          | 'secondary'
          | 'destructive'
          | 'outline'
          | 'success';
        return <Badge variant={variant}>{RECEIPT_STATUS_LABELS[s] ?? s}</Badge>;
      },
      filterFn: 'equals',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionsCell row={row.original} onView={handlers.onView} onEdit={handlers.onEdit} />
      ),
    },
  ];
}
