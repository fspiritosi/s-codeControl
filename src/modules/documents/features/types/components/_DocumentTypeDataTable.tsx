'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  DataTable,
  type DataTableFacetedFilterConfig,
  type DataTableSearchParams,
} from '@/shared/components/common/DataTable';
import { Button } from '@/shared/components/ui/button';
import { getDocumentTypeColumns } from './document-type-columns';
import { getDocumentTypeFacets, getAllDocumentTypesForExport } from '../actions.server';
import { DocumentTypeFormModal } from './DocumentTypeFormModal';
import { useRouter } from 'next/navigation';

interface FacetEntry { value: string; count: number }

interface Props {
  data: any[];
  totalRows: number;
  searchParams: DataTableSearchParams;
  appliesFilter?: string;
}

const FILTER_DEFINITIONS: { columnId: string; title: string; type: 'faceted' | 'text' }[] = [
  { columnId: 'applies', title: 'Aplica a', type: 'faceted' },
  { columnId: 'mandatory', title: 'Obligatorio', type: 'faceted' },
  { columnId: 'is_active', title: 'Estado', type: 'faceted' },
  { columnId: 'name', title: 'Nombre', type: 'text' },
];

const DEFAULT_VISIBLE_FILTERS = new Set(['applies', 'mandatory', 'is_active']);

export function _DocumentTypeDataTable({ data, totalRows, searchParams, appliesFilter }: Props) {
  const router = useRouter();
  const [facets, setFacets] = useState<Record<string, FacetEntry[]> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    getDocumentTypeFacets(appliesFilter).then(setFacets).catch(console.error);
  }, [appliesFilter]);

  const handleEdit = useCallback((id: string) => {
    setEditId(id);
    setModalOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditId(null);
    setModalOpen(true);
  }, []);

  const handleSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

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

  const columns = useMemo(() => getDocumentTypeColumns(handleEdit), [handleEdit]);

  const initialColumnVisibility = useMemo(() => {
    const visible = new Set(['name', 'applies', 'mandatory', 'explired', 'is_it_montlhy', 'multiresource', 'is_active']);
    const vis: Record<string, boolean> = {};
    for (const col of columns) {
      const colId = (col as any).accessorKey ?? (col as any).id;
      if (!colId || colId === 'actions') continue;
      if (!visible.has(colId)) vis[colId] = false;
    }
    return vis;
  }, [columns]);

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalRows={totalRows}
        searchParams={searchParams}
        tableId={`document-types-${appliesFilter ?? 'all'}`}
        emptyMessage="No se encontraron tipos de documentos."
        facetedFilters={facetedFilters}
        showFilterToggle={true}
        initialFilterVisibility={initialFilterVisibility}
        initialColumnVisibility={initialColumnVisibility}
        toolbarActions={
          <Button size="sm" onClick={handleCreate}>
            Crear nuevo
          </Button>
        }
        exportConfig={{
          fetchAllData: () => getAllDocumentTypesForExport(searchParams, appliesFilter),
          options: {
            filename: 'tipos-de-documentos',
            sheetName: 'Tipos',
            title: 'Tipos de Documentos',
            includeDate: true,
          },
          formatters: {
            mandatory: (val: unknown) => val ? 'Sí' : 'No',
            explired: (val: unknown) => val ? 'Sí' : 'No',
            is_it_montlhy: (val: unknown) => val ? 'Sí' : 'No',
            multiresource: (val: unknown) => val ? 'Sí' : 'No',
            private: (val: unknown) => val ? 'Sí' : 'No',
            special: (val: unknown) => val ? 'Sí' : 'No',
            down_document: (val: unknown) => val ? 'Sí' : 'No',
            is_active: (val: unknown) => val ? 'Activo' : 'Inactivo',
          },
        }}
      />
      <DocumentTypeFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editId={editId}
        appliesFilter={appliesFilter}
        onSuccess={handleSuccess}
      />
    </>
  );
}
