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
import Link from 'next/link'
import { useState } from 'react'

interface DataCustomersProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[] | any
    data: TData[]
    allCompany: any[]
    showInactive: boolean
    setShowInactive: (showInactive: boolean) => void
}


export function DataCustomers<TData, TValue>({
    columns,
    data,
    showInactive,
    setShowInactive,
    allCompany,
}: DataCustomersProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const defaultVisibleColumns = [
        'cuit',
        'name',
        'client_email',
        'client_phone',
        'address',
        

    ]
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        columns.reduce((acc: any, column: any) => {
            acc[column.accessorKey] = defaultVisibleColumns.includes(
                column.accessorKey,
            )
            return acc
        }, {}),
    )

    // const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const loader = useLoggedUserStore(state => state.isLoading)
    const filteredData = showInactive
        ? data?.filter((item: any) => item.is_active === false)
        : data
    //   const allOptions = {
    //     name: createOptions('name'),
    //     client_email: createOptions('client_email'),
    //     client_phone: createOptions('client_phone'),
    //     address: createOptions('address'),
    //     // status: createOptions('status'),
    //   }

    //   function createOptions(key: string) {
    //     const values = data?.map((item: any) =>
    //       item?.[key]?.name ? item?.[key]?.name : item?.[key],
    //     )

    //     return ['Todos', ...Array.from(new Set(values))]
    //   }

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
        
    }

    let table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        //onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnVisibility,
            //columnFilters,
        },
    })
    //   const setActivesVehicles = useLoggedUserStore(
    //     state => state.setActivesVehicles,
    //   )
    //const router = useRouter()

    //   const handleClearFilters = () => {
    //     table.getAllColumns().forEach(column => {
    //       column.setFilterValue('')
    //     })

    // setSelectValues({
    //   name: 'Todos',
    //   cuit: 'todos',
    //   client_email: 'Todos',
    //   client_phone: 'Todos',
    //   address: 'Todos',
    //   status: 'Todos',
    // })
    //setActivesVehicles()
    //}
    const maxRows = ['20', '40', '60', '80', '100']
    const [selectValues, setSelectValues] = useState<{ [key: string]: string }>(
        {},
    )
    // const handleToggleInactive = () => {
    //   setShowInactive(!showInactive)
    

    return (
        <div>
            <div className="flex items-center py-4 flex-wrap gap-y-2 overflow-auto">
                <Input
                    placeholder="Buscar por Cuit"
                    value={(table.getColumn('cuit')?.getFilterValue() as string) ?? ''}
                    onChange={event =>
                        table.getColumn('cuit')?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                {/* <Button
          variant="outline"
          size="default"
          className="ml-2"
          onClick={handleClearFilters}
        >
          Limpiar filtros
        </Button> */}

                <div className=" flex gap-2 ml-2 flex-wrap">
                    <Select onValueChange={e => table.setPageSize(Number(e))}>
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
                        <DropdownMenuContent
                            align="end"
                            className="max-h-[50dvh] overflow-y-auto"
                        >
                            {table
                                .getAllColumns()
                                ?.filter(column => column.getCanHide())
                                ?.map(column => {
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
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups()?.map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers?.map(header => {
                                    console.log("header id: ",header.id)
                                    return (
                                        <TableHead
                                            className="text-center text-balance"
                                            key={header.id}
                                        >
                                            {flexRender(
                                                header.id in selectHeader 
                                                ? (
                                                    <div className="flex justify-center item-center">
                                                        {/* Contenido específico para el header 'name' */}
                                                        
                                                    </div>
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
                            table.getRowModel().rows?.map(row => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells()?.map(cell => {
                                        let is_active = (cell.row.original as any).is_active
                                        return (showInactive && !is_active) ||
                                            (!showInactive && is_active) ? (
                                            <TableCell
                                                key={cell.id}
                                                className={`text-center whitespace-nowrap ${is_active ? '' : 'text-red-500'
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
                                                    !cell.getValue() ? (
                                                        'No posee'
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