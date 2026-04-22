import { notFound } from 'next/navigation';
import SupplierDetail from '@/modules/suppliers/features/detail/components/SupplierDetail';
import { getSupplierById } from '@/modules/suppliers/features/list/actions.server';

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplierById(id);

  if (!supplier) return notFound();

  return (
    <div className="max-w-5xl">
      <SupplierDetail supplier={supplier as any} />
    </div>
  );
}
