import { getAllBankAccounts } from '../actions.server';
import { BankAccountsTable } from './BankAccountsTable';

export default async function BankAccountsList() {
  const data = await getAllBankAccounts();
  return <BankAccountsTable items={data} />;
}
