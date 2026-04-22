import { notFound } from 'next/navigation';
import SupplierForm from '@/modules/suppliers/features/create/components/SupplierForm';
import { getSupplierById } from '@/modules/suppliers/features/list/actions.server';

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplierById(id);

  if (!supplier) return notFound();

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Editar proveedor</h1>
      <SupplierForm supplier={supplier} />
    </div>
  );
}
