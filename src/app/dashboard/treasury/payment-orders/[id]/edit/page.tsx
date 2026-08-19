import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { NewPaymentOrderShell } from '@/modules/treasury/features/payment-orders/components/NewPaymentOrderShell';
import type { PaymentOrderEditData } from '@/modules/treasury/features/payment-orders/components/NewPaymentOrderForm';
import { getPaymentOrderById } from '@/modules/treasury/features/payment-orders/actions.server';

export default async function EditPaymentOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getPaymentOrderById(id);
  if (!order) notFound();
  if (order.status !== 'DRAFT') {
    redirect(`/dashboard/treasury/payment-orders/${id}?notEditable=1`);
  }

  const initialData: PaymentOrderEditData = {
    id: order.id,
    full_number: order.full_number,
    supplier_id: order.supplier_id,
    currency: order.currency,
    exchange_rate: order.exchange_rate,
    date: new Date(order.date).toISOString().slice(0, 10),
    scheduled_payment_date: order.scheduled_payment_date
      ? new Date(order.scheduled_payment_date).toISOString().slice(0, 10)
      : null,
    notes: order.notes,
    items: order.items.map((i) => ({
      invoice_id: i.invoice_id,
      expense_id: i.expense_id ?? null,
      invoice_label: i.invoice?.full_number ?? i.expense?.full_number ?? null,
      amount: i.amount.toFixed(2),
      currency: i.currency,
      exchange_rate: i.exchange_rate,
      discount_pct: i.discount_pct,
      is_on_account: i.is_on_account,
    })),
    payments: order.payments.map((p) => ({
      payment_method: p.payment_method,
      amount: p.amount.toFixed(2),
      cash_register_id: p.cash_register_id,
      bank_account_id: p.bank_account_id,
      supplier_payment_method_id: p.supplier_payment_method_id,
      check_number: p.check_number ?? '',
      card_last4: p.card_last4 ?? '',
      reference: p.reference ?? '',
      check_kind: p.selected_check?.type ?? null,
      check_id: p.check_id ?? null,
    })),
    retentions: order.retentions.map((r) => ({
      tax_type_id: r.tax_type_id,
      base_amount: r.base_amount.toFixed(2),
      rate: String(r.rate),
      amount: r.amount.toFixed(2),
      notes: r.notes ?? '',
    })),
    credits: order.credit_applications.map((c) => ({
      credit_note_id: c.credit_note_id,
      label: c.credit_note?.full_number ?? '',
      amount: c.amount.toFixed(2),
      currency: c.credit_note?.currency ?? 'ARS',
      // El tipo de cambio sale de la NC, no de la orden: el importe está en la
      // moneda de la nota y se convierte al mostrarlo.
      exchange_rate: c.credit_note?.exchange_rate ?? 1,
    })),
  };

  return (
    <div className="p-6">
      <Suspense fallback={<PageTableSkeleton />}>
        <NewPaymentOrderShell initialData={initialData} />
      </Suspense>
    </div>
  );
}
