import WarehouseForm from '@/modules/warehouse/features/create/components/WarehouseForm';

export default function NewWarehousePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Nuevo almacén</h1>
      <WarehouseForm />
    </div>
  );
}
