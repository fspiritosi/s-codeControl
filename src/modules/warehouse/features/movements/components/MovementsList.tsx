import { getStockMovementsPaginated } from '@/modules/warehouse/features/list/actions.server';
import { MovementsDataTable } from './_MovementsDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';

interface Props {
  searchParams: DataTableSearchParams;
}

export default async function MovementsList({ searchParams }: Props) {
  const { data, total } = await getStockMovementsPaginated(searchParams);
  return <MovementsDataTable data={data} totalRows={total} searchParams={searchParams as any} />;
}
