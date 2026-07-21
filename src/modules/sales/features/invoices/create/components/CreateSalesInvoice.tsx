'use client';

import SalesInvoiceForm from './SalesInvoiceForm';

interface Props {
  customers: { id: string; name: string; tax_id?: string | null }[];
  pointsOfSale: { id: string; number: number; name: string }[];
  perceptionTypes: {
    id: string;
    code: string;
    name: string;
    default_rate: number;
    calculation_base: 'NET' | 'TOTAL' | 'VAT';
  }[];
}

export default function CreateSalesInvoice(props: Props) {
  return <SalesInvoiceForm {...props} />;
}
