'use client';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import {
  submitWithdrawalForApproval, approveWithdrawalOrder, rejectWithdrawalOrder,
  cancelWithdrawalOrder, completeWithdrawalOrder,
} from '@/modules/warehouse/features/withdrawals/list/actions.server';
import { format } from 'date-fns';
import { Send, CheckCircle, XCircle, Ban, PackageCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import BackButton from '@/shared/components/common/BackButton';
import { WithdrawalOrderPDFButton } from './WithdrawalOrderPDFButton';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Borrador', PENDING_APPROVAL: 'Pendiente', APPROVED: 'Aprobada', COMPLETED: 'Completada', CANCELLED: 'Cancelada' };
const STATUS_COLORS: Record<string, string> = { DRAFT: 'secondary', PENDING_APPROVAL: 'yellow', APPROVED: 'default', COMPLETED: 'success', CANCELLED: 'destructive' };

export default function WithdrawalOrderDetail({ order }: { order: any }) {
  const router = useRouter();
  const status = order.status;

  const handleAction = (action: () => Promise<{ error: string | null }>, msg: string) => {
    toast.promise(async () => { const r = await action(); if (r.error) throw new Error(r.error); router.refresh(); },
      { loading: 'Procesando...', success: msg, error: (e) => e.message });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{order.full_number}</h1>
          <p className="text-muted-foreground">Almacén: {order.warehouse?.name} ({order.warehouse?.code})</p>
          <div className="flex gap-2 mt-2">
            <Badge variant={(STATUS_COLORS[status] as any) || 'secondary'}>{STATUS_LABELS[status]}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <WithdrawalOrderPDFButton orderId={order.id} />
          {status === 'DRAFT' && <Button size="sm" onClick={() => handleAction(() => submitWithdrawalForApproval(order.id), 'Enviada a aprobación')}><Send className="size-4 mr-1" /> Enviar a aprobación</Button>}
          {status === 'PENDING_APPROVAL' && <>
            <Button size="sm" onClick={() => handleAction(() => approveWithdrawalOrder(order.id), 'Aprobada')}><CheckCircle className="size-4 mr-1" /> Aprobar</Button>
            <Button size="sm" variant="outline" onClick={() => handleAction(() => rejectWithdrawalOrder(order.id), 'Rechazada')}><XCircle className="size-4 mr-1" /> Rechazar</Button>
          </>}
          {status === 'APPROVED' && <Button size="sm" onClick={() => handleAction(() => completeWithdrawalOrder(order.id), 'Retiro completado — stock decrementado')}><PackageCheck className="size-4 mr-1" /> Completar retiro</Button>}
          {['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(status) && <Button size="sm" variant="destructive" onClick={() => handleAction(() => cancelWithdrawalOrder(order.id), 'Cancelada')}><Ban className="size-4 mr-1" /> Cancelar</Button>}
          <BackButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Fecha</CardDescription><CardTitle className="text-lg">{format(new Date(order.request_date), 'dd/MM/yyyy')}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Retira</CardDescription><CardTitle className="text-lg">{order.employee ? `${order.employee.lastname} ${order.employee.firstname}` : 'No especificado'}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Para equipo</CardDescription><CardTitle className="text-lg">{order.vehicle ? (order.vehicle.domain || order.vehicle.intern_number) : 'No especificado'}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Items</CardDescription><CardTitle className="text-lg">{order.lines.length} productos</CardTitle></CardHeader></Card>
      </div>

      {order.notes && <Card><CardContent className="pt-4 text-sm"><span className="font-medium">Notas:</span> {order.notes}</CardContent></Card>}

      <Card>
        <CardHeader><CardTitle>Materiales a retirar</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Código</TableHead><TableHead>Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead><TableHead>Unidad</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {order.lines.map((line: any) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-xs">{line.product?.code}</TableCell>
                  <TableCell>{line.product?.name || line.description}</TableCell>
                  <TableCell className="text-right font-medium">{line.quantity}</TableCell>
                  <TableCell>{line.product?.unit_of_measure}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{line.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
