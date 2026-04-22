import { getEmployeeDocumentsPaginated } from '@/modules/documents/features/list/actions.server';
import { _EmployeeDocumentDataTable } from './_EmployeeDocumentDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

interface Props {
  searchParams: DataTableSearchParams;
  monthly?: boolean;
}

export async function EmployeeDocumentList({ searchParams, monthly }: Props) {
  const { data, total } = await getEmployeeDocumentsPaginated(searchParams, { monthly });

  return (
    <_EmployeeDocumentDataTable
      data={data}
      totalRows={total}
      searchParams={searchParams}
      monthly={monthly}
    />
  );
}
