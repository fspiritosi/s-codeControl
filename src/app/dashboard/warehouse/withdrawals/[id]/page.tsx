import { getWithdrawalOrderById } from '@/modules/warehouse/features/withdrawals/list/actions.server';
import { notFound } from 'next/navigation';
import WithdrawalOrderDetail from '@/modules/warehouse/features/withdrawals/detail/components/WithdrawalOrderDetail';

export default async function WithdrawalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getWithdrawalOrderById(id);
  if (!order) return notFound();

  const serialized = {
    ...order,
    lines: order.lines.map((l) => ({ ...l, quantity: Number(l.quantity) })),
  };

  return <WithdrawalOrderDetail order={serialized} />;
}
