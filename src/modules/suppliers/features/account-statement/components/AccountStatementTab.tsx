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
import {
  getSupplierCreditNotes,
  getCreditNoteApplications,
} from '@/shared/actions/credit-notes';
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
    creditNotes,
    creditNoteApplications,
  ] = await Promise.all([
    getSupplierInvoices(supplierId),
    getSupplierPurchaseOrders(supplierId),
    getSupplierReceivingNotes(supplierId),
    getSupplierPaymentOrders(supplierId),
    getSupplierExpenses(supplierId),
    getSupplierCreditBalance(supplierId),
    getInvoicesForCreditApplication(supplierId),
    getSupplierCreditNotes(supplierId),
    getCreditNoteApplications(supplierId),
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
      creditNotes={creditNotes}
      creditNoteApplications={creditNoteApplications}
    />
  );
}
