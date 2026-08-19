import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { currencySymbol } from '@/shared/lib/currency-conversion';
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
import { CopyableCbu } from './CopyableCbu';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_ORDER_STATUS_LABELS,
} from '../../../shared/validators';

export async function PaymentOrderDetail({ id }: { id: string }) {
  const order = await getPaymentOrderById(id);
  if (!order) notFound();
  // La orden puede estar en dólares (tsk-576): los importes de la orden usan
  // su símbolo, y cada ítem el de su propio comprobante.
  const orderSymbol = currencySymbol(order.currency);

  const variant =
    order.status === 'PAID'
      ? 'success'
      : order.status === 'CONFIRMED'
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
        <Badge variant={variant as any}>{PAYMENT_ORDER_STATUS_LABELS[order.status]}</Badge>
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
            <CardDescription>Total facturas</CardDescription>
            <CardTitle className="text-2xl font-mono">
              {orderSymbol}
              {order.total_amount.toFixed(2)} {order.currency}
            </CardTitle>
            {(order.retentions_total > 0 || order.credits_total > 0) &&
              order.net_to_pay !== null && (
              <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                {order.retentions_total > 0 && (
                <div>
                  Retenciones:{' '}
                  <span className="font-mono text-amber-600">
                    −{orderSymbol}
                    {order.retentions_total.toFixed(2)}
                  </span>
                </div>
                )}
                {order.credits_total > 0 && (
                <div>
                  Notas de crédito:{' '}
                  <span className="font-mono text-emerald-600">
                    −{orderSymbol}
                    {order.credits_total.toFixed(2)}
                  </span>
                </div>
                )}
                <div>
                  Neto pagado:{' '}
                  <span className="font-mono font-semibold">
                    {orderSymbol}
                    {order.net_to_pay.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
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
                <TableHead className="text-right">Desc.</TableHead>
                <TableHead className="text-right">Importe imputado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">
                    {item.invoice?.full_number
                      ?? item.expense?.full_number
                      ?? (<span className="text-muted-foreground">Pago sin documento</span>)}
                    {item.expense && (
                      <span className="ml-2 inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">Gasto</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.invoice?.issue_date
                      ? format(new Date(item.invoice.issue_date), 'dd/MM/yyyy')
                      : item.expense?.date
                        ? format(new Date(item.expense.date), 'dd/MM/yyyy')
                        : '-'}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {item.invoice
                      ? `${currencySymbol(item.currency)}${item.invoice.total.toFixed(2)}`
                      : item.expense
                        ? `${currencySymbol(item.currency)}${item.expense.amount.toFixed(2)}`
                        : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {item.discount_pct > 0 ? `${item.discount_pct}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {currencySymbol(item.currency)}
                    {item.amount.toFixed(2)}
                    {item.currency !== order.currency && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        = {orderSymbol}
                        {item.amount_in_order_currency.toFixed(2)} @ {item.exchange_rate}
                      </span>
                    )}
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
              {order.payments.map((p) => {
                const dest = p.supplier_payment_method;
                let destPrefix: string | null = null;
                let destCbu: string | null = null;
                let destAlias: string | null = null;
                if (dest) {
                  if (dest.type === 'CHECK') {
                    destPrefix = 'Cheque al proveedor';
                  } else if (dest.type === 'ACCOUNT') {
                    destPrefix = dest.bank_name ?? 'Cuenta bancaria';
                    destCbu = dest.cbu ?? null;
                    destAlias = dest.cbu ? null : dest.alias ?? null;
                  }
                }
                const hasDest = destPrefix || destCbu || destAlias;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Badge variant="outline">{PAYMENT_METHOD_LABELS[p.payment_method]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        {p.cash_register
                          ? `${p.cash_register.code} — ${p.cash_register.name}`
                          : p.bank_account
                            ? `${p.bank_account.bank_name} ${p.bank_account.account_number}`
                            : p.check_number
                              ? `Cheque #${p.check_number}`
                              : p.card_last4
                                ? `•••• ${p.card_last4}`
                                : '-'}
                      </div>
                      {hasDest && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          <span>Destino: {destPrefix}</span>
                          {destCbu && <span> · CBU <CopyableCbu cbu={destCbu} /></span>}
                          {destAlias && <span> · Alias {destAlias}</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.reference ?? '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {orderSymbol}
                      {p.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {order.credit_applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notas de crédito aplicadas</CardTitle>
            <CardDescription>
              Crédito del proveedor usado en esta orden. Baja lo que se transfiere; las
              facturas de arriba se cancelan igual por su importe completo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nota de crédito</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total de la nota</TableHead>
                  <TableHead className="text-right">Aplicado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.credit_applications.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">
                      {c.credit_note?.full_number ?? '—'}
                    </TableCell>
                    <TableCell>
                      {c.credit_note ? format(new Date(c.credit_note.issue_date), 'dd/MM/yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {c.credit_note ? c.credit_note.total.toFixed(2) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-emerald-600">
                      −{c.amount.toFixed(2)} {c.credit_note?.currency ?? ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {order.retentions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Retenciones</CardTitle>
            <CardDescription>
              Montos retenidos al proveedor. Reducen el neto pagado pero cancelan la
              cuenta corriente por el total de las facturas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Alícuota</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Certificado</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.retentions.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.tax_type.name}</div>
                      {r.tax_type.jurisdiction && (
                        <div className="text-xs text-muted-foreground">{r.tax_type.jurisdiction}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {orderSymbol}
                      {r.base_amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">{r.rate}%</TableCell>
                    <TableCell className="text-right font-mono font-medium text-amber-600">
                      {orderSymbol}
                      {r.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.certificate_number ? (
                        <a
                          href={`/api/retention-certificates/${r.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {r.certificate_number}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.notes ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
