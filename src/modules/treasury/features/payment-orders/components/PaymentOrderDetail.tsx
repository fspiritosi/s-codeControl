import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { getPaymentOrderById } from '../actions.server';
import { PaymentOrderActions } from './PaymentOrderActions';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_ORDER_STATUS_LABELS,
} from '../../../shared/validators';

export async function PaymentOrderDetail({ id }: { id: string }) {
  const order = await getPaymentOrderById(id);
  if (!order) notFound();

  const variant =
    order.status === 'CONFIRMED'
      ? 'default'
      : order.status === 'CANCELLED'
        ? 'destructive'
        : 'outline';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/treasury?tab=payment-orders">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-mono">{order.full_number}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(order.date), 'dd/MM/yyyy')} — Creada{' '}
            {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
        <Badge variant={variant}>{PAYMENT_ORDER_STATUS_LABELS[order.status]}</Badge>
        <PaymentOrderActions id={order.id} status={order.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardDescription>Proveedor</CardDescription>
            <CardTitle className="text-lg">
              {order.supplier?.business_name ?? 'Sin proveedor'}
            </CardTitle>
          </CardHeader>
          {order.supplier?.tax_id && (
            <CardContent className="pt-0 text-sm text-muted-foreground font-mono">
              CUIT: {order.supplier.tax_id}
            </CardContent>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl font-mono">
              ${order.total_amount.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ítems</CardTitle>
          <CardDescription>Conceptos vinculados a la orden de pago.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Fecha emisión</TableHead>
                <TableHead>Total factura</TableHead>
                <TableHead className="text-right">Importe imputado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">
                    {item.invoice?.full_number ?? (
                      <span className="text-muted-foreground">Pago sin factura</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.invoice?.issue_date
                      ? format(new Date(item.invoice.issue_date), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {item.invoice ? `$${item.invoice.total.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    ${item.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagos</CardTitle>
          <CardDescription>Métodos usados para cancelar el total.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Badge variant="outline">{PAYMENT_METHOD_LABELS[p.payment_method]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.cash_register
                      ? `${p.cash_register.code} — ${p.cash_register.name}`
                      : p.bank_account
                        ? `${p.bank_account.bank_name} ${p.bank_account.account_number}`
                        : p.check_number
                          ? `Cheque #${p.check_number}`
                          : p.card_last4
                            ? `•••• ${p.card_last4}`
                            : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.reference ?? '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">${p.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">{order.notes}</CardContent>
        </Card>
      )}
    </div>
  );
}
