'use client';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Separator } from '@/shared/components/ui/separator';
import { PO_STATUS_LABELS, PO_STATUS_COLORS, PO_INVOICING_STATUS_LABELS } from '@/modules/purchasing/shared/types';
import {
  submitForApproval,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  cancelPurchaseOrder,
} from '@/modules/purchasing/features/purchase-orders/list/actions.server';
import { format } from 'date-fns';
import { Send, CheckCircle, XCircle, Ban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import BackButton from '@/shared/components/common/BackButton';

interface Props {
  order: any;
}

export default function PurchaseOrderDetail({ order }: Props) {
  const router = useRouter();

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

  const status = order.status;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{order.full_number}</h1>
          <p className="text-muted-foreground">{order.supplier?.business_name} — {order.supplier?.tax_id}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant={(PO_STATUS_COLORS[status] as any) || 'secondary'}>
              {PO_STATUS_LABELS[status] || status}
            </Badge>
            <Badge variant="outline">
              {PO_INVOICING_STATUS_LABELS[order.invoicing_status] || order.invoicing_status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {status === 'DRAFT' && (
            <Button size="sm" onClick={() => handleAction(() => submitForApproval(order.id), 'Enviada a aprobación')}>
              <Send className="size-4 mr-1" /> Enviar a aprobación
            </Button>
          )}
          {status === 'PENDING_APPROVAL' && (
            <>
              <Button size="sm" onClick={() => handleAction(() => approvePurchaseOrder(order.id), 'Aprobada')}>
                <CheckCircle className="size-4 mr-1" /> Aprobar
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleAction(() => rejectPurchaseOrder(order.id), 'Rechazada')}>
                <XCircle className="size-4 mr-1" /> Rechazar
              </Button>
            </>
          )}
          {['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(status) && (
            <Button size="sm" variant="destructive" onClick={() => handleAction(() => cancelPurchaseOrder(order.id), 'Cancelada')}>
              <Ban className="size-4 mr-1" /> Cancelar
            </Button>
          )}
          <BackButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fecha de emisión</CardDescription>
            <CardTitle className="text-lg">{format(new Date(order.issue_date), 'dd/MM/yyyy')}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Entrega estimada</CardDescription>
            <CardTitle className="text-lg">
              {order.expected_delivery_date ? format(new Date(order.expected_delivery_date), 'dd/MM/yyyy') : 'No definida'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-lg">${order.total.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {(order.payment_conditions || order.delivery_address || order.notes) && (
        <Card>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {order.payment_conditions && (
              <div><span className="font-medium">Condiciones de pago:</span> {order.payment_conditions}</div>
            )}
            {order.delivery_address && (
              <div><span className="font-medium">Dirección de entrega:</span> {order.delivery_address}</div>
            )}
            {order.notes && (
              <div className="md:col-span-3"><span className="font-medium">Notas:</span> {order.notes}</div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Líneas de la orden</CardTitle>
          <CardDescription>{order.lines.length} items</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Costo unit.</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Recibido</TableHead>
                <TableHead className="text-right">Facturado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((line: any) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-xs">{line.product?.code || '-'}</TableCell>
                  <TableCell>{line.description}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">${line.unit_cost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{line.vat_rate}%</TableCell>
                  <TableCell className="text-right">${line.subtotal.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">{line.received_qty}</TableCell>
                  <TableCell className="text-right font-medium">{line.invoiced_qty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="my-4" />
          <div className="flex justify-end text-sm space-x-8">
            <div>Subtotal: <span className="font-mono font-medium">${order.subtotal.toFixed(2)}</span></div>
            <div>IVA: <span className="font-mono font-medium">${order.vat_amount.toFixed(2)}</span></div>
            <div className="text-lg font-bold">Total: <span className="font-mono">${order.total.toFixed(2)}</span></div>
          </div>
        </CardContent>
      </Card>

      {order.receiving_notes?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Remitos de recepción vinculados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.receiving_notes.map((rn: any) => (
                  <TableRow key={rn.id}>
                    <TableCell className="font-mono">{rn.full_number}</TableCell>
                    <TableCell>{format(new Date(rn.reception_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell><Badge variant={rn.status === 'CONFIRMED' ? 'default' : 'secondary'}>{rn.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {order.purchase_invoices?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Facturas vinculadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.purchase_invoices.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono">{inv.full_number}</TableCell>
                    <TableCell><Badge variant={inv.status === 'CONFIRMED' ? 'default' : 'secondary'}>{inv.status}</Badge></TableCell>
                    <TableCell className="text-right">${Number(inv.total).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
