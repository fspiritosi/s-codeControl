import { getPurchaseOrderById } from '@/modules/purchasing/features/purchase-orders/list/actions.server';
import { notFound } from 'next/navigation';
import PurchaseOrderDetail from '@/modules/purchasing/features/purchase-orders/detail/components/PurchaseOrderDetail';

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getPurchaseOrderById(id);

  if (!order) return notFound();

  // Convert Decimals for serialization
  const serialized = {
    ...order,
    subtotal: Number(order.subtotal),
    vat_amount: Number(order.vat_amount),
    total: Number(order.total),
    lines: order.lines.map((l) => ({
      ...l,
      quantity: Number(l.quantity),
      unit_cost: Number(l.unit_cost),
      vat_rate: Number(l.vat_rate),
      vat_amount: Number(l.vat_amount),
      subtotal: Number(l.subtotal),
      total: Number(l.total),
      received_qty: Number(l.received_qty),
      invoiced_qty: Number(l.invoiced_qty),
    })),
    installments: order.installments.map((i) => ({
      ...i,
      amount: Number(i.amount),
    })),
  };

  return <PurchaseOrderDetail order={serialized} />;
}
