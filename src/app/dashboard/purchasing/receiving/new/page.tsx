import { getSuppliersByCompany } from '@/modules/suppliers/features/list/actions.server';
import { getProductsByCompany } from '@/modules/products/features/list/actions.server';
import { getWarehousesByCompany } from '@/modules/warehouse/features/list/actions.server';
import ReceivingNoteForm from '@/modules/purchasing/features/receiving-notes/create/components/ReceivingNoteForm';

export default async function NewReceivingNotePage() {
  const [suppliers, products, warehouses] = await Promise.all([
    getSuppliersByCompany(),
    getProductsByCompany(),
    getWarehousesByCompany(),
  ]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Nuevo remito de recepción</h1>
      <ReceivingNoteForm
        suppliers={suppliers as any}
        products={products.map((p) => ({ id: p.id, code: p.code, name: p.name, unit_of_measure: p.unit_of_measure }))}
        warehouses={warehouses}
      />
    </div>
  );
}
