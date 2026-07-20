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
import {
  SALES_INVOICE_STATUS_LABELS,
  SALES_INVOICE_STATUS_COLORS,
  VOUCHER_TYPE_LABELS,
} from '@/modules/sales/shared/types';
import { confirmSalesInvoice, cancelSalesInvoice, deleteSalesInvoice } from '../actions.server';
import { formatDateUTC } from '@/shared/lib/utils/formatters';
import { MoreHorizontal, Eye, CheckCircle, Pencil, Trash2, Ban } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

function ActionsCell({ row }: { row: any }) {
  const router = useRouter();
  const status = row.original.status;
  const id = row.original.id;
  const fullNumber = row.original.full_number || 'Borrador';
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const isDraft = status === 'DRAFT';
  const isConfirmed = ['CONFIRMED', 'PARTIAL_PAID', 'PAID'].includes(status);

  const handleDelete = () => {
    toast.promise(
      async () => {
        const result = await deleteSalesInvoice(id);
        if (result.error) throw new Error(result.error);
        router.refresh();
      },
      { loading: 'Eliminando...', success: 'Factura eliminada', error: (e) => e.message }
    );
  };

  const handleCancel = () => {
    toast.promise(
      async () => {
        const result = await cancelSalesInvoice(id);
        if (result.error) throw new Error(result.error);
        router.refresh();
      },
      { loading: 'Anulando...', success: 'Factura anulada', error: (e) => e.message }
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
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/sales/invoices/${id}`}>
              <Eye className="size-4 mr-2" /> Ver detalle
            </Link>
          </DropdownMenuItem>
          {isDraft && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/sales/invoices/${id}/edit`}>
                  <Pencil className="size-4 mr-2" /> Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  toast.promise(
                    async () => {
                      const result = await confirmSalesInvoice(id);
                      if (result.error) throw new Error(result.error);
                      router.refresh();
                    },
                    { loading: 'Confirmando...', success: 'Factura confirmada', error: (e) => e.message }
                  );
                }}
              >
                <CheckCircle className="size-4 mr-2" /> Confirmar
              </DropdownMenuItem>
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
          {isConfirmed && (
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
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar borrador</AlertDialogTitle>
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

      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular factura {fullNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              La factura pasará a estado Anulada. No se puede anular si tiene recibos aplicados.
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
    </>
  );
}

export function makeSalesInvoiceColumns(): ColumnDef<any>[] {
  return [
    {
      accessorKey: 'full_number',
      header: 'Comprobante',
      meta: { title: 'Comprobante' },
      cell: ({ row }) =>
        row.original.full_number ? (
          <span className="font-mono font-medium">{row.original.full_number}</span>
        ) : (
          <span className="text-muted-foreground italic">Borrador</span>
        ),
    },
    {
      accessorKey: 'voucher_type',
      header: 'Tipo',
      meta: { title: 'Tipo' },
      cell: ({ row }) => (
        <Badge variant="outline">
          {VOUCHER_TYPE_LABELS[row.original.voucher_type] || row.original.voucher_type}
        </Badge>
      ),
      filterFn: 'equals',
    },
    {
      id: 'customer',
      header: 'Cliente',
      meta: { title: 'Cliente' },
      cell: ({ row }) => <span className="text-sm">{row.original.customer?.name}</span>,
    },
    {
      accessorKey: 'issue_date',
      header: 'Fecha',
      meta: { title: 'Fecha' },
      cell: ({ row }) => <span className="text-sm">{formatDateUTC(row.original.issue_date)}</span>,
    },
    {
      accessorKey: 'total',
      header: 'Total',
      meta: { title: 'Total' },
      cell: ({ row }) => {
        const currency = row.original.currency || 'ARS';
        const total = Number(row.original.total);
        const symbol = currency === 'USD' ? 'US$' : '$';
        return (
          <div className="text-right font-medium">
            {symbol} {total.toFixed(2)}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      meta: { title: 'Estado' },
      cell: ({ row }) => {
        const s = row.original.status;
        const variant = SALES_INVOICE_STATUS_COLORS[s] || 'secondary';
        return <Badge variant={variant as any}>{SALES_INVOICE_STATUS_LABELS[s] || s}</Badge>;
      },
      filterFn: 'equals',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <ActionsCell row={row} />,
    },
  ];
}
