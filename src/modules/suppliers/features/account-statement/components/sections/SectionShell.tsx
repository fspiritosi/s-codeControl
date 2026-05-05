'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';

export function StatBlock({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold mt-1">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

export function SummaryGrid({ children }: { children: ReactNode }) {
  return (
    <Card className="bg-muted/20">
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4">
        {children}
      </CardContent>
    </Card>
  );
}

interface ToolbarProps {
  status: string;
  onStatusChange: (v: string) => void;
  options: { value: string; label: string; count?: number }[];
}

export function StatusFilterToolbar({ status, onStatusChange, options }: ToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los estados</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
              {opt.count != null ? ` (${opt.count})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {status !== 'ALL' && (
        <Button variant="ghost" size="sm" onClick={() => onStatusChange('ALL')}>
          Limpiar
        </Button>
      )}
    </div>
  );
}

interface PaginatedTableProps<T> {
  rows: T[];
  columns: { header: string; cell: (row: T) => ReactNode; className?: string }[];
  emptyMessage: string;
  pageSize?: number;
  page: number;
  onPageChange: (p: number) => void;
  onRowClick?: (row: T) => void;
}

export function PaginatedTable<T extends { id: string }>({
  rows,
  columns,
  emptyMessage,
  pageSize = 10,
  page,
  onPageChange,
  onRowClick,
}: PaginatedTableProps<T>) {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * pageSize;
  const visible = rows.slice(start, start + pageSize);

  return (
    <div className="space-y-2">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c, i) => (
                <TableHead key={i} className={c.className}>{c.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((c, i) => (
                    <TableCell key={i} className={c.className}>{c.cell(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {total > pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {start + 1}-{Math.min(start + pageSize, total)} de {total}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 0}
              onClick={() => onPageChange(safePage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= pageCount - 1}
              onClick={() => onPageChange(safePage + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
