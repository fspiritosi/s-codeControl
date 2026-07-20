import { getReceiptsPaginated } from '../actions.server';
import { ReceiptsDataTable } from './_ReceiptsDataTable';
import type { DataTableSearchParams } from '@/shared/components/data-table/types';
import type { ReceiptRow } from './columns';

interface Props {
  searchParams: DataTableSearchParams;
}

export default async function ReceiptsList({ searchParams }: Props) {
  const { data, total } = await getReceiptsPaginated(searchParams);
  return (
    <ReceiptsDataTable
      data={data as unknown as ReceiptRow[]}
      totalRows={total}
      searchParams={searchParams as Record<string, string | undefined>}
    />
  );
}
