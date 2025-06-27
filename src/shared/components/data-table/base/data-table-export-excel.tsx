'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Table } from '@tanstack/react-table';
import { FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import * as XLSX from 'xlsx';

interface DataTableExportExcelProps<TData> {
  table: Table<TData>;
  fileName?: string;
}

export function DataTableExportExcel<TData>({ table, fileName = 'tabla_exportada' }: DataTableExportExcelProps<TData>) {
  const [open, setOpen] = useState(false);
  const [fileNameInput, setFileNameInput] = useState(fileName);

  // Obtiene las filas filtradas, sin paginación
  const rows = table.getFilteredRowModel().rows;
  // Obtiene solo las columnas visibles
  const columns = table.getVisibleLeafColumns();

  // Construye los datos para exportar
  // Extraer headers como texto plano (sin iconos)
  const headers: string[] = columns.map((col) => {
    let label: string = col.id;
    const header = col.columnDef.header;
    if (typeof header === 'string') {
      label = header;
    } else if (typeof header === 'function') {
      try {
        const rendered = header({ column: col, header: undefined, table } as any);
        // Si es un ReactNode, intenta extraer solo el texto
        if (typeof rendered === 'string') {
          label = rendered;
        } else if (rendered && typeof rendered.props?.children === 'string') {
          label = rendered.props.children;
        } else if (rendered && Array.isArray(rendered.props?.children)) {
          // Si hay varios children (por ejemplo, [icono, texto])
          // Busca el primer string
          const textChild = rendered.props.children.find((child: any) => typeof child === 'string');
          if (textChild) label = textChild;
        }
      } catch {
        // fallback al id
      }
    }
    return label;
  });

  const exportData = rows.map((row) => {
    const rowObj: Record<string, any> = {};
    columns.forEach((col, idx) => {
      let value = row.getValue(col.id);
      // Procesar columna 'Afectaciones' de forma especial
      if (headers[idx].toLowerCase().includes('afectac')) {
        let parsed: any[] = [];
        try {
          parsed = typeof value === 'string' ? JSON.parse(value) : Array.isArray(value) ? value : [];
        } catch {
          parsed = [];
        }
        if (parsed.length === 0) {
          value = '-';
        } else {
          // Si hay objetos, extraer el nombre del contratista (contractor_id.name)
          const nombres = parsed.map((af: any) => af.contractor_id?.name).filter(Boolean);
          value = nombres.length > 0 ? nombres.join(', ') : '-';
        }
      } else if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      rowObj[headers[idx]] = value;
    });
    return rowObj;
  });

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();

    // 1. Estilos para los headers (negrita y fondo gris claro)
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || '');
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'F2F2F2' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'CCCCCC' } },
          bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
          left: { style: 'thin', color: { rgb: 'CCCCCC' } },
          right: { style: 'thin', color: { rgb: 'CCCCCC' } },
        },
      };
    }

    // 2. Ajuste automático del ancho de las columnas
    const allRows = [headers, ...exportData.map((row) => headers.map((h) => row[h]))];
    ws['!cols'] = headers.map((header, colIdx) => {
      // Calcula el ancho máximo entre el header y todas las celdas
      const maxLen = allRows.reduce((max, row) => {
        const val = row[colIdx] != null ? String(row[colIdx]) : '';
        return Math.max(max, val.length);
      }, header.length);
      return { wch: maxLen + 2 }; // +2 para algo de padding
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    XLSX.writeFile(wb, `${fileNameInput || 'tabla_exportada'}.xlsx`, { compression: true });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title="Exportar a Excel"
          className="flex items-center gap-2"
          disabled={rows.length === 0}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar a Excel</DialogTitle>
          <DialogDescription>
            ¿Deseas exportar la tabla actual a Excel? Se exportarán solo las columnas visibles y todas las filas
            filtradas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fileName" className="text-right">
              Nombre del archivo
            </Label>
            <Input
              id="fileName"
              value={fileNameInput}
              onChange={(e) => setFileNameInput(e.target.value)}
              className="col-span-3"
              placeholder="tabla_exportada"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} className="ml-2">
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
