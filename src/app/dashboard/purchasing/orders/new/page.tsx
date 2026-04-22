import PurchaseOrderForm from '@/modules/purchasing/features/purchase-orders/create/components/PurchaseOrderForm';
import { getSuppliersByCompany } from '@/modules/suppliers/features/list/actions.server';
import { getProductsByCompany } from '@/modules/products/features/list/actions.server';

export default async function NewPurchaseOrderPage() {
  const [suppliers, products] = await Promise.all([
    getSuppliersByCompany(),
    getProductsByCompany(),
  ]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Nueva orden de compra</h1>
      <PurchaseOrderForm
        suppliers={suppliers as any}
        products={products.map((p) => ({ ...p, cost_price: Number(p.cost_price), vat_rate: Number(p.vat_rate) }))}
      />
    </div>
  );
}
