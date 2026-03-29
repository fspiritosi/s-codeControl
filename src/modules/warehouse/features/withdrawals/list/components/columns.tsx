'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { submitWithdrawalForApproval, approveWithdrawalOrder, rejectWithdrawalOrder, cancelWithdrawalOrder, completeWithdrawalOrder } from '../actions.server';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Send, CheckCircle, XCircle, Ban, PackageCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Borrador', PENDING_APPROVAL: 'Pendiente', APPROVED: 'Aprobada', COMPLETED: 'Completada', CANCELLED: 'Cancelada' };
const STATUS_COLORS: Record<string, string> = { DRAFT: 'secondary', PENDING_APPROVAL: 'yellow', APPROVED: 'default', COMPLETED: 'success', CANCELLED: 'destructive' };

function ActionsCell({ row }: { row: any }) {
  const router = useRouter();
  const status = row.original.status;
  const id = row.original.id;

  const handleAction = (action: () => Promise<{ error: string | null }>, msg: string) => {
    toast.promise(async () => { const r = await action(); if (r.error) throw new Error(r.error); router.refresh(); },
      { loading: 'Procesando...', success: msg, error: (e) => e.message });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link href={`/dashboard/warehouse/withdrawals/${id}`}><Eye className="size-4 mr-2" /> Ver detalle</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        {status === 'DRAFT' && <DropdownMenuItem onClick={() => handleAction(() => submitWithdrawalForApproval(id), 'Enviada a aprobación')}><Send className="size-4 mr-2" /> Enviar a aprobación</DropdownMenuItem>}
        {status === 'PENDING_APPROVAL' && <>
          <DropdownMenuItem onClick={() => handleAction(() => approveWithdrawalOrder(id), 'Aprobada')}><CheckCircle className="size-4 mr-2" /> Aprobar</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction(() => rejectWithdrawalOrder(id), 'Rechazada')}><XCircle className="size-4 mr-2" /> Rechazar</DropdownMenuItem>
        </>}
        {status === 'APPROVED' && <DropdownMenuItem onClick={() => handleAction(() => completeWithdrawalOrder(id), 'Retiro completado — stock decrementado')}><PackageCheck className="size-4 mr-2" /> Completar retiro</DropdownMenuItem>}
        {['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(status) && <DropdownMenuItem onClick={() => handleAction(() => cancelWithdrawalOrder(id), 'Cancelada')} className="text-destructive"><Ban className="size-4 mr-2" /> Cancelar</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const withdrawalColumns: ColumnDef<any>[] = [
  { accessorKey: 'full_number', header: 'Número', meta: { title: 'Número' },
    cell: ({ row }) => <Link href={`/dashboard/warehouse/withdrawals/${row.original.id}`} className="font-mono font-medium hover:underline">{row.original.full_number}</Link> },
  { id: 'warehouse', header: 'Almacén', meta: { title: 'Almacén' },
    cell: ({ row }) => <span className="text-sm">{row.original.warehouse?.name}</span> },
  { accessorKey: 'request_date', header: 'Fecha', meta: { title: 'Fecha' },
    cell: ({ row }) => <span className="text-sm">{format(new Date(row.original.request_date), 'dd/MM/yyyy')}</span> },
  { id: 'employee', header: 'Retira', meta: { title: 'Retira' },
    cell: ({ row }) => { const e = row.original.employee; return <span className="text-sm">{e ? `${e.lastname} ${e.firstname}` : '-'}</span>; } },
  { id: 'vehicle', header: 'Equipo', meta: { title: 'Equipo' },
    cell: ({ row }) => { const v = row.original.vehicle; return <span className="text-sm">{v ? (v.domain || v.intern_number) : '-'}</span>; } },
  { id: 'items', header: 'Items', meta: { title: 'Items' },
    cell: ({ row }) => <span className="text-sm">{row.original._count?.lines || 0}</span> },
  { accessorKey: 'status', header: 'Estado', meta: { title: 'Estado' }, filterFn: 'equals',
    cell: ({ row }) => <Badge variant={(STATUS_COLORS[row.original.status] as any) || 'secondary'}>{STATUS_LABELS[row.original.status] || row.original.status}</Badge> },
  { id: 'actions', header: '', cell: ({ row }) => <ActionsCell row={row} /> },
];
