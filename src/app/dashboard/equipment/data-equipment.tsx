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
import { useContext, useEffect, useReducer, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { Url } from 'next/dist/shared/lib/router/router'
import { useLoggedUserStore } from '@/store/loggedUser'
import { DataTable } from '../employee/data-table'

interface DataEquipmentProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[] | any
  data: TData[]
  allCompany: any[]
}

export function DataEquipment<TData, TValue>({
  columns,
  data,
  allCompany,
}: DataEquipmentProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const defaultVisibleColumns = [
    'domain',
    'year',
    'types_of_vehicles',
    'type_of_vehicle',
    'brand_vehicles',
    'model_vehicles',
    'picture',
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
  const loader = useLoggedUserStore(state => state.isLoading)

  const allOptions = {
    type_of_vehicle: createOptions('type_of_vehicle'),
    types_of_vehicles: createOptions('types_of_vehicles'),
    // domain: createOptions('domain'),
    // chassis: createOptions('chassis'),
    //engine: createOptions('engine'),
    //serie: createOptions('serie'),
    //intern_number: createOptions('intern_number'),
    year: createOptions('year'),
    brand: createOptions('brand_vehicles'),
    model: createOptions('model_vehicles'),
  }

  function createOptions(key: string) {
    const values = data?.map((item: any) =>
      item?.[key]?.name ? item?.[key]?.name : item?.[key],
    )

    return ['Todos', ...Array.from(new Set(values))]
  }

  const selectHeader = {
    type_of_vehicle: {
      name: 'types_of_vehicles',
      option: allOptions.type_of_vehicle,
      label: 'Tipo de vehículo',
    },
    types_of_vehicles: {
      name: 'types_of_vehicles.name',
      option: allOptions.types_of_vehicles,
      label: 'Tipos de vehículos',
    },
    // domain: {
    //   name: 'domain',
    //   option: allOptions.domain,
    //   label: 'Dominio',
    // },
    // chassis: {
    //   name: 'chassis',
    //   option: allOptions.chassis,
    //   label: 'Chassis',
    // },
    // engine: {
    //   name: 'engine',
    //   option: allOptions.engine,
    //   label: 'Motor',
    // },
    // serie: {
    //   name: 'serie',
    //   option: allOptions.serie,
    //   label: 'Serie',
    // },
    // intern_number: {
    //   name: 'intern_number',
    //   option: allOptions.intern_number,
    //   label: 'Número de Interno',
    // },
    year: {
      name: 'year',
      option: allOptions.year,
      label: 'Año',
    },
    brand: {
      name: 'brand',
      option: allOptions.brand,
      label: 'Marca',
    },
    model: {
      name: 'model',
      option: allOptions.model,
      label: 'Modelo',
    },
  }

  let table = useReactTable({
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

  const totalWidth = 'calc(100vw - 297px)'

  const router = useRouter()

  const handleClearFilters = () => {
    table.getAllColumns().forEach(column => {
      column.setFilterValue('')
    })
    router.push('/dashboard/equipment')

    setSelectValues({
      types_of_vehicles: 'Todos',
      type_of_vehicle: 'todos',
      domain: 'Todos',
      chassis: 'Todos',
      engine: 'Todos',
      serie: 'Todos',
      intern_number: 'Todos',
      year: 'Todos',
      brand: 'Todos',
      model: 'Todos',
    })
  }

  const [selectValues, setSelectValues] = useState<{ [key: string]: string }>(
    {},
  )

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Buscar por Dominio"
          value={(table.getColumn('domain')?.getFilterValue() as string) ?? ''}
          onChange={event =>
            table.getColumn('domain')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button
          variant="outline"
          size="default"
          className="ml-2"
          onClick={handleClearFilters}
        >
          Limpiar filtros
        </Button>

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
                              header.id === 'intern_number' ? (
                                <div className="flex justify-center">
                                  <Input
                                    placeholder="Número de interno"
                                    value={
                                      table
                                        .getColumn('intern_number')
                                        ?.getFilterValue() as string
                                    }
                                    onChange={event =>
                                      table
                                        .getColumn('intern_number')
                                        ?.setFilterValue(event.target.value)
                                    }
                                    className="max-w-sm"
                                  />
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <Select
                                    value={selectValues[header.id]}
                                    onValueChange={event => {
                                      if (event === 'Todos') {
                                        table
                                          .getColumn(header.id)
                                          ?.setFilterValue('')
                                        setSelectValues({
                                          ...selectValues,
                                          [header.id]: event,
                                        })
                                        return
                                      }
                                      table
                                        .getColumn(header.id)
                                        ?.setFilterValue(event)
                                      setSelectValues({
                                        ...selectValues,
                                        [header.id]: event,
                                      })
                                    }}
                                  >
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue
                                        placeholder={
                                          header.column.columnDef
                                            .header as string
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        {selectHeader[
                                          header.id as keyof typeof selectHeader
                                        ]?.option?.map((option: string) => (
                                          <SelectItem
                                            key={option}
                                            value={option}
                                          >
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )
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
                  {row.getVisibleCells().map(cell => {
                    return (
                      <TableCell
                        key={cell.id}
                        className="text-center whitespace-nowrap"
                      >
                        {cell.column.id === 'picture' ? (
                          <Link href={cell.getValue() as any} target="_blank">
                            <img
                              src={cell.getValue() as any}
                              alt="Foto"
                              style={{ width: '68px', height: '68px' }}
                            />
                          </Link>
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )
                        )}
                        {/* {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )} */}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
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
