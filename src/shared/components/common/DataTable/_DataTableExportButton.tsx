'use client';

import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { getCompanyBrandingForExport } from '@/shared/actions/export';
import { Button } from '@/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import {
  exportToExcel,
  tanstackColumnsToExcelColumns,
  type ExcelExportOptions,
} from '@/shared/lib/excel-export';

export interface DataTableExportConfig<TData> {
  /**
   * Función que obtiene TODOS los datos con los filtros actuales (sin paginación)
   * Debe retornar los datos a exportar
   */
  fetchAllData: () => Promise<TData[]>;
  /**
   * Opciones de exportación
   */
  options: ExcelExportOptions;
  /**
   * Formatters personalizados por key de columna
   * Ejemplo: { status: (val) => statusLabels[val] }
   */
  formatters?: Record<string, (value: unknown, row: TData) => string | number | null>;
  /**
   * Columnas a excluir (además de 'select' y 'actions' que se excluyen por defecto)
   */
  excludeColumns?: string[];
}

interface Props<TData> {
  /**
   * Columnas de TanStack Table (para extraer meta.title)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: any[];
  /**
   * Configuración de exportación
   */
  exportConfig: DataTableExportConfig<TData>;
}

export function _DataTableExportButton<TData extends Record<string, unknown>>({
  columns,
  exportConfig,
}: Props<TData>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Obtener todos los datos filtrados y branding de la empresa en paralelo
      const [data, branding] = await Promise.all([
        exportConfig.fetchAllData(),
        getCompanyBrandingForExport(),
      ]);

      if (data.length === 0) {
        toast.warning('No hay datos para exportar');
        return;
      }

      // Convertir columnas de TanStack a formato Excel
      const excelColumns = tanstackColumnsToExcelColumns<TData>(columns, {
        exclude: ['select', 'actions', ...(exportConfig.excludeColumns || [])],
        formatters: exportConfig.formatters,
      });

      // Exportar con branding de la empresa
      await exportToExcel(data, excelColumns, {
        ...exportConfig.options,
        companyBranding: branding || undefined,
      });

      toast.success(`Exportado: ${data.length} registros`);
    } catch (error) {
      toast.error('Error al exportar');
      throw error;
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
            className="h-8 gap-1.5"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Excel</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exportar todos los datos filtrados a Excel</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
