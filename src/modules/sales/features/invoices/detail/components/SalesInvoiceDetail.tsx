'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Separator } from '@/shared/components/ui/separator';
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
import {
  confirmSalesInvoice,
  cancelSalesInvoice,
  deleteSalesInvoice,
  getSalesInvoiceById,
} from '@/modules/sales/features/invoices/list/actions.server';
import { formatDateUTC } from '@/shared/lib/utils/formatters';
import { Pencil, CheckCircle, Ban, Trash2 } from 'lucide-react';
import BackButton from '@/shared/components/common/BackButton';

type Invoice = NonNullable<Awaited<ReturnType<typeof getSalesInvoiceById>>>;

export default function SalesInvoiceDetail({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const isDraft = invoice.status === 'DRAFT';
  const isConfirmed = ['CONFIRMED', 'PARTIAL_PAID', 'PAID'].includes(invoice.status);
  const statusVariant = SALES_INVOICE_STATUS_COLORS[invoice.status] || 'secondary';
  const symbol = invoice.currency === 'USD' ? 'US$' : '$';

  const runAction = (
    fn: () => Promise<{ error: string | null }>,
    messages: { loading: string; success: string },
    redirectTo?: string
  ) => {
    toast.promise(
      async () => {
        const result = await fn();
        if (result.error) throw new Error(result.error);
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      },
      { loading: messages.loading, success: messages.success, error: (e) => e.message }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{invoice.full_number || 'Borrador'}</h1>
          <p className="text-muted-foreground">
            {invoice.customer?.name}
            {invoice.customer?.tax_id ? ` — ${invoice.customer.tax_id}` : ''}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">
              {VOUCHER_TYPE_LABELS[invoice.voucher_type] || invoice.voucher_type}
            </Badge>
            <Badge variant={statusVariant as any}>
              {SALES_INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
            </Badge>
            {invoice.point_of_sale_rel && (
              <Badge variant="outline">
                PV: {String(invoice.point_of_sale_rel.number).padStart(5, '0')}
              </Badge>
            )}
            {invoice.original_invoice && (
              <Badge variant="secondary">
                Corrige:{' '}
                <Link className="ml-1 underline" href={`/dashboard/sales/invoices/${invoice.original_invoice.id}`}>
                  {invoice.original_invoice.full_number}
                </Link>
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <>
              <Button asChild variant="outline">
                <Link href={`/dashboard/sales/invoices/${invoice.id}/edit`}>
                  <Pencil className="size-4 mr-2" /> Editar
                </Link>
              </Button>
              <Button
                onClick={() =>
                  runAction(() => confirmSalesInvoice(invoice.id), {
                    loading: 'Confirmando...',
                    success: 'Factura confirmada',
                  })
                }
              >
                <CheckCircle className="size-4 mr-2" /> Confirmar
              </Button>
              <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2 className="size-4 mr-2" /> Eliminar
              </Button>
            </>
          )}
          {isConfirmed && (
            <Button variant="destructive" onClick={() => setConfirmCancelOpen(true)}>
              <Ban className="size-4 mr-2" /> Anular
            </Button>
          )}
          <BackButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fecha emisión</CardDescription>
            <CardTitle className="text-lg">{formatDateUTC(invoice.issue_date)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vencimiento</CardDescription>
            <CardTitle className="text-lg">{formatDateUTC(invoice.due_date)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>CAE</CardDescription>
            <CardTitle className="text-lg font-mono">{invoice.cae || '-'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Total
              {invoice.currency !== 'ARS'
                ? ` (${invoice.currency} @ ${Number(invoice.exchange_rate).toFixed(2)})`
                : ''}
            </CardDescription>
            <CardTitle className="text-lg">
              {symbol} {Number(invoice.total).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Líneas</CardTitle>
          <CardDescription>{invoice.lines.length} items</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio unit.</TableHead>
                <TableHead className="text-right">Descuento</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Neto</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-xs">{line.product?.code || '-'}</TableCell>
                  <TableCell>{line.description}</TableCell>
                  <TableCell className="text-right">{Number(line.quantity)}</TableCell>
                  <TableCell className="text-right">${Number(line.unit_price).toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {Number(line.discount_amount) > 0
                      ? line.discount_type === 'PERCENTAGE'
                        ? `${Number(line.discount_value)}%`
                        : `-$${Number(line.discount_amount).toFixed(2)}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">{Number(line.vat_rate)}%</TableCell>
                  <TableCell className="text-right">${Number(line.subtotal).toFixed(2)}</TableCell>
                  <TableCell className="text-right">${Number(line.total).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="my-4" />
          <div className="flex flex-col items-end gap-1 text-sm">
            {Number(invoice.discount_amount) > 0 && (
              <div className="text-destructive">
                Descuentos:{' '}
                <span className="font-mono font-medium">-${Number(invoice.discount_amount).toFixed(2)}</span>
                {invoice.global_discount_type && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (global:{' '}
                    {invoice.global_discount_type === 'PERCENTAGE'
                      ? `${Number(invoice.global_discount_value)}%`
                      : `$${Number(invoice.global_discount_value).toFixed(2)}`}
                    )
                  </span>
                )}
              </div>
            )}
            <div>
              Subtotal neto: <span className="font-mono font-medium">${Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div>
              IVA: <span className="font-mono font-medium">${Number(invoice.vat_amount).toFixed(2)}</span>
            </div>
            {Number(invoice.other_taxes) > 0 && (
              <div>
                Percepciones: <span className="font-mono font-medium">${Number(invoice.other_taxes).toFixed(2)}</span>
              </div>
            )}
            {Number(invoice.other_charges) > 0 && (
              <div>
                Otros cargos: <span className="font-mono font-medium">${Number(invoice.other_charges).toFixed(2)}</span>
              </div>
            )}
            <div className="text-lg font-bold">
              Total: <span className="font-mono">{symbol}{Number(invoice.total).toFixed(2)}</span>
            </div>
            {invoice.currency !== 'ARS' && (
              <div className="text-sm text-muted-foreground">
                Tipo de cambio: {Number(invoice.exchange_rate).toFixed(2)} · Total en ARS:{' '}
                <span className="font-mono font-medium">
                  ${(Number(invoice.total) * Number(invoice.exchange_rate)).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {invoice.perceptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Percepciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Alícuota</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.perceptions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.tax_type.name}</TableCell>
                    <TableCell className="text-right font-mono">${Number(p.base_amount).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{Number(p.rate)}%</TableCell>
                    <TableCell className="text-right font-mono font-medium">${Number(p.amount).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.notes ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {invoice.other_charges_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Otros cargos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.other_charges_items.map((oc) => (
                  <TableRow key={oc.id}>
                    <TableCell>{oc.description}</TableCell>
                    <TableCell className="text-right font-mono font-medium">${Number(oc.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {invoice.credit_debit_notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notas asociadas</CardTitle>
            <CardDescription>Notas de crédito/débito que corrigen esta factura</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.credit_debit_notes.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-mono">{n.full_number || 'Borrador'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{VOUCHER_TYPE_LABELS[n.voucher_type] || n.voucher_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(SALES_INVOICE_STATUS_COLORS[n.status] || 'secondary') as any}>
                        {SALES_INVOICE_STATUS_LABELS[n.status] || n.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">${Number(n.total).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/sales/invoices/${n.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {invoice.receipt_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recibos aplicados</CardTitle>
            <CardDescription>
              {invoice.receipt_items.length} recibo{invoice.receipt_items.length === 1 ? '' : 's'} imputado
              {invoice.receipt_items.length === 1 ? '' : 's'} a esta factura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Importe aplicado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.receipt_items.map((ri) => (
                  <TableRow key={ri.id}>
                    <TableCell className="font-mono">{ri.receipt?.full_number || '-'}</TableCell>
                    <TableCell>{formatDateUTC(ri.receipt?.date)}</TableCell>
                    <TableCell>
                      <Badge variant={ri.receipt?.status === 'CONFIRMED' ? 'success' : 'secondary'}>
                        {ri.receipt?.status === 'CONFIRMED' ? 'Confirmado' : ri.receipt?.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">${Number(ri.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

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
              onClick={() =>
                runAction(
                  () => deleteSalesInvoice(invoice.id),
                  { loading: 'Eliminando...', success: 'Factura eliminada' },
                  '/dashboard/sales'
                )
              }
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular factura {invoice.full_number}</AlertDialogTitle>
            <AlertDialogDescription>
              La factura pasará a estado Anulada. No se puede anular si tiene recibos aplicados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                runAction(() => cancelSalesInvoice(invoice.id), {
                  loading: 'Anulando...',
                  success: 'Factura anulada',
                })
              }
            >
              Anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
