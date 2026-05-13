import { getSuppliersByCompany } from '@/modules/suppliers/features/list/actions.server';
import { getProductsByCompany } from '@/modules/products/features/list/actions.server';
import { getPurchaseInvoiceForEdit } from '@/modules/purchasing/features/invoices/list/actions.server';
import { listTaxTypes } from '@/modules/settings/features/taxes/actions.server';
import PurchaseInvoiceForm from '@/modules/purchasing/features/invoices/create/components/PurchaseInvoiceForm';
import { notFound } from 'next/navigation';

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [invoiceData, suppliers, products, perceptionTypes] = await Promise.all([
    getPurchaseInvoiceForEdit(id),
    getSuppliersByCompany(),
    getProductsByCompany(),
    listTaxTypes('PERCEPTION'),
  ]);

  if (!invoiceData) return notFound();

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Editar factura de compra</h1>
      <PurchaseInvoiceForm
        suppliers={suppliers as any}
        products={products.map((p) => ({ ...p, cost_price: Number(p.cost_price), vat_rate: Number(p.vat_rate) }))}
        perceptionTypes={perceptionTypes.filter((t) => t.is_active)}
        initialData={invoiceData}
      />
    </div>
  );
}
