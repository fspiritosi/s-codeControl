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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { Url } from 'next/dist/shared/lib/router/router'
import { useLoggedUserStore } from '@/store/loggedUser'
import { DataTable } from '../employee/data-table'
import { useSidebarOpen } from '@/store/sidebar'

interface DataDocumentsEquipmentProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[] | any
  data: TData[]
  //allCompany: any[]
  showInactive: boolean
  setShowInactive: (showInactive: boolean) => void
}

export function DataDocumentsEquipment<TData, TValue>({
  columns,
  data,
  showInactive,
  setShowInactive,
  //allCompany,
}: DataDocumentsEquipmentProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const defaultVisibleColumns = [
    'id_document_types',
    'validity',
    'state',
    'applies',
    'document_url',
    'is_active',
  ]
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    columns.reduce((acc: any, column: any) => {
      acc[column.accessorKey] = defaultVisibleColumns.includes(
        column.accessorKey,
      )
      return acc
    }, {}),
  )
  //const [showInactive, setShowInactive] = useState<boolean>(false)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const loader = useLoggedUserStore(state => state.isLoading)
  const filteredData = showInactive
    ? data.filter((item: any) => item.is_active === false)
    : data
  const allOptions = {
    id_document_types: createOptions('id_document_types'),
    validity: createOptions('validity'),
    state: createOptions('state'),
    applies: createOptions('applies'),
    is_active: createOptions('is_active'),
  }

  function createOptions(key: string) {
    const values = data?.map((item: any) =>
      item?.[key]?.name ? item?.[key]?.name : item?.[key],
    )

    return ['Todos', ...Array.from(new Set(values))]
  }

  const selectHeader = {
    id_document_types: {
      name: 'id_document_types',
      option: allOptions.id_document_types,
      label: 'Tipo de documento',
    },
    validity: {
      name: 'validity',
      option: allOptions.validity,
      label: 'Validez',
    },

    state: {
      name: 'state',
      option: allOptions.state,
      label: 'Estado',
    },
    applies: {
      name: 'applies',
      option: allOptions.applies,
      label: 'Aplica a',
    },
    is_active: {
      name: 'is_active',
      option: allOptions.is_active,
      label: 'Activo',
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

  //const router = useRouter()

  const handleClearFilters = () => {
    table.getAllColumns().forEach(column => {
      column.setFilterValue('')
    })
    //router.push('/dashboard/equipment')

    setSelectValues({
      id_document_types: 'Todos',
      validity: 'todos',
      state: 'Todos',
      applies: 'Todos',
      is_active: 'Todos',
    })
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
          placeholder="Buscar por tipo de documento"
          value={
            (table
              .getColumn('id_document_types')
              ?.getFilterValue() as string) ?? ''
          }
          onChange={event =>
            table
              .getColumn('id_document_types')
              ?.setFilterValue(event.target.value)
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
                {maxRows.map((option: string,index:number) => (
                  <SelectItem key={index} value={option}>
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
                        {cell.column.id === 'document_url' ? (
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
