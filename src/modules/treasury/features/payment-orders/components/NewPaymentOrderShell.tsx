import { getSuppliersForOrder } from '../actions.server';
import { getAllCashRegisters } from '../../cash-registers/actions.server';
import { getAllBankAccounts } from '../../bank-accounts/actions.server';
import { listTaxTypes } from '@/modules/settings/features/taxes/actions.server';
import { NewPaymentOrderForm, type PaymentOrderEditData } from './NewPaymentOrderForm';

interface ShellProps {
  initialData?: PaymentOrderEditData;
}

export async function NewPaymentOrderShell({ initialData }: ShellProps = {}) {
  const [suppliers, cashRegisters, bankAccounts, retentionTypes] = await Promise.all([
    getSuppliersForOrder(),
    getAllCashRegisters(),
    getAllBankAccounts(),
    listTaxTypes('RETENTION'),
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
        has_open_session: c.has_open_session,
      }))}
      bankAccounts={bankAccounts.map((a) => ({
        id: a.id,
        bank_name: a.bank_name,
        account_number: a.account_number,
      }))}
      retentionTypes={retentionTypes
        .filter((t) => t.is_active)
        .map((t) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          default_rate: t.default_rate,
          calculation_base: t.calculation_base,
        }))}
      initialData={initialData}
    />
  );
}
