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
import { INVOICE_STATUS_LABELS, VOUCHER_TYPE_LABELS } from '@/modules/purchasing/shared/types';
import { confirmPurchaseInvoice } from '../actions.server';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

function ActionsCell({ row }: { row: any }) {
  const router = useRouter();
  const status = row.original.status;
  const id = row.original.id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/purchasing/invoices/${id}`}>
            <Eye className="size-4 mr-2" /> Ver detalle
          </Link>
        </DropdownMenuItem>
        {status === 'DRAFT' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                toast.promise(
                  async () => {
                    const result = await confirmPurchaseInvoice(id);
                    if (result.error) throw new Error(result.error);
                    router.refresh();
                  },
                  { loading: 'Confirmando...', success: 'Factura confirmada', error: (e) => e.message }
                );
              }}
            >
              <CheckCircle className="size-4 mr-2" /> Confirmar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const invoiceColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'full_number',
    header: 'Número',
    meta: { title: 'Número' },
    cell: ({ row }) => <span className="font-mono font-medium">{row.original.full_number}</span>,
  },
  {
    accessorKey: 'voucher_type',
    header: 'Tipo',
    meta: { title: 'Tipo' },
    cell: ({ row }) => (
      <Badge variant="outline">{VOUCHER_TYPE_LABELS[row.original.voucher_type] || row.original.voucher_type}</Badge>
    ),
    filterFn: 'equals',
  },
  {
    id: 'supplier',
    header: 'Proveedor',
    meta: { title: 'Proveedor' },
    cell: ({ row }) => <span className="text-sm">{row.original.supplier?.business_name}</span>,
  },
  {
    accessorKey: 'issue_date',
    header: 'Fecha',
    meta: { title: 'Fecha' },
    cell: ({ row }) => <span className="text-sm">{format(new Date(row.original.issue_date), 'dd/MM/yyyy')}</span>,
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
      const s = row.original.status;
      const variant = s === 'CONFIRMED' ? 'default' : s === 'PAID' ? 'success' : s === 'CANCELLED' ? 'destructive' : 'secondary';
      return <Badge variant={variant as any}>{INVOICE_STATUS_LABELS[s] || s}</Badge>;
    },
    filterFn: 'equals',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
