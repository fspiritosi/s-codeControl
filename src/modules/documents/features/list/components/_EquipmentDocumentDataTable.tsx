'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DataTable,
  type DataTableFacetedFilterConfig,
  type DataTableSearchParams,
} from '@/shared/components/common/DataTable';
import { permanentEquipmentDocColumns, monthlyEquipmentDocColumns } from './document-columns-equipment';
import { getEquipmentDocumentFacets, getAllEquipmentDocumentsForExport } from '../actions.server';

interface FacetEntry {
  value: string;
  count: number;
}

interface Props {
  data: any[];
  totalRows: number;
  searchParams: DataTableSearchParams;
  monthly?: boolean;
}

const FILTER_DEFINITIONS: { columnId: string; title: string; type: 'faceted' | 'text' | 'dateRange' }[] = [
  { columnId: 'state', title: 'Estado', type: 'faceted' },
  { columnId: 'mandatory', title: 'Obligatorio', type: 'faceted' },
  { columnId: 'resource', title: 'Equipo (Dominio)', type: 'text' },
  { columnId: 'documentName', title: 'Documento', type: 'text' },
  { columnId: 'allocated_to', title: 'Tipo de vehiculo', type: 'text' },
  { columnId: 'validity', title: 'Vencimiento', type: 'dateRange' },
];

const DEFAULT_VISIBLE_FILTERS = new Set(['state', 'resource', 'documentName']);

export function _EquipmentDocumentDataTable({ data, totalRows, searchParams, monthly }: Props) {
  const [facets, setFacets] = useState<Record<string, FacetEntry[]> | null>(null);
  const columns = monthly ? monthlyEquipmentDocColumns : permanentEquipmentDocColumns;
  const tableId = monthly ? 'equipment-docs-monthly' : 'equipment-docs-permanent';

  useEffect(() => {
    getEquipmentDocumentFacets({ monthly }).then(setFacets).catch(console.error);
  }, [monthly]);

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
      if (def.type === 'dateRange') return { columnId: def.columnId, title: def.title, type: 'dateRange' as const };
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
    const visible = new Set(['resource', 'intern_number', 'documentName', 'state', 'mandatory', 'validity', 'date', 'id']);
    const vis: Record<string, boolean> = {};
    for (const col of columns) {
      const colId = (col as any).accessorKey ?? (col as any).id;
      if (!colId || colId === 'actions') continue;
      if (!visible.has(colId)) vis[colId] = false;
    }
    return vis;
  }, [columns]);

  return (
    <DataTable
      columns={columns}
      data={data}
      totalRows={totalRows}
      searchParams={searchParams}
      tableId={tableId}
      searchColumn="resource"
      searchPlaceholder="Buscar por dominio, nro. interno o documento..."
      showSearch={true}
      emptyMessage="No se encontraron documentos."
      facetedFilters={facetedFilters}
      showFilterToggle={true}
      initialFilterVisibility={initialFilterVisibility}
      initialColumnVisibility={initialColumnVisibility}
      exportConfig={{
        fetchAllData: () => getAllEquipmentDocumentsForExport(searchParams, { monthly }),
        options: {
          filename: monthly ? 'documentos-mensuales-equipos' : 'documentos-permanentes-equipos',
          sheetName: monthly ? 'Mensuales' : 'Permanentes',
          title: monthly ? 'Documentos Mensuales de Equipos' : 'Documentos Permanentes de Equipos',
          includeDate: true,
        },
      }}
    />
  );
}
