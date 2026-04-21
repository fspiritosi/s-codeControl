import { getPurchaseOrdersPaginated } from '../actions.server';
import { PurchaseOrdersDataTable } from './_PurchaseOrdersDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';

interface Props {
  searchParams: DataTableSearchParams;
}

export default async function PurchaseOrdersList({ searchParams }: Props) {
  const { data, total } = await getPurchaseOrdersPaginated(searchParams);
  return <PurchaseOrdersDataTable data={data} totalRows={total} searchParams={searchParams as any} />;
}
