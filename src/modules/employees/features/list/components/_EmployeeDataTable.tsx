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

// All available filters — faceted ones get server counts, text ones use contains
const FILTER_DEFINITIONS: { columnId: string; title: string; type: 'faceted' | 'text' | 'dateRange' }[] = [
  { columnId: 'status', title: 'Estado', type: 'faceted' },
  { columnId: 'type_of_contract', title: 'Tipo de contrato', type: 'faceted' },
  { columnId: 'document_type', title: 'Tipo de documento', type: 'faceted' },
  { columnId: 'gender', title: 'Género', type: 'faceted' },
  { columnId: 'nationality', title: 'Nacionalidad', type: 'faceted' },
  { columnId: 'hierarchical_position', title: 'Posición jerárquica', type: 'faceted' },
  { columnId: 'marital_status', title: 'Estado civil', type: 'faceted' },
  { columnId: 'level_of_education', title: 'Nivel de estudios', type: 'faceted' },
  { columnId: 'affiliate_status', title: 'Estado afiliación', type: 'faceted' },
  { columnId: 'allocated_to', title: 'Afectado a', type: 'text' },
  { columnId: 'company_position', title: 'Posición en empresa', type: 'text' },
  { columnId: 'workflow_diagram', title: 'Diagrama de trabajo', type: 'text' },
  { columnId: 'province', title: 'Provincia', type: 'text' },
  { columnId: 'city', title: 'Ciudad', type: 'text' },
  { columnId: 'cuil', title: 'CUIL', type: 'text' },
  { columnId: 'document_number', title: 'Nro. documento', type: 'text' },
  { columnId: 'email', title: 'Email', type: 'text' },
  { columnId: 'lastname', title: 'Apellido', type: 'text' },
  { columnId: 'firstname', title: 'Nombre', type: 'text' },
  { columnId: 'phone', title: 'Teléfono', type: 'text' },
  { columnId: 'street', title: 'Calle', type: 'text' },
  { columnId: 'file', title: 'Legajo', type: 'text' },
  { columnId: 'normal_hours', title: 'Horas normales', type: 'text' },
  { columnId: 'guild', title: 'Gremio', type: 'text' },
  { columnId: 'covenants', title: 'Convenio', type: 'text' },
  { columnId: 'category', title: 'Categoría', type: 'text' },
  { columnId: 'birthplace', title: 'Lugar de nacimiento', type: 'text' },
  { columnId: 'born_date', title: 'Fecha de nacimiento', type: 'dateRange' },
  { columnId: 'date_of_admission', title: 'Fecha de ingreso', type: 'dateRange' },
];

// Filters visible by default (the rest are available via the filter toggle)
const DEFAULT_VISIBLE_FILTERS = new Set([
  'status',
  'type_of_contract',
  'document_type',
  'gender',
  'nationality',
  'hierarchical_position',
]);

export function _EmployeeDataTable({ data, totalRows, searchParams }: Props) {
  const [facets, setFacets] = useState<Record<string, FacetEntry[]> | null>(null);

  useEffect(() => {
    getEmployeeFacets().then(setFacets).catch(console.error);
  }, []);

  const buildFacetConfig = (
    entries: FacetEntry[] | undefined,
  ): { options: { value: string; label: string }[]; externalCounts: Map<string, number> } => {
    if (!entries || entries.length === 0) return { options: [], externalCounts: new Map() };
    return {
      options: entries.map((e) => ({ value: e.value, label: e.label ?? e.value })),
      externalCounts: new Map(entries.map((e) => [e.value, e.count])),
    };
  };

  const facetedFilters: DataTableFacetedFilterConfig[] = useMemo(() => {
    return FILTER_DEFINITIONS.map((def) => {
      if (def.type === 'text') {
        return { columnId: def.columnId, title: def.title, type: 'text' as const };
      }
      if (def.type === 'dateRange') {
        return { columnId: def.columnId, title: def.title, type: 'dateRange' as const };
      }
      const facet = buildFacetConfig(facets?.[def.columnId]);
      return {
        columnId: def.columnId,
        title: def.title,
        type: 'faceted' as const,
        options: facet.options,
        externalCounts: facet.externalCounts,
      };
    });
  }, [facets]);

  const initialFilterVisibility = useMemo(() => {
    const visibility: Record<string, boolean> = {};
    for (const def of FILTER_DEFINITIONS) {
      visibility[def.columnId] = DEFAULT_VISIBLE_FILTERS.has(def.columnId);
    }
    return visibility;
  }, []);

  const initialColumnVisibility = useMemo(() => {
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

    const visibility: Record<string, boolean> = {};
    for (const col of employeeColumns) {
      const colId = (col as any).accessorKey ?? (col as any).id;
      if (!colId || colId === 'actions') continue;
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
      showFilterToggle={true}
      initialFilterVisibility={initialFilterVisibility}
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
          hierarchical_position: (val: unknown, row: any) => row?.hierarchy_rel?.name ?? String(val ?? ''),
          birthplace: (val: unknown, row: any) => row?.birthplace_rel?.name ?? String(val ?? ''),
          workflow_diagram: (val: unknown, row: any) => row?.workflow_diagram_rel?.name ?? String(val ?? ''),
          province: (val: unknown, row: any) => row?.province_rel?.name ?? String(val ?? ''),
          city: (val: unknown, row: any) => row?.city_rel?.name ?? String(val ?? ''),
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
