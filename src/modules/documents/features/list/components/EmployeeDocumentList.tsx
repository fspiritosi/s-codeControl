import {
  getEmployeeDocumentsPaginated,
  getEmployeeDocumentFacets,
} from '@/modules/documents/features/list/actions.server';
import { _EmployeeDocumentDataTable } from './_EmployeeDocumentDataTable';
import type { DataTableSearchParams } from '@/shared/components/data-table';

interface Props {
  searchParams: DataTableSearchParams;
  monthly?: boolean;
  downDocument?: boolean;
}

export async function EmployeeDocumentList({ searchParams, monthly, downDocument }: Props) {
  // Facets se fetchean en el servidor (en paralelo con los datos) y se pasan como prop:
  // antes se cargaban con un useEffect cliente, generando un server-action POST secuencial
  // por tabla (Next serializa los server actions → waterfall). Ahora es 1 render RSC.
  const [{ data, total }, facets] = await Promise.all([
    getEmployeeDocumentsPaginated(searchParams, { monthly, downDocument }),
    getEmployeeDocumentFacets({ monthly, downDocument }),
  ]);

  return (
    <_EmployeeDocumentDataTable
      data={data}
      totalRows={total}
      facets={facets}
      searchParams={searchParams}
      monthly={monthly}
      downDocument={downDocument}
    />
  );
}
