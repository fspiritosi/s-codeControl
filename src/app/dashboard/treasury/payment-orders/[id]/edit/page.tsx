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
    date: new Date(order.date).toISOString().slice(0, 10),
    scheduled_payment_date: order.scheduled_payment_date
      ? new Date(order.scheduled_payment_date).toISOString().slice(0, 10)
      : null,
    notes: order.notes,
    items: order.items.map((i) => ({
      invoice_id: i.invoice_id,
      invoice_label: i.invoice?.full_number ?? null,
      amount: i.amount.toFixed(2),
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
    })),
    retentions: order.retentions.map((r) => ({
      tax_type_id: r.tax_type_id,
      base_amount: r.base_amount.toFixed(2),
      rate: String(r.rate),
      amount: r.amount.toFixed(2),
      notes: r.notes ?? '',
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
