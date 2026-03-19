import { getDocumentTypesPaginated } from '@/modules/documents/features/types/actions.server';
import { _DocumentTypeDataTable } from './_DocumentTypeDataTable';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

interface Props {
  searchParams: DataTableSearchParams;
  appliesFilter?: string;
}

export async function DocumentTypeList({ searchParams, appliesFilter }: Props) {
  const { data, total } = await getDocumentTypesPaginated(searchParams, appliesFilter);

  return (
    <_DocumentTypeDataTable
      data={data}
      totalRows={total}
      searchParams={searchParams}
      appliesFilter={appliesFilter}
    />
  );
}
