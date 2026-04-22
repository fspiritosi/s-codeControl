'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { exportToExcel, tanstackColumnsToExcelColumns } from '@/shared/lib/excel-export';
import { getCompanyBrandingForExport } from '@/shared/actions/export';
import type { DataTableExportConfig } from './types';

interface DataTableExportButtonProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  exportConfig: DataTableExportConfig<TData>;
}

/**
 * Boton de export a Excel con branding de empresa.
 * Solo se renderiza cuando se pasa exportConfig al DataTable.
 */
export function DataTableExportButton<TData extends Record<string, unknown>>({
  columns,
  exportConfig,
}: DataTableExportButtonProps<TData>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Obtener datos
      const data = await exportConfig.fetchAllData();
      if (data.length === 0) {
        toast.warning('No hay datos para exportar');
        return;
      }

      // Obtener branding de la empresa
      const brandingResult = await getCompanyBrandingForExport();
      const companyBranding = brandingResult
        ? {
            name: brandingResult.name,
            logo: brandingResult.logo,
          }
        : undefined;

      // Convertir columnas TanStack a ExcelColumns
      const excelColumns = tanstackColumnsToExcelColumns<TData>(columns, {
        exclude: ['select', 'actions', ...(exportConfig.excludeColumns || [])],
        formatters: exportConfig.formatters,
      });

      // Exportar
      await exportToExcel(data, excelColumns, {
        ...exportConfig.options,
        companyBranding,
      });

      toast.success(`Exportado: ${data.length} registros`);
    } catch {
      toast.error('Error al exportar');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="h-8"
            data-testid="export-excel-button"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Excel
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exportar a Excel</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
