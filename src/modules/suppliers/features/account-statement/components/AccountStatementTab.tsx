import {
  getSupplierInvoices,
  getSupplierPurchaseOrders,
  getSupplierReceivingNotes,
  getSupplierPaymentOrders,
  getSupplierExpenses,
} from '../actions.server';
import {
  getSupplierCreditBalance,
  getInvoicesForCreditApplication,
} from '../../credit/actions.server';
import { AccountStatementAccordion } from './AccountStatementAccordion';

interface Props {
  supplierId: string;
}

export default async function AccountStatementTab({ supplierId }: Props) {
  const [
    invoices,
    purchaseOrders,
    receivingNotes,
    paymentOrders,
    expenses,
    creditBalance,
    applicableInvoices,
  ] = await Promise.all([
    getSupplierInvoices(supplierId),
    getSupplierPurchaseOrders(supplierId),
    getSupplierReceivingNotes(supplierId),
    getSupplierPaymentOrders(supplierId),
    getSupplierExpenses(supplierId),
    getSupplierCreditBalance(supplierId),
    getInvoicesForCreditApplication(supplierId),
  ]);

  return (
    <AccountStatementAccordion
      supplierId={supplierId}
      invoices={invoices}
      purchaseOrders={purchaseOrders}
      receivingNotes={receivingNotes}
      paymentOrders={paymentOrders}
      expenses={expenses}
      creditBalance={creditBalance}
      applicableInvoices={applicableInvoices}
    />
  );
}
