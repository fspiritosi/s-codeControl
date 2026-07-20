import CreateSalesInvoice from '@/modules/sales/features/invoices/create/components/CreateSalesInvoice';
import { getSalesInvoiceFormData } from '@/modules/sales/features/invoices/create/actions.server';

export default async function NewSalesInvoicePage() {
  const { customers, pointsOfSale, perceptionTypes } = await getSalesInvoiceFormData();

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Nueva factura de venta</h1>
      <CreateSalesInvoice
        customers={customers}
        pointsOfSale={pointsOfSale}
        perceptionTypes={perceptionTypes}
      />
    </div>
  );
}
