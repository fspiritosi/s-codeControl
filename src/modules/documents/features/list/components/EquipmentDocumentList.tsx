import { getEquipmentDocumentsPaginated } from '@/modules/documents/features/list/actions.server';
import { _EquipmentDocumentDataTable } from './_EquipmentDocumentDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

interface Props {
  searchParams: DataTableSearchParams;
  monthly?: boolean;
}

export async function EquipmentDocumentList({ searchParams, monthly }: Props) {
  const { data, total } = await getEquipmentDocumentsPaginated(searchParams, { monthly });

  return (
    <_EquipmentDocumentDataTable
      data={data}
      totalRows={total}
      searchParams={searchParams}
      monthly={monthly}
    />
  );
}
