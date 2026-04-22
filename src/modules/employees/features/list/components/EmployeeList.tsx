import { getEmployeesPaginated } from '../actions.server';
import { _EmployeeDataTable } from './_EmployeeDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

interface Props {
  searchParams: DataTableSearchParams;
  showInactive?: boolean;
}

export async function EmployeeList({ searchParams, showInactive }: Props) {
  // If showInactive, inject is_active=false into the filters before calling the action
  const effectiveParams: DataTableSearchParams = showInactive
    ? { ...searchParams, is_active: 'false' }
    : searchParams;

  const { data, total } = await getEmployeesPaginated(effectiveParams);

  return (
    <div>
      <_EmployeeDataTable
        data={data}
        totalRows={total}
        searchParams={effectiveParams}
      />
    </div>
  );
}
