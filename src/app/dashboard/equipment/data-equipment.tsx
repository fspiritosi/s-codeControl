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

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLoggedUserStore } from '@/store/loggedUser'
import { useSidebarOpen } from '@/store/sidebar'
import { VehiclesActualCompany } from '@/store/vehicles'
import Link from 'next/link'
import { useState } from 'react'
import { id } from 'date-fns/locale'
import Equipment from './page'

interface DataEquipmentProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[] | any
  data: TData[]
  allCompany: any[]
  showInactive: boolean
  setShowInactive: (showInactive: boolean) => void
}

export function DataEquipment<TData, TValue>({
  columns,
  data,
  showInactive,
  setShowInactive,
  allCompany,
}: DataEquipmentProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const defaultVisibleColumns = [
    'domain',
    'year',
    'type_of_vehicle',
    'brand',
    'model',
    'picture',
    'status',
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
  const filteredData = showInactive
    ? data.filter((item: any) => item.is_active === false)
    : data
  const allOptions = {
    type_of_vehicle: createOptions('type_of_vehicle'),
    types_of_vehicles: createOptions('types_of_vehicles'),
    year: createOptions('year'),
    brand: createOptions('brand_vehicles'),
    model: createOptions('model_vehicles'),
    status: createOptions('status'),
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
      label: 'Tipo de equipo',
    },
    types_of_vehicles: {
      name: 'types_of_vehicles.name',
      option: allOptions.types_of_vehicles,
      label: 'Tipos de vehículos',
    },
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
    status: {
      name: 'status',
      option: allOptions.status,
      label: 'Estado',
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
  const { expanded } = useSidebarOpen()
  const totalWidth = `calc(100vw - ${expanded ? '296px' : '167px'})`
  const setActivesVehicles = VehiclesActualCompany(
    state => state.setActivesVehicles,
  )
  //const router = useRouter()

  const handleClearFilters = () => {
    table.getAllColumns().forEach(column => {
      column.setFilterValue('')
    })

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
      status: 'Todos',
    })
    setActivesVehicles()
  }
  const maxRows = ['20', '40', '60', '80', '100']
  const [selectValues, setSelectValues] = useState<{ [key: string]: string }>(
    {},
  )
  // const handleToggleInactive = () => {
  //   setShowInactive(!showInactive)
  // }

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

        <div className="w-full flex justify-end gap-2">
          <Select onValueChange={e => table.setPageSize(Number(e))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Cantidad de filas" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Filas por página</SelectLabel>
                {maxRows.map((option: string) => (
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
                  if (column.id === 'is_active') {
                    return (
                      <>
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize  text-red-400"
                          checked={showInactive}
                          //onChange={() => setShowInactive(!showInactive)}
                          onClick={() => setShowInactive(!showInactive)}
                          onCheckedChange={value =>
                            column.toggleVisibility(true)
                          }
                        >
                          {column.columnDef.header}
                        </DropdownMenuCheckboxItem>
                        {/* <button onClick={() => setShowInactive(!showInactive)}>
                          Ver equipos dados de baja
                        </button> */}
                      </>
                    )
                  }
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={value =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.columnDef.header}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
                    let is_active = (cell.row.original as any).is_active
                    return (showInactive && !is_active) ||
                      (!showInactive && is_active) ? (
                      <TableCell
                        key={cell.id}
                        className={`text-center whitespace-nowrap ${
                          is_active ? '' : 'text-red-500'
                        }`}
                      >
                        {cell.column.id === 'picture' ? (
                          cell.getValue() !== '' ? (
                            <Link href={cell.getValue() as any} target="_blank">
                              <img
                                src={cell.getValue() as any}
                                alt="Foto"
                                style={{ width: '50px' }}
                              />
                            </Link>
                          ) : (
                            'No disponible'
                          )
                        ) : cell.column.id === 'status' ? (
                          <Badge
                            variant={
                              cell.getValue() === 'No avalado'
                                ? 'destructive'
                                : 'success'
                            }
                          >
                            {cell.getValue() as React.ReactNode}
                          </Badge>
                        ) : cell.column.id === 'domain' ? (
                          (cell.getValue() as React.ReactNode) === '' ? (
                            'No disponible'
                          ) : (
                            (cell.getValue() as React.ReactNode)
                          )
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )
                        )}
                      </TableCell>
                    ) : null
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
