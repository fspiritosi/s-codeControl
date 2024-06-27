'use client';

import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLoggedUserStore } from '@/store/loggedUser';
import Link from 'next/link';
import { useState } from 'react';

interface DataCustomersProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[] | any;
  data: TData[];
  allCompany: any[];
  showInactive: boolean;
  setShowInactive: (showInactive: boolean) => void;
}

export function DataCustomers<TData, TValue>({
  columns,
  data,
  showInactive,
  setShowInactive,
  allCompany,
}: DataCustomersProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const defaultVisibleColumns = ['cuit', 'name', 'client_email', 'client_phone', 'address'];
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    columns.reduce((acc: any, column: any) => {
      acc[column.accessorKey] = defaultVisibleColumns.includes(column.accessorKey);
      return acc;
    }, {})
  );

  const loader = useLoggedUserStore((state) => state.isLoading);
  // const filteredData = showInactive
  //     ? data?.filter((item: any) => item.is_active === false)
  //     : data

  const selectHeader = {
    // name: {
    //     name: 'name',
    //     //option: allOptions.name,
    //     label: 'Nombre',
    // },
    // client_email: {
    //     name: 'client_email',
    //     //option: allOptions.client_email,
    //     label: 'Email',
    // },
    // client_phone: {
    //     name: 'client_phone',
    //     //option: allOptions.client_phone,
    //     label: 'Teléfono',
    // },
    // address: {
    //     name: 'address',
    //     //option: allOptions.address,
    //     label: 'Dirección',
    // }
  };

  let table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnVisibility,
    },
  });

  const maxRows = ['20', '40', '60', '80', '100'];
  const [selectValues, setSelectValues] = useState<{ [key: string]: string }>({});

  return (
    <div>
      <div>
        <div className="flex items-center py-4 flex-wrap gap-y-2 overflow-auto">
          <Input
            placeholder="Buscar por nombre"
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />

          <div className=" flex gap-2 ml-2 flex-wrap">
            <Select onValueChange={(e) => table.setPageSize(Number(e))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cantidad de filas" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Filas por página</SelectLabel>
                  {maxRows?.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columnas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-[50dvh] overflow-y-auto">
                {table
                  .getAllColumns()
                  ?.filter((column) => column.getCanHide())
                  ?.map((column) => {
                    if (column.id === 'actions' || typeof column.columnDef.header !== 'string') {
                      return null;
                    }
                    if (column.id === 'showUnavaliableContacts') {
                      return (
                        <>
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize  text-red-400"
                            checked={showInactive}
                            onClick={() => setShowInactive(!showInactive)}
                            // onCheckedChange={value =>
                            //     column.toggleVisibility(true)
                            // }
                          >
                            {column.columnDef.header}
                          </DropdownMenuCheckboxItem>
                        </>
                      );
                    }

                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.columnDef.header}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups()?.map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers?.map((header) => {
                    return (
                      <TableHead className="text-center text-balance" key={header.id}>
                        {flexRender(
                          header.id in selectHeader ? (
                            <div className="flex justify-center item-center">
                              {/* Contenido específico para el header 'name' */}
                            </div>
                          ) : (
                            header.column.columnDef.header
                          ),
                          header.getContext()
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="max-w-[50vw] overflow-x-auto">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows?.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells()?.map((cell) => {
                      let is_active = (cell.row.original as any).is_active;
                      return (showInactive && !is_active) || (!showInactive && is_active) ? (
                        <TableCell
                          key={cell.id}
                          className={`text-center whitespace-nowrap ${is_active ? '' : 'text-red-500'}`}
                        >
                          {cell.column.id === 'picture' ? (
                            cell.getValue() !== '' ? (
                              <Link href={cell.getValue() as any} target="_blank">
                                <img src={cell.getValue() as any} alt="Foto" style={{ width: '50px' }} />
                              </Link>
                            ) : (
                              'No disponible'
                            )
                          ) : cell.column.id === 'status' ? (
                            <Badge variant={cell.getValue() === 'No avalado' ? 'destructive' : 'success'}>
                              {cell.getValue() as React.ReactNode}
                            </Badge>
                          ) : cell.column.id === 'domain' ? (
                            !cell.getValue() ? (
                              'No posee'
                            ) : (
                              (cell.getValue() as React.ReactNode)
                            )
                          ) : (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          )}
                        </TableCell>
                      ) : null;
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {loader ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between">
                          <Skeleton className="h-7 w-[13%]" />
                          <Skeleton className="h-7 w-[13%]" />
                          <Skeleton className="h-7 w-[13%]" />
                          <Skeleton className="h-7 w-[13%]" />
                          <Skeleton className="h-7 w-[13%]" />
                          <Skeleton className="h-7 w-[13%]" />
                          <Skeleton className="h-7 w-[13%]" />
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-7 w-[13%]" />
                          <Skeleton className="h-7 w-[13%]" />
                          <Skeleton className="h-7 w-[13%]" />
                          <Skeleton className="h-7 w-[13%]" />
                          <Skeleton className="h-7 w-[13%]" />
                          <Skeleton className="h-7 w-[13%]" />
                          <Skeleton className="h-7 w-[13%]" />
                        </div>
                      </div>
                    ) : (
                      'No hay Clientes registrados'
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Siguiente
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups()?.map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers?.map((header) => {
                  return (
                    <TableHead className="text-center text-balance" key={header.id}>
                      {flexRender(
                        header.id in selectHeader ? (
                          <div className="flex justify-center item-center">
                            {/* Contenido específico para el header 'name' */}
                          </div>
                        ) : (
                          header.column.columnDef.header
                        ),
                        header.getContext()
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="max-w-[50vw] overflow-x-auto">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows?.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells()?.map((cell) => {
                    let is_active = (cell.row.original as any).is_active;
                    return (showInactive && !is_active) || (!showInactive && is_active) ? (
                      <TableCell
                        key={cell.id}
                        className={`text-center whitespace-nowrap ${is_active ? '' : 'text-red-500'}`}
                      >
                        {cell.column.id === 'picture' ? (
                          cell.getValue() !== '' ? (
                            <Link href={cell.getValue() as any} target="_blank">
                              <img src={cell.getValue() as any} alt="Foto" style={{ width: '50px' }} />
                            </Link>
                          ) : (
                            'No disponible'
                          )
                        ) : cell.column.id === 'status' ? (
                          <Badge variant={cell.getValue() === 'No avalado' ? 'destructive' : 'success'}>
                            {cell.getValue() as React.ReactNode}
                          </Badge>
                        ) : cell.column.id === 'domain' ? (
                          !cell.getValue() ? (
                            'No posee'
                          ) : (
                            (cell.getValue() as React.ReactNode)
                          )
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </TableCell>
                    ) : null;
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {loader ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between">
                        <Skeleton className="h-7 w-[13%]" />
                        <Skeleton className="h-7 w-[13%]" />
                        <Skeleton className="h-7 w-[13%]" />
                        <Skeleton className="h-7 w-[13%]" />
                        <Skeleton className="h-7 w-[13%]" />
                        <Skeleton className="h-7 w-[13%]" />
                        <Skeleton className="h-7 w-[13%]" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-7 w-[13%]" />
                        <Skeleton className="h-7 w-[13%]" />
                        <Skeleton className="h-7 w-[13%]" />
                        <Skeleton className="h-7 w-[13%]" />
                        <Skeleton className="h-7 w-[13%]" />
                        <Skeleton className="h-7 w-[13%]" />
                        <Skeleton className="h-7 w-[13%]" />
                      </div>
                    </div>
                  ) : (
                    'No hay Equipos registrados'
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
