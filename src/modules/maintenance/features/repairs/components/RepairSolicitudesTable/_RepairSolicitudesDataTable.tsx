'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DataTable,
  type DataTableFacetedFilterConfig,
  type DataTableSearchParams,
} from '@/shared/components/common/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import {
  getRepairSolicitudFacets,
  getAllRepairSolicitudesForExport,
} from '@/modules/maintenance/features/repairs/actions.server';
import { statuses, criticidad } from './data';

interface FacetEntry {
  value: string;
  count: number;
}

const STATE_LABEL = new Map(statuses.map((s) => [s.value, s.label]));
const CRITICITY_LABEL = new Map(criticidad.map((c) => [c.value, c.label]));

interface Props<TData extends Record<string, unknown>> {
  data: TData[];
  totalRows: number;
  searchParams: DataTableSearchParams;
  columns: ColumnDef<TData, any>[];
  mechanic?: boolean;
  defaultEquipmentId?: string;
  tableId: string;
}

export function RepairSolicitudesDataTable<TData extends Record<string, unknown>>({
  data,
  totalRows,
  searchParams,
  columns,
  mechanic,
  defaultEquipmentId,
  tableId,
}: Props<TData>) {
  const [facets, setFacets] = useState<Record<string, FacetEntry[]> | null>(null);

  useEffect(() => {
    getRepairSolicitudFacets({ mechanic, defaultEquipmentId })
      .then((f) => setFacets(f as Record<string, FacetEntry[]>))
      .catch(console.error);
  }, [mechanic, defaultEquipmentId]);

  const facetedFilters: DataTableFacetedFilterConfig[] = useMemo(() => {
    const buildOptions = (
      entries: FacetEntry[] | undefined,
      labelMap?: Map<string, string>
    ) => {
      if (!entries?.length) return { options: [], externalCounts: new Map<string, number>() };
      return {
        options: entries.map((e) => ({ value: e.value, label: labelMap?.get(e.value) ?? e.value })),
        externalCounts: new Map(entries.map((e) => [e.value, e.count])),
      };
    };

    const state = buildOptions(facets?.state, STATE_LABEL);
    const title = buildOptions(facets?.title);
    const priority = buildOptions(facets?.priority, CRITICITY_LABEL);
    const domain = buildOptions(facets?.domain);
    const intern = buildOptions(facets?.intern_number);

    return [
      {
        columnId: 'state',
        title: 'Estado',
        type: 'faceted',
        options: state.options,
        externalCounts: state.externalCounts,
      },
      {
        columnId: 'title',
        title: 'Titulo',
        type: 'faceted',
        options: title.options,
        externalCounts: title.externalCounts,
      },
      {
        columnId: 'priority',
        title: 'Criticidad',
        type: 'faceted',
        options: priority.options,
        externalCounts: priority.externalCounts,
      },
      {
        columnId: 'domain',
        title: 'Equipo',
        type: 'faceted',
        options: domain.options,
        externalCounts: domain.externalCounts,
      },
      {
        columnId: 'intern_number',
        title: 'Numero interno',
        type: 'faceted',
        options: intern.options,
        externalCounts: intern.externalCounts,
      },
      {
        columnId: 'user_description',
        title: 'Descripción',
        type: 'text',
      },
    ];
  }, [facets]);

  return (
    <div className="mt-8">
      <DataTable
        columns={columns}
        data={data}
        totalRows={totalRows}
        searchParams={searchParams}
        facetedFilters={facetedFilters}
        tableId={tableId}
        showFilterToggle
        emptyMessage="Sin resultados."
        exportConfig={{
          fetchAllData: async () =>
            (await getAllRepairSolicitudesForExport(searchParams, {
              mechanic,
              defaultEquipmentId,
            })) as unknown as TData[],
          options: {
            filename: 'solicitudes-mantenimiento',
            sheetName: 'Solicitudes',
            title: 'Solicitudes de mantenimiento',
            includeDate: true,
          },
        }}
      />
    </div>
  );
}
