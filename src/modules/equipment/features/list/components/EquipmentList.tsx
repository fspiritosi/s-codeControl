import { getEquipmentPaginated } from '@/modules/equipment/features/list/actions.server';
import { _EquipmentDataTable } from './_EquipmentDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

interface Props {
  searchParams: DataTableSearchParams;
  showInactive?: boolean;
}

export async function EquipmentList({ searchParams, showInactive }: Props) {
  const { data, total } = await getEquipmentPaginated(searchParams, { showInactive });

  return (
    <_EquipmentDataTable
      data={data}
      totalRows={total}
      searchParams={searchParams}
    />
  );
}
