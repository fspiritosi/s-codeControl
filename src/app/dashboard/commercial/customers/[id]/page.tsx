import { notFound } from 'next/navigation';
import { fetchCustomerById } from '@/modules/commercial/features/customers/actions.server';
import { serializeBigInt } from '@/shared/lib/utils';
import CustomerDetailView, {
  type CustomerDetail,
} from '@/modules/commercial/features/customers/components/CustomerDetailView';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await fetchCustomerById(id);
  if (!customer) notFound();

  const serialized = serializeBigInt(customer) as CustomerDetail;
  return (
    <div className="py-2">
      <CustomerDetailView customer={serialized} />
    </div>
  );
}
