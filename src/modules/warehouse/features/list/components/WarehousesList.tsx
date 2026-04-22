import { getWarehousesPaginated } from '../actions.server';
import { WarehousesDataTable } from './_WarehousesDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';

interface Props {
  searchParams: DataTableSearchParams;
}

export default async function WarehousesList({ searchParams }: Props) {
  const { data, total } = await getWarehousesPaginated(searchParams);
  return <WarehousesDataTable data={data} totalRows={total} searchParams={searchParams as any} />;
}
