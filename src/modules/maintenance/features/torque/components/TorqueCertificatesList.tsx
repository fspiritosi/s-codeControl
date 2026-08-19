'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/shared/components/ui/button';
import { DataTable, type DataTableFacetedFilterConfig } from '@/shared/components/data-table';
import type { TorqueCertificateRow } from '../actions.server';
import { torqueCertificateColumns } from './columns';
import { SHEET_FORMATS } from '../shared/torque-spec';

/**
 * Listado de certificados de torqueo emitidos (tsk-575 task 6). Client-side:
 * `getTorqueCertificates` ya trae todas las filas de la empresa, así que la
 * paginación/orden/filtrado se resuelven en el cliente (se omite `totalRows`).
 */

const FACETED_FILTERS: DataTableFacetedFilterConfig[] = [
  { columnId: 'full_number', title: 'Número', type: 'text' },
  { columnId: 'date', title: 'Fecha', type: 'text', placeholder: 'dd/mm/aaaa' },
  { columnId: 'vehicle_domain', title: 'Vehículo', type: 'text' },
  { columnId: 'vehicle_intern_number', title: 'Interno', type: 'text' },
  { columnId: 'mechanic_name', title: 'Mecánico', type: 'text' },
  {
    columnId: 'sheet_format',
    title: 'Formato',
    type: 'faceted',
    options: SHEET_FORMATS.map((f) => ({ value: f.value, label: f.label })),
  },
];

export function TorqueCertificatesList({ certificates }: { certificates: TorqueCertificateRow[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Certificados de torqueo</h1>
        <Button asChild>
          <Link href="/dashboard/maintenance/torque/new">Nuevo certificado</Link>
        </Button>
      </div>

      <DataTable
        columns={torqueCertificateColumns as ColumnDef<Record<string, unknown>>[]}
        data={certificates as unknown as Record<string, unknown>[]}
        tableId="torqueCertificates"
        showFilterToggle
        facetedFilters={FACETED_FILTERS}
        emptyMessage="Todavía no hay certificados de torqueo emitidos."
      />
    </div>
  );
}
