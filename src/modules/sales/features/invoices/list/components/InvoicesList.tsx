import { getSalesInvoicesPaginated } from '../actions.server';
import { SalesInvoicesDataTable } from './_SalesInvoicesDataTable';
import type { DataTableSearchParams } from '@/shared/components/data-table/types';

interface Props {
  searchParams: DataTableSearchParams;
}

export default async function InvoicesList({ searchParams }: Props) {
  const { data, total } = await getSalesInvoicesPaginated(searchParams);
  return <SalesInvoicesDataTable data={data} totalRows={total} searchParams={searchParams as any} />;
}
