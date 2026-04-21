'use client';

import { checkListColumns } from './tables/checkListColumns';
import { DataTable } from '@/shared/components/data-table';
import { useRouter } from 'next/navigation';
import { frecuencias } from './tables/data';
import type { DataTableFacetedFilterConfig } from '@/shared/components/data-table';

export default function ChecklistTable({ checklists }: { checklists: CheckListWithAnswer[] }) {
  const router = useRouter();

  const facetedFilters: DataTableFacetedFilterConfig[] = [
    {
      columnId: 'Frecuencia',
      title: 'Frecuencia',
      options: frecuencias.map((f) => ({
        value: f.value,
        label: f.label,
        icon: f.icon,
      })),
    },
  ];

  return (
    <DataTable
      columns={checkListColumns}
      data={checklists.map((e) => ({
        title: (e.form as { title: string })?.title,
        id: e.id,
        description: (e.form as { description: string })?.description,
        frequency: (e.form as { frequency: string })?.frequency,
        created_at: e.created_at,
        total_responses: e.form_answers?.length,
      }))}
      searchColumn="Titulo"
      searchPlaceholder="Filtrar por nombre o descripción"
      showSearch={true}
      facetedFilters={facetedFilters}
      showColumnToggle={true}
      onRowClick={(row) => router.push(`/dashboard/forms/${(row as any).id}`)}
      rowClassName="hover:cursor-pointer"
      emptyMessage="Sin resultados"
      tableId="hse-checklist"
    />
  );
}
