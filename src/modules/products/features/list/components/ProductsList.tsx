import { getProductsPaginated } from '../actions.server';
import { ProductsDataTable } from './_ProductsDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';

interface Props {
  searchParams: DataTableSearchParams;
}

export default async function ProductsList({ searchParams }: Props) {
  const { data, total } = await getProductsPaginated(searchParams);

  return <ProductsDataTable data={data} totalRows={total} searchParams={searchParams as any} />;
}
