import { getEmployeeDocumentsPaginated } from '@/modules/documents/features/list/actions.server';
import { _EmployeeDocumentDataTable } from './_EmployeeDocumentDataTable';
import type { DataTableSearchParams } from '@/shared/components/data-table';

interface Props {
  searchParams: DataTableSearchParams;
  monthly?: boolean;
  downDocument?: boolean;
}

export async function EmployeeDocumentList({ searchParams, monthly, downDocument }: Props) {
  // Solo la data paginada bloquea el render de la tabla. Los facets (opciones de filtro)
  // se cargan en el cliente sin bloquear (ver _EmployeeDocumentDataTable): moverlos al
  // servidor metía su query lenta en el path del stream RSC y retrasaba el LCP de la tabla.
  // [PERF][TEMP] instrumentación para medir el tiempo de la query en prod (Vercel logs).
  const __t0 = Date.now();
  const { data, total } = await getEmployeeDocumentsPaginated(searchParams, { monthly, downDocument });
  console.log(`[PERF] getEmployeeDocumentsPaginated ${Date.now() - __t0}ms (monthly=${!!monthly} down=${!!downDocument} rows=${data.length} total=${total})`);

  return (
    <_EmployeeDocumentDataTable
      data={data}
      totalRows={total}
      searchParams={searchParams}
      monthly={monthly}
      downDocument={downDocument}
    />
  );
}
