import {
  getSupplierInvoices,
  getSupplierPurchaseOrders,
  getSupplierReceivingNotes,
  getSupplierPaymentOrders,
} from '../actions.server';
import { AccountStatementAccordion } from './AccountStatementAccordion';

interface Props {
  supplierId: string;
}

export default async function AccountStatementTab({ supplierId }: Props) {
  const [invoices, purchaseOrders, receivingNotes, paymentOrders] = await Promise.all([
    getSupplierInvoices(supplierId),
    getSupplierPurchaseOrders(supplierId),
    getSupplierReceivingNotes(supplierId),
    getSupplierPaymentOrders(supplierId),
  ]);

  return (
    <AccountStatementAccordion
      invoices={invoices}
      purchaseOrders={purchaseOrders}
      receivingNotes={receivingNotes}
      paymentOrders={paymentOrders}
    />
  );
}
