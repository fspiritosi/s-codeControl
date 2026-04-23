'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DataTable,
  type DataTableFacetedFilterConfig,
  type DataTableSearchParams,
} from '@/shared/components/common/DataTable';
import { equipmentColumns } from './equipment-columns';
import { getEquipmentFacets, getAllEquipmentForExport } from '../actions.server';

interface FacetEntry { value: string; count: number }

interface Props {
  data: any[];
  totalRows: number;
  searchParams: DataTableSearchParams;
}

const FILTER_DEFINITIONS: { columnId: string; title: string; type: 'faceted' | 'text' }[] = [
  { columnId: 'status', title: 'Estado', type: 'faceted' },
  { columnId: 'condition', title: 'Condición', type: 'faceted' },
  { columnId: 'domain', title: 'Dominio', type: 'text' },
  { columnId: 'intern_number', title: 'Nro. interno', type: 'text' },
  { columnId: 'chassis', title: 'Chassis', type: 'text' },
  { columnId: 'engine', title: 'Motor', type: 'text' },
  { columnId: 'serie', title: 'Serie', type: 'text' },
  { columnId: 'brand', title: 'Marca', type: 'text' },
  { columnId: 'model', title: 'Modelo', type: 'text' },
  { columnId: 'year', title: 'Año', type: 'text' },
];

const DEFAULT_VISIBLE_FILTERS = new Set(['status', 'condition']);

export function _EquipmentDataTable({ data, totalRows, searchParams }: Props) {
  const [facets, setFacets] = useState<Record<string, FacetEntry[]> | null>(null);

  useEffect(() => {
    getEquipmentFacets().then(setFacets).catch(console.error);
  }, []);

  const buildFacetConfig = (entries: FacetEntry[] | undefined) => {
    if (!entries || entries.length === 0) return { options: [], externalCounts: new Map<string, number>() };
    return {
      options: entries.map((e) => ({ value: e.value, label: e.value })),
      externalCounts: new Map(entries.map((e) => [e.value, e.count])),
    };
  };

  const facetedFilters: DataTableFacetedFilterConfig[] = useMemo(() => {
    return FILTER_DEFINITIONS.map((def) => {
      if (def.type === 'text') return { columnId: def.columnId, title: def.title, type: 'text' as const };
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
    const vis: Record<string, boolean> = {};
    for (const def of FILTER_DEFINITIONS) vis[def.columnId] = DEFAULT_VISIBLE_FILTERS.has(def.columnId);
    return vis;
  }, []);

  const initialColumnVisibility = useMemo(() => {
    const visible = new Set([
      'intern_number', 'domain', 'status', 'type', 'types_of_vehicles',
      'allocated_to', 'condition', 'brand', 'model', 'year',
    ]);
    const vis: Record<string, boolean> = {};
    for (const col of equipmentColumns) {
      const colId = (col as any).accessorKey ?? (col as any).id;
      if (!colId || colId === 'actions') continue;
      if (!visible.has(colId)) vis[colId] = false;
    }
    return vis;
  }, []);

  return (
    <DataTable
      columns={equipmentColumns}
      data={data}
      totalRows={totalRows}
      searchParams={searchParams}
      tableId="equipment-list"
      emptyMessage="No se encontraron equipos."
      facetedFilters={facetedFilters}
      showFilterToggle={true}
      initialFilterVisibility={initialFilterVisibility}
      initialColumnVisibility={initialColumnVisibility}
      exportConfig={{
        fetchAllData: () => getAllEquipmentForExport(searchParams),
        options: {
          filename: 'equipos',
          sheetName: 'Equipos',
          title: 'Listado de Equipos',
          includeDate: true,
        },
        formatters: {
          brand: (_val: unknown, row: any) => row?.brand_rel?.name ?? '',
          model: (_val: unknown, row: any) => row?.model_rel?.name ?? '',
          type: (_val: unknown, row: any) => row?.type_rel?.name ?? '',
          types_of_vehicles: (_val: unknown, row: any) => row?.type_of_vehicle_rel?.name ?? '',
          allocated_to: (_val: unknown, row: any) => {
            const ce = row?.contractor_equipment;
            if (!ce || !Array.isArray(ce) || ce.length === 0) return 'Sin afectar';
            return ce.map((c: any) => c.contractor?.name ?? c.contractor_id?.name).filter(Boolean).join(', ');
          },
        },
      }}
    />
  );
}
