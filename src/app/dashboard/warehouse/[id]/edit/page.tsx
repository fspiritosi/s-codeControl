import { notFound } from 'next/navigation';
import WarehouseForm from '@/modules/warehouse/features/create/components/WarehouseForm';
import { getWarehouseById } from '@/modules/warehouse/features/list/actions.server';

export default async function EditWarehousePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const warehouse = await getWarehouseById(id);
  if (!warehouse) return notFound();

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Editar almacén</h1>
      <WarehouseForm warehouse={warehouse} />
    </div>
  );
}
