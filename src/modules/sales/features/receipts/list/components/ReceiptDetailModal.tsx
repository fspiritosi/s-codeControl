'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  RECEIPT_STATUS_LABELS,
  RECEIPT_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  WITHHOLDING_TAX_TYPE_LABELS,
  VOUCHER_TYPE_LABELS,
} from '@/modules/sales/shared/types';
import { formatCurrencyARS, formatDateUTC } from '@/shared/lib/utils/formatters';
import { getReceiptById } from '../actions.server';

type ReceiptDetail = Awaited<ReturnType<typeof getReceiptById>>;

interface ReceiptDetailModalProps {
  receiptId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptDetailModal({ receiptId, open, onOpenChange }: ReceiptDetailModalProps) {
  const [receipt, setReceipt] = useState<ReceiptDetail>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !receiptId) return;
    setLoading(true);
    getReceiptById(receiptId)
      .then(setReceipt)
      .catch((e) => console.error('Error al cargar recibo:', e))
      .finally(() => setLoading(false));
  }, [open, receiptId]);

  const statusVariant = (s: string) =>
    (RECEIPT_STATUS_COLORS[s] ?? 'secondary') as
      | 'default'
      | 'secondary'
      | 'destructive'
      | 'outline'
      | 'success';

  const totalWithholdings =
    receipt?.withholdings.reduce((sum, w) => sum + Number(w.amount), 0) ?? 0;
  const totalPayments = receipt?.payments.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del recibo de cobro</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : receipt ? (
          <div className="space-y-6">
            {/* Información general */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información general</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Número</p>
                    <p className="font-mono font-medium">{receipt.full_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge variant={statusVariant(receipt.status)}>
                      {RECEIPT_STATUS_LABELS[receipt.status] ?? receipt.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">{formatDateUTC(receipt.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-lg font-medium">{formatCurrencyARS(receipt.total_amount)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{receipt.customer?.name}</p>
                </div>

                {receipt.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas</p>
                    <p className="text-sm">{receipt.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Facturas aplicadas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Facturas aplicadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {receipt.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {item.invoice?.full_number}{' '}
                        <span className="text-xs text-muted-foreground">
                          (
                          {item.invoice
                            ? VOUCHER_TYPE_LABELS[item.invoice.voucher_type] ??
                              item.invoice.voucher_type
                            : '—'}
                          )
                        </span>
                      </p>
                      {item.invoice && (
                        <p className="text-sm text-muted-foreground">
                          Total factura: {formatCurrencyARS(item.invoice.total)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Importe aplicado</p>
                      <p className="font-medium">{formatCurrencyARS(item.amount)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Medios de pago */}
            {receipt.payments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Medios de pago (informativos)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {receipt.payments.map((payment) => {
                    const details: string[] = [];
                    if (payment.check_number) details.push(`Cheque N° ${payment.check_number}`);
                    if (payment.check_bank) details.push(payment.check_bank);
                    if (payment.check_due_date)
                      details.push(`Vto. ${formatDateUTC(payment.check_due_date)}`);
                    if (payment.reference) details.push(payment.reference);
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">
                            {PAYMENT_METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
                          </p>
                          {details.length > 0 && (
                            <p className="text-sm text-muted-foreground">{details.join(' · ')}</p>
                          )}
                        </div>
                        <p className="font-medium">{formatCurrencyARS(payment.amount)}</p>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <p className="font-medium">Total medios de pago</p>
                    <p className="font-bold">{formatCurrencyARS(totalPayments)}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Retenciones */}
            {receipt.withholdings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Retenciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {receipt.withholdings.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {WITHHOLDING_TAX_TYPE_LABELS[w.tax_type] ?? w.tax_type}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {w.rate != null ? `Alícuota: ${w.rate}%` : ''}
                          {w.certificate_number ? ` · Cert. N° ${w.certificate_number}` : ''}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrencyARS(w.amount)}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <p className="font-medium">Total retenciones</p>
                    <p className="font-bold">{formatCurrencyARS(totalWithholdings)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No se encontró el recibo.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
