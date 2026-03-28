import { getReceivingNotesPaginated } from '../actions.server';
import { ReceivingNotesDataTable } from './_ReceivingNotesDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';

interface Props { searchParams: DataTableSearchParams; }

export default async function ReceivingNotesList({ searchParams }: Props) {
  const { data, total } = await getReceivingNotesPaginated(searchParams);
  return <ReceivingNotesDataTable data={data} totalRows={total} searchParams={searchParams as any} />;
}
