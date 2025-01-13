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
import { DataTableToolbarDetailReport } from './data-table-toolbar-detail-report';
import { Customers, Services, Items, Employee, Equipment } from '@/components/DailyReport/DailyReport';
import { getCustomerName, getServiceName, getItemName, getEmployeeNames, getEquipmentNames, formatTime } from '@/components/DailyReport/utils/utils';
import { Badge } from '@/components/ui/badge';
import { se } from 'date-fns/locale';
import { serialize } from 'v8';
import moment from 'moment';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  // customers: Customers[]
  // services: Services[]
  // items: Items[]
  // employees: Employee[]
  // equipment: Equipment[]
  // companyName: string;
//   handleViewDocument: (documentPath: string, row_id?: string) => Promise<void>;
}

export function DetailTable<TData, TValue>({ 
    columns, 
    data, 
    // customers, 
    // services, 
    // items, 
    // employees, 
    // equipment 
}: DataTableProps<TData, TValue>) {
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
      <DataTableToolbarDetailReport 
      // equipment={equipment} 
      // employees={employees} 
      // items={items} 
      // services={services} 
      // customers={customers} 
      table={table} 
      />
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
                    {cell.column.id === 'Hora inicio' || cell.column.id === 'Hora fin' ? (
                      formatTime(cell.getValue() as string)
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
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
