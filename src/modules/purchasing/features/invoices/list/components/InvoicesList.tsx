import { getPurchaseInvoicesPaginated } from '../actions.server';
import { InvoicesDataTable } from './_InvoicesDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';

interface Props { searchParams: DataTableSearchParams; }

export default async function InvoicesList({ searchParams }: Props) {
  const { data, total } = await getPurchaseInvoicesPaginated(searchParams);
  return <InvoicesDataTable data={data} totalRows={total} searchParams={searchParams as any} />;
}
