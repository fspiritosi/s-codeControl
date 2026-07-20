import { notFound, redirect } from 'next/navigation';
import { getSalesInvoiceById } from '@/modules/sales/features/invoices/list/actions.server';
import { getSalesInvoiceFormData } from '@/modules/sales/features/invoices/create/actions.server';
import EditSalesInvoice from '@/modules/sales/features/invoices/edit/components/EditSalesInvoice';
import type { SalesInvoiceInitialData } from '@/modules/sales/features/invoices/create/components/SalesInvoiceForm';

function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export default async function EditSalesInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [invoice, formData] = await Promise.all([getSalesInvoiceById(id), getSalesInvoiceFormData()]);
  if (!invoice) return notFound();
  if (invoice.status !== 'DRAFT') redirect(`/dashboard/sales/invoices/${id}`);

  const initialData: SalesInvoiceInitialData = {
    id: invoice.id,
    customer_id: invoice.customer_id,
    point_of_sale_id: invoice.point_of_sale_id ?? '',
    voucher_type: invoice.voucher_type,
    issue_date: toDateInput(invoice.issue_date),
    due_date: toDateInput(invoice.due_date),
    cae: invoice.cae ?? '',
    cae_expiry_date: toDateInput(invoice.cae_expiry_date),
    currency: invoice.currency ?? 'ARS',
    exchange_rate: Number(invoice.exchange_rate) || 1,
    notes: invoice.notes ?? '',
    original_invoice_id: invoice.original_invoice_id ?? null,
    global_discount_type: (invoice.global_discount_type as 'PERCENTAGE' | 'FIXED' | null) ?? null,
    global_discount_value:
      invoice.global_discount_value !== null && invoice.global_discount_value !== undefined
        ? Number(invoice.global_discount_value)
        : null,
    lines: invoice.lines.map((l) => ({
      service_item_id: l.service_item_id ?? '',
      description: l.description,
      quantity: Number(l.quantity),
      unit_price: Number(l.unit_price),
      vat_rate: Number(l.vat_rate),
      discount_type: (l.discount_type as 'PERCENTAGE' | 'FIXED' | null) ?? null,
      discount_value: l.discount_value !== null && l.discount_value !== undefined ? Number(l.discount_value) : null,
    })),
    perceptions: invoice.perceptions.map((p) => ({
      tax_type_id: p.tax_type_id,
      base_amount: Number(p.base_amount),
      rate: Number(p.rate),
      amount: Number(p.amount),
      notes: p.notes ?? '',
    })),
    other_charges: invoice.other_charges_items.map((oc) => ({
      description: oc.description,
      amount: Number(oc.amount),
    })),
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Editar factura de venta</h1>
      <EditSalesInvoice
        invoice={initialData}
        customers={formData.customers}
        pointsOfSale={formData.pointsOfSale}
        perceptionTypes={formData.perceptionTypes}
      />
    </div>
  );
}
