import { getSuppliersForOrder } from '../actions.server';
import { getAllCashRegisters } from '../../cash-registers/actions.server';
import { getAllBankAccounts } from '../../bank-accounts/actions.server';
import { NewPaymentOrderForm } from './NewPaymentOrderForm';

export async function NewPaymentOrderShell() {
  const [suppliers, cashRegisters, bankAccounts] = await Promise.all([
    getSuppliersForOrder(),
    getAllCashRegisters(),
    getAllBankAccounts(),
  ]);

  return (
    <NewPaymentOrderForm
      suppliers={suppliers.map((s) => ({
        id: s.id,
        code: s.code,
        business_name: s.business_name,
        tax_id: s.tax_id,
      }))}
      cashRegisters={cashRegisters.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
      }))}
      bankAccounts={bankAccounts.map((a) => ({
        id: a.id,
        bank_name: a.bank_name,
        account_number: a.account_number,
      }))}
    />
  );
}
