import { getCashRegistersPaginated } from '../actions.server';
import { CashRegistersTable } from './CashRegistersTable';

export default async function CashRegistersList() {
  const { data } = await getCashRegistersPaginated({ pageSize: '100' });

  const rows = data.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    location: r.location,
    status: r.status,
    is_default: r.is_default,
  }));

  return <CashRegistersTable items={rows} />;
}
