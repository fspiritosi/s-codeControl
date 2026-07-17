import { getPurchaseInvoicesPaginated } from '../actions.server';
import { InvoicesDataTable } from './_InvoicesDataTable';
import { isActiveUserOwner } from '@/shared/lib/permissions';
import type { DataTableSearchParams } from '@/shared/components/data-table/types';

interface Props { searchParams: DataTableSearchParams; }

export default async function InvoicesList({ searchParams }: Props) {
  const [{ data, total }, isOwner] = await Promise.all([
    getPurchaseInvoicesPaginated(searchParams),
    isActiveUserOwner(),
  ]);
  return <InvoicesDataTable data={data} totalRows={total} searchParams={searchParams as any} isOwner={isOwner} />;
}
