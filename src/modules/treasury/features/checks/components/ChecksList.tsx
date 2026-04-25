import { getChecks } from '../actions.server';
import { getAllBankAccounts } from '../../bank-accounts/actions.server';
import { ChecksClient } from './ChecksClient';

export default async function ChecksList() {
  const [checks, bankAccounts] = await Promise.all([
    getChecks(),
    getAllBankAccounts(),
  ]);

  return (
    <ChecksClient
      checks={checks.map((c) => ({
        id: c.id,
        type: c.type,
        status: c.status,
        check_number: c.check_number,
        bank_name: c.bank_name,
        branch: c.branch,
        account_number: c.account_number,
        amount: c.amount,
        issue_date: c.issue_date.toISOString(),
        due_date: c.due_date.toISOString(),
        drawer_name: c.drawer_name,
        drawer_tax_id: c.drawer_tax_id,
        payee_name: c.payee_name,
        customer_id: c.customer_id,
        supplier_id: c.supplier_id,
        notes: c.notes,
        customer_name: c.customer?.name ?? null,
        supplier_name: c.supplier?.business_name ?? null,
      }))}
      bankAccounts={bankAccounts.map((a) => ({
        id: a.id,
        bank_name: a.bank_name,
        account_number: a.account_number,
      }))}
    />
  );
}
