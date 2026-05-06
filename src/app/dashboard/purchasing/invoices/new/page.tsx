import { getSuppliersByCompany } from '@/modules/suppliers/features/list/actions.server';
import { getProductsByCompany } from '@/modules/products/features/list/actions.server';
import PurchaseInvoiceForm from '@/modules/purchasing/features/invoices/create/components/PurchaseInvoiceForm';
import { listTaxTypes } from '@/modules/settings/features/taxes/actions.server';

export default async function NewInvoicePage() {
  const [suppliers, products, perceptionTypes] = await Promise.all([
    getSuppliersByCompany(),
    getProductsByCompany(),
    listTaxTypes('PERCEPTION'),
  ]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Nueva factura de compra</h1>
      <PurchaseInvoiceForm
        suppliers={suppliers as any}
        products={products.map((p) => ({ ...p, cost_price: Number(p.cost_price), vat_rate: Number(p.vat_rate) }))}
        perceptionTypes={perceptionTypes.filter((t) => t.is_active)}
      />
    </div>
  );
}
