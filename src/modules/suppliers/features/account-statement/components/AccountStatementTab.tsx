import {
  getSupplierInvoices,
  getSupplierPurchaseOrders,
  getSupplierReceivingNotes,
  getSupplierPaymentOrders,
  getSupplierExpenses,
} from '../actions.server';
import { AccountStatementAccordion } from './AccountStatementAccordion';

interface Props {
  supplierId: string;
}

export default async function AccountStatementTab({ supplierId }: Props) {
  const [invoices, purchaseOrders, receivingNotes, paymentOrders, expenses] = await Promise.all([
    getSupplierInvoices(supplierId),
    getSupplierPurchaseOrders(supplierId),
    getSupplierReceivingNotes(supplierId),
    getSupplierPaymentOrders(supplierId),
    getSupplierExpenses(supplierId),
  ]);

  return (
    <AccountStatementAccordion
      invoices={invoices}
      purchaseOrders={purchaseOrders}
      receivingNotes={receivingNotes}
      paymentOrders={paymentOrders}
      expenses={expenses}
    />
  );
}
