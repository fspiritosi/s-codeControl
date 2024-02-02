'use client'

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useState } from 'react'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[] | any
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const defaultVisibleColumns = [
    'full_name',
    'email',
    'cuil',
    'document_number',
    'document_type',
    'hierarchical_position',
    'company_position',
    'normal_hours',
    'type_of_contract',
    'allocated_to',
  ]
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    columns.reduce((acc: any, column: any) => {
      acc[column.accessorKey] = defaultVisibleColumns.includes(
        column.accessorKey,
      )
      return acc
    }, {}),
  )
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const allOptions = {
    document_type: createOptions('document_type'),
    hierarchical_position: createOptions('hierarchical_position'),
    type_of_contract: createOptions('type_of_contract'),
    allocated_to: createOptions('allocated_to'),
    nationality: createOptions('nationality'),
    birthplace: createOptions('birthplace'),
    gender: createOptions('gender'),
    marital_status: createOptions('marital_status'),
    level_of_education: createOptions('level_of_education'),
    province: createOptions('province'),
    affiliate_status: createOptions('affiliate_status'),
    city: createOptions('city'),
    hierrical_position: createOptions('hierrical_position'),
  };

  function createOptions(key: string) {
    return ['Todos', ...Array.from(new Set(data.map((item: any) => item[key])))];
  }

  const selectHeader = {
    document_type: {
      name: 'document_type',
      option: allOptions.document_type,
      label: 'Tipo de documento',
    },
    hierarchical_position: {
      name: 'hierarchical_position',
      option: allOptions.hierarchical_position,
      label: 'Posicion jerarquica',
    },
    type_of_contract: {
      name: 'type_of_contract',
      option: allOptions.type_of_contract,
      label: 'Tipo de contrato',
    },
    allocated_to: {
      name: 'allocated_to',
      option: allOptions.allocated_to,
      label: 'Asignado a',
    },
    nationality: {
      name: 'nationality',
      option: allOptions.nationality,
      label: 'Nacionalidad',
    },
    birthplace: {
      name: 'birthplace',
      option: allOptions.birthplace,
      label: 'Lugar de nacimiento',
    },
    gender: {
      name: 'gender',
      option: allOptions.gender,
      label: 'Genero',
    },
    marital_status: {
      name: 'marital_status',
      option: allOptions.marital_status,
      label: 'Estado civil',
    },
    level_of_education: {
      name: 'level_of_education',
      option: allOptions.level_of_education,
      label: 'Nivel de educacion',
    },
    province: {
      name: 'province',
      option: allOptions.province,
      label: 'Provincia',
    },
    affiliate_status: {
      name: 'affiliate_status',
      option: allOptions.affiliate_status,
      label: 'Estado de afiliado',
    },
    city: {
      name: 'city',
      option: allOptions.city,
      label: 'Ciudad',
    },
    hierrical_position: {
      name: 'hierrical_position',
      option: allOptions.hierrical_position,
      label: 'Posicion jerarquica',
    },
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
  })
  const totalWidth = 'calc(100vw - 320px)'
  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Buscar por nombre"
          value={
            (table.getColumn('full_name')?.getFilterValue() as string) ?? ''
          }
          onChange={event =>
            table.getColumn('full_name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columnas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-[50dvh] overflow-y-auto"
          >
            {table
              .getAllColumns()
              .filter(column => column.getCanHide())
              .map(column => {
                if (
                  column.id === 'actions' ||
                  typeof column.columnDef.header !== 'string'
                ) {
                  return null
                }

                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {column.columnDef.header}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        className="rounded-md border"
        style={{
          overflow: 'auto',
          width: '100%',
          maxWidth: totalWidth,
        }}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead
                      className="text-center text-balance"
                      key={header.id}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.id in selectHeader ? (
                              <Select
                                value={
                                  table
                                    .getColumn(header.id)
                                    ?.getFilterValue() as string
                                }
                                onValueChange={event => {
                                  if (event === 'Todos') {
                                    table
                                      .getColumn(header.id)
                                      ?.setFilterValue('')
                                  } else {
                                    table
                                      .getColumn(header.id)
                                      ?.setFilterValue(event)
                                  }
                                }}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue
                                    placeholder={
                                      header.column.columnDef.header as string
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    {selectHeader[
                                      header.id as keyof typeof selectHeader
                                    ]?.option?.map((option: string) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            ) : (
                              header.column.columnDef.header
                            ),
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="max-w-[50vw] overflow-x-auto">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className="text-center whitespace-nowrap"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
