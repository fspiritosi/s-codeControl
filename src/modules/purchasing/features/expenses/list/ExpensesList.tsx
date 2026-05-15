import type { DataTableSearchParams } from '@/shared/components/common/DataTable';
import { getExpensesPaginated, getExpenseFacetCounts, getExpenseCategories } from '../actions.server';
import { _ExpensesDataTable } from './components/_ExpensesDataTable';
import { NoAccessView } from '@/shared/components/common/NoAccessView';
import { PermissionDeniedError } from '@/shared/lib/permissions';

interface Props {
  searchParams?: DataTableSearchParams;
}

export async function ExpensesList({ searchParams = {} }: Props) {
  try {
    const [{ data, total }, facetCounts, categories] = await Promise.all([
      getExpensesPaginated(searchParams),
      getExpenseFacetCounts(),
      getExpenseCategories(),
    ]);

    return (
      <_ExpensesDataTable
        data={data as any}
        totalRows={total}
        searchParams={searchParams}
        facetCounts={facetCounts}
        categories={categories}
      />
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return <NoAccessView module="Gastos" permission={error.permission} />;
    }
    throw error;
  }
}
