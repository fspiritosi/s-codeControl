'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { DataTablePagination } from '@/components/CheckList/tables/data-table-pagination';
import { useRouter } from 'next/navigation';
import { DataTableToolbarDailyReport } from './data-table-toolbar-daily-report';
import { Customers, Services, Items, Employee, Equipment } from '@/components/DailyReport/DailyReport';
import { getCustomerName, getServiceName, getItemName, getEmployeeNames, getEquipmentNames, formatTime } from '@/components/DailyReport/utils/utils';
import { Badge } from '@/components/ui/badge';
import { se } from 'date-fns/locale';
import { serialize } from 'v8';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  customers: Customers[]
  services: Services[]
  items: Items[]
  employees: Employee[]
  equipment: Equipment[]
  companyName: string;
  handleViewDocument: (documentPath: string, row_id?: string) => Promise<void>;
}

export function TypesOfCheckListTable<TData, TValue>({ columns, data, customers, services, items, employees, equipment }: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });
  
  const router = useRouter();
  
  
  return (
    <div className="space-y-4 mt-4">
      <DataTableToolbarDailyReport equipment={equipment} employees={employees} items={items} services={services} customers={customers} table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="hover:cursor-pointer"
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  // onClick={() => {
                  // router.push(`/dashboard/forms/${(row.original as any).id}`);
                  // }}
                >
                  {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                  {cell.column.id === 'Cliente' 
                    ? getCustomerName(cell.getValue() as string, customers as any) 
                    : cell.column.id === 'Servicios' 
                    ? getServiceName(cell.getValue() as string, services as any)
                    : cell.column.id === 'Item'
                    ? getItemName(cell.getValue() as string, items as any) 
                    : cell.column.id === 'Empleados'
                    ? getEmployeeNames(cell.getValue() as string[], employees as any)
                    : cell.column.id === 'Equipos'
                    ? getEquipmentNames(cell.getValue() as string[], equipment as any)
                    : cell.column.id === 'Hora inicio'
                    ? formatTime(cell.getValue() as string)
                    : cell.column.id === 'Hora fin'
                    ? formatTime(cell.getValue() as string)
                    : cell.column.id === 'Estado'
                    ? <Badge
                    variant={
                      cell.getValue() === 'ejecutado'
                        ? 'success'
                        : cell.getValue() === 'cancelado'
                          ? 'destructive'
                          : cell.getValue() === 'reprogramado'
                            ? 'yellow'
                            : 'default'
                    }
                  >
                    {String(cell.getValue()) || ''}
                  </Badge>
                    : flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Sin resultados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
