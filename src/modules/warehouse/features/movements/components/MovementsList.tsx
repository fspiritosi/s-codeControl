import { getStockMovementsPaginated } from '@/modules/warehouse/features/list/actions.server';
import { MovementsDataTable } from './_MovementsDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import { getCompanyScope } from '@/shared/lib/company-scope';

interface Props {
  searchParams: DataTableSearchParams;
}

export default async function MovementsList({ searchParams }: Props) {
  const [{ data, total }, scope] = await Promise.all([
    getStockMovementsPaginated(searchParams),
    getCompanyScope(),
  ]);
  return (
    <MovementsDataTable
      data={data}
      totalRows={total}
      searchParams={searchParams as any}
      showCompany={!!scope?.groupId}
    />
  );
}
