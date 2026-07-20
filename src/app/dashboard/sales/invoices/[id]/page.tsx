import { notFound } from 'next/navigation';
import { getSalesInvoiceById } from '@/modules/sales/features/invoices/list/actions.server';
import SalesInvoiceDetail from '@/modules/sales/features/invoices/detail/components/SalesInvoiceDetail';

export default async function SalesInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getSalesInvoiceById(id);
  if (!invoice) return notFound();

  return <SalesInvoiceDetail invoice={invoice} />;
}
