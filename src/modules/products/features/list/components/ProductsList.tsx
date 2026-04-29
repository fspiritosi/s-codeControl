import { getProductsPaginated } from '../actions.server';
import { ProductsDataTable } from './_ProductsDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import { getCompanyScope } from '@/shared/lib/company-scope';

interface Props {
  searchParams: DataTableSearchParams;
}

export default async function ProductsList({ searchParams }: Props) {
  const [{ data, total }, scope] = await Promise.all([
    getProductsPaginated(searchParams),
    getCompanyScope(),
  ]);

  return (
    <ProductsDataTable
      data={data}
      totalRows={total}
      searchParams={searchParams as any}
      showCompany={!!scope?.groupId}
    />
  );
}
