import { getWithdrawalOrdersPaginated } from '../actions.server';
import { WithdrawalsDataTable } from './_WithdrawalsDataTable';
import type { DataTableSearchParams } from '@/shared/components/data-table/types';

export default async function WithdrawalsList({ searchParams }: { searchParams: DataTableSearchParams }) {
  const { data, total } = await getWithdrawalOrdersPaginated(searchParams);
  return <WithdrawalsDataTable data={data} totalRows={total} searchParams={searchParams as any} />;
}
