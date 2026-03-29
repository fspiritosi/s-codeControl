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
import { PO_STATUS_LABELS, PO_STATUS_COLORS, PO_INVOICING_STATUS_LABELS } from '@/modules/purchasing/shared/types';
import {
  submitForApproval,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder,
} from '../actions.server';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Send, CheckCircle, XCircle, Ban, Trash2 } from 'lucide-react';
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
          <Link href={`/dashboard/purchasing/orders/${id}`}>
            <Eye className="size-4 mr-2" /> Ver detalle
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {status === 'DRAFT' && (
          <DropdownMenuItem onClick={() => handleAction(() => submitForApproval(id), 'Enviada a aprobación')}>
            <Send className="size-4 mr-2" /> Enviar a aprobación
          </DropdownMenuItem>
        )}
        {status === 'PENDING_APPROVAL' && (
          <>
            <DropdownMenuItem onClick={() => handleAction(() => approvePurchaseOrder(id), 'Orden aprobada')}>
              <CheckCircle className="size-4 mr-2" /> Aprobar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction(() => rejectPurchaseOrder(id), 'Orden rechazada')}>
              <XCircle className="size-4 mr-2" /> Rechazar
            </DropdownMenuItem>
          </>
        )}
        {['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(status) && (
          <DropdownMenuItem onClick={() => handleAction(() => cancelPurchaseOrder(id), 'Orden cancelada')} className="text-destructive">
            <Ban className="size-4 mr-2" /> Cancelar
          </DropdownMenuItem>
        )}
        {status === 'DRAFT' && (
          <DropdownMenuItem onClick={() => handleAction(() => deletePurchaseOrder(id), 'Orden eliminada')} className="text-destructive">
            <Trash2 className="size-4 mr-2" /> Eliminar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const purchaseOrderColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'full_number',
    header: 'Número',
    meta: { title: 'Número' },
    cell: ({ row }) => (
      <Link href={`/dashboard/purchasing/orders/${row.original.id}`} className="font-mono font-medium hover:underline">
        {row.original.full_number}
      </Link>
    ),
  },
  {
    id: 'supplier',
    header: 'Proveedor',
    meta: { title: 'Proveedor' },
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.supplier?.business_name}</p>
        <p className="text-xs text-muted-foreground">{row.original.supplier?.tax_id}</p>
      </div>
    ),
  },
  {
    accessorKey: 'issue_date',
    header: 'Fecha',
    meta: { title: 'Fecha' },
    cell: ({ row }) => (
      <span className="text-sm">{format(new Date(row.original.issue_date), 'dd/MM/yyyy')}</span>
    ),
  },
  {
    accessorKey: 'total',
    header: 'Total',
    meta: { title: 'Total' },
    cell: ({ row }) => <span className="font-medium">${row.original.total.toFixed(2)}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    meta: { title: 'Estado' },
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={(PO_STATUS_COLORS[status] as any) || 'secondary'}>
          {PO_STATUS_LABELS[status] || status}
        </Badge>
      );
    },
    filterFn: 'equals',
  },
  {
    accessorKey: 'invoicing_status',
    header: 'Facturación',
    meta: { title: 'Facturación' },
    cell: ({ row }) => (
      <Badge variant="outline">
        {PO_INVOICING_STATUS_LABELS[row.original.invoicing_status] || row.original.invoicing_status}
      </Badge>
    ),
    filterFn: 'equals',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
