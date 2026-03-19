'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DataTable,
  type DataTableFacetedFilterConfig,
  type DataTableSearchParams,
} from '@/shared/components/common/DataTable';
import { employeeColumns } from './employee-columns';
import { getEmployeeFacets, getAllEmployeesForExport } from '../actions.server';

interface FacetEntry {
  value: string;
  count: number;
  label?: string;
}

interface Props {
  data: any[];
  totalRows: number;
  searchParams: DataTableSearchParams;
}

export function _EmployeeDataTable({ data, totalRows, searchParams }: Props) {
  const [facets, setFacets] = useState<Record<string, FacetEntry[]> | null>(null);

  useEffect(() => {
    getEmployeeFacets().then(setFacets).catch(console.error);
  }, []);

  /**
   * Convert a facet array into { options, externalCounts } for DataTableFacetedFilterConfig.
   * If entries have a `label` field (e.g. hierarchical_position), use it; otherwise use `value` as label.
   */
  const buildFacetConfig = (
    entries: FacetEntry[] | undefined,
  ): { options: { value: string; label: string }[]; externalCounts: Map<string, number> } => {
    if (!entries) return { options: [], externalCounts: new Map() };
    return {
      options: entries.map((e) => ({ value: e.value, label: e.label ?? e.value })),
      externalCounts: new Map(entries.map((e) => [e.value, e.count])),
    };
  };

  const facetedFilters: DataTableFacetedFilterConfig[] = useMemo(() => {
    const status = buildFacetConfig(facets?.status);
    const typeOfContract = buildFacetConfig(facets?.type_of_contract);
    const documentType = buildFacetConfig(facets?.document_type);
    const gender = buildFacetConfig(facets?.gender);
    const nationality = buildFacetConfig(facets?.nationality);
    const hierarchicalPosition = buildFacetConfig(facets?.hierarchical_position);

    return [
      {
        columnId: 'status',
        title: 'Estado',
        type: 'faceted' as const,
        options: status.options,
        externalCounts: status.externalCounts,
      },
      {
        columnId: 'type_of_contract',
        title: 'Tipo de contrato',
        type: 'faceted' as const,
        options: typeOfContract.options,
        externalCounts: typeOfContract.externalCounts,
      },
      {
        columnId: 'document_type',
        title: 'Tipo de documento',
        type: 'faceted' as const,
        options: documentType.options,
        externalCounts: documentType.externalCounts,
      },
      {
        columnId: 'gender',
        title: 'Genero',
        type: 'faceted' as const,
        options: gender.options,
        externalCounts: gender.externalCounts,
      },
      {
        columnId: 'nationality',
        title: 'Nacionalidad',
        type: 'faceted' as const,
        options: nationality.options,
        externalCounts: nationality.externalCounts,
      },
      {
        columnId: 'hierarchical_position',
        title: 'Posicion jerarquica',
        type: 'faceted' as const,
        options: hierarchicalPosition.options,
        externalCounts: hierarchicalPosition.externalCounts,
      },
    ];
  }, [facets]);

  const initialColumnVisibility = useMemo(() => {
    // Define which columns should be VISIBLE; all others are hidden
    const visibleColumns = new Set([
      'full_name',
      'status',
      'cuil',
      'document_number',
      'document_type',
      'hierarchical_position',
      'company_position',
      'normal_hours',
      'type_of_contract',
      'allocated_to',
    ]);

    // Build visibility record: all columns from employeeColumns that are NOT in visibleColumns → false
    const visibility: Record<string, boolean> = {};
    for (const col of employeeColumns) {
      const colId = (col as any).accessorKey ?? (col as any).id;
      if (!colId) continue;
      // Skip non-hideable columns (actions)
      if (colId === 'actions') continue;
      if (!visibleColumns.has(colId)) {
        visibility[colId] = false;
      }
    }
    return visibility;
  }, []);

  return (
    <DataTable
      columns={employeeColumns}
      data={data}
      totalRows={totalRows}
      searchParams={searchParams}
      tableId="employees-list"
      searchColumn="full_name"
      searchPlaceholder="Buscar por nombre, CUIL, DNI o email..."
      showSearch={true}
      emptyMessage="No se encontraron empleados."
      facetedFilters={facetedFilters}
      initialColumnVisibility={initialColumnVisibility}
      exportConfig={{
        fetchAllData: () => getAllEmployeesForExport(searchParams),
        options: {
          filename: 'empleados',
          sheetName: 'Empleados',
          title: 'Listado de Empleados',
          includeDate: true,
        },
        formatters: {
          guild: (val: unknown, row: any) => row?.guild_rel?.name ?? String(val ?? ''),
          covenants: (val: unknown, row: any) => row?.covenants_rel?.name ?? String(val ?? ''),
          category: (val: unknown, row: any) => row?.category_rel?.name ?? String(val ?? ''),
          allocated_to: (_val: unknown, row: any) => {
            const contractors = row?.contractor_employee;
            if (!contractors || !Array.isArray(contractors) || contractors.length === 0) {
              return 'Sin afectar';
            }
            return contractors
              .map((ce: any) => ce.contractor?.name)
              .filter(Boolean)
              .join(', ');
          },
        },
      }}
    />
  );
}
