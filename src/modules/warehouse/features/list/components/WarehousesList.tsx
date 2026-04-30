import { getWarehousesPaginated } from '../actions.server';
import { WarehousesDataTable } from './_WarehousesDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import { getCompanyScope } from '@/shared/lib/company-scope';

interface Props {
  searchParams: DataTableSearchParams;
}

export default async function WarehousesList({ searchParams }: Props) {
  const [{ data, total }, scope] = await Promise.all([
    getWarehousesPaginated(searchParams),
    getCompanyScope(),
  ]);
  return (
    <WarehousesDataTable
      data={data}
      totalRows={total}
      searchParams={searchParams as any}
      showCompany={!!scope?.groupId}
    />
  );
}
