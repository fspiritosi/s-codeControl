import { getSuppliersPaginated } from '../actions.server';
import { SuppliersDataTable } from './_SuppliersDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';

interface Props {
  searchParams: DataTableSearchParams;
}

export default async function SuppliersList({ searchParams }: Props) {
  const { data, total } = await getSuppliersPaginated(searchParams);
  return <SuppliersDataTable data={data} totalRows={total} searchParams={searchParams as any} />;
}
