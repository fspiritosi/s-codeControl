'use client';

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
} from '@tanstack/react-table';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useEffect, useState } from 'react';

interface DataEquipmentProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[] | any;
  data: TData[];
  // allCompany: any[];
  // showInactive: boolean;
  // setShowInactive?: (showInactive: boolean) => void;
  role?: string | null;
}

export function EquipmentTable<TData, TValue>({
  columns,
  data,
  role
  // showInactive,
  // setShowInactive,
  // allCompany,
}: DataEquipmentProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [defaultColumns, setDefaultColumns] = useState<any[]>([]);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    // Filtrar las columnas basado en el rol
    const filteredColumns = role === 'Invitado' 
      ? columns.filter((col: any) => col.accessorKey !== 'status' && col.accessorKey !== 'allocated_to')
      : columns;
    
    setDefaultColumns(filteredColumns);
  }, [columns, role]);

  useEffect(() => {
    const valorGuardado = JSON.parse(localStorage.getItem('equipmentColumns') || '[]');
    // Si el rol es invitado, remover allocated_to del localStorage
    if (role === 'Invitado') {
      const newColumns = valorGuardado.filter((col: string) => col !== 'allocated_to');
      localStorage.setItem('equipmentColumns', JSON.stringify(newColumns));
    }
    if (valorGuardado.length) {
      setColumnVisibility(
        defaultColumns.reduce((acc: any, column: any) => {
          acc[column.accessorKey] = role === 'Invitado' 
            ? valorGuardado.includes(column.accessorKey) && column.accessorKey !== 'allocated_to'
            : valorGuardado.includes(column.accessorKey);
          return acc;
        }, {})
      );
    }
  }, [defaultColumns, role]);

  const defaultVisibleColumns = [
    'domain',
    'year',
    'type_of_vehicle',
    'brand',
    'model',
    'picture',
    'status',
    'intern_number',
    'condition',
    ...(role !== 'Invitado' ? ['allocated_to'] : [])
  ];

  const [defaultVisibleColumns1, setDefaultVisibleColumns1] = useState(() => {
    if (typeof window !== 'undefined') {
      let valorGuardado = JSON.parse(localStorage.getItem('savedColumns') || '[]');
      if (role === 'Invitado') {
        valorGuardado = valorGuardado.filter((col: string) => col !== 'allocated_to');
        localStorage.setItem('savedColumns', JSON.stringify(valorGuardado));
      }
      return valorGuardado.length ? valorGuardado : defaultVisibleColumns;
    }
    return defaultVisibleColumns;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('savedColumns', JSON.stringify(defaultVisibleColumns1));
    }
  }, [defaultVisibleColumns1]);

  useEffect(() => {
    const valorGuardado = JSON.parse(localStorage.getItem('savedColumns') || '[]');
    if (valorGuardado.length) {
      setColumnVisibility(
        defaultColumns.reduce((acc: any, column: any) => {
          acc[column.accessorKey] = valorGuardado.includes(column.accessorKey);
          return acc;
        }, {})
      );
    }
  }, [defaultColumns]);

  useEffect(() => {
    // Set initial column visibility based on role
    if (role === 'Invitado') {
      setColumnVisibility(prev => ({
        ...prev,
        status: false,
        allocated_to: false
      }));
    }
  }, [role]);

  const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: isVisible,
    }));
    setDefaultVisibleColumns1((prev: any) => {
      const newVisibleColumns = isVisible ? [...prev, columnId] : prev.filter((id: string) => id !== columnId);
      localStorage.setItem('savedColumns', JSON.stringify(newVisibleColumns));
      return newVisibleColumns;
    });
  };

  const loader = useLoggedUserStore((state) => state.isLoading);
  //const filteredData = showInactive ? data?.filter((item: any) => item.is_active === false) : data;
  const allOptions = {
    type_of_vehicle: createOptions('type_of_vehicle'),
    types_of_vehicles: createOptions('types_of_vehicles'),
    year: createOptions('year'),
    brand: createOptions('brand_vehicles'),
    model: createOptions('model_vehicles'),
    status: createOptions('status'),
    allocated_to: createOptions('allocated_to'),
    condition: createOptions('condition'),
    type: createOptions('type'),
  };

  function createOptions(key: string) {
    const values = data?.map((item: any) => (item?.[key]?.name ? item?.[key]?.name : item?.[key]));

    return ['Todos', ...Array.from(new Set(values))];
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
    allocated_to: {
      name: 'allocated_to',
      option: allOptions.allocated_to,
      label: 'Afectado a',
    },
    condition: {
      name: 'condition',
      option: allOptions.condition,
      label: 'Condición',
    },
    type: {
      name: 'type',
      option: allOptions.type,
      label: 'Tipo',
    }
  };

  const table = useReactTable({
    data,
    columns: defaultColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });
  const setActivesVehicles = useLoggedUserStore((state) => state.setActivesVehicles);
  //const router = useRouter()

  useEffect(() => {
    const valorGuardado = JSON.parse(localStorage.getItem('savedColumns') || '');
    if (!valorGuardado.length) {
      localStorage.setItem('savedColumns', JSON.stringify(defaultVisibleColumns1));
    } else {
      localStorage.setItem(
        'savedColumns',
        JSON.stringify(
          table
            .getAllColumns()
            ?.filter((column) => column.getIsVisible())
            .map((column) => column.id)
        )
      );
    }
  }, [columnVisibility]);

  const handleClearFilters = () => {
    table.getAllColumns().forEach((column) => {
      column.setFilterValue('');
    });

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
      condition: 'Todos',
      type: 'Todos',
    });
    setActivesVehicles();
  };
  const maxRows = ['20', '40', '60', '80', '100'];
  const [selectValues, setSelectValues] = useState<{ [key: string]: string }>({});

  return (
    <div className="w-full grid grid-cols-1">
      <div className="flex items-center py-4 flex-wrap gap-y-2 overflow-auto">
        <Input
          placeholder="Buscar por Dominio o Número de interno"
          value={(table.getColumn('domain')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('domain')?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" size="default" className="ml-2" onClick={handleClearFilters}>
          Limpiar filtros
        </Button>

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
                ?.filter((column) => column.getCanHide() && column.id !== 'intern_number' && column.id !== 'domain')
                ?.map((column: any) => {
                  if (column.id === 'actions') {
                    return null;
                  }
                  // if (typeof column.columnDef.header !== 'string') {
                  //   const name = `${column.columnDef.accessorKey}`;
                  if (column.id === 'showUnavaliableEquipment') {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-red-400"
                        checked={showInactive}
                        onClick={() => setShowInactive(!showInactive)}
                      >
                        {column.columnDef.header}
                      </DropdownMenuCheckboxItem>
                    );
                  }
                  if (column.id === 'is_active') {
                    return (
                      <>
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize  text-red-400"
                          checked={showInactive}
                          onClick={() => setShowInactive(!showInactive)}
                          // onCheckedChange={(value) => handleColumnVisibilityChange(column.id, true)}
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
                      onCheckedChange={(value) => handleColumnVisibilityChange(column.id, !!value)}
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
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.id in selectHeader ? (
                              header.id === 'allocated_to' ? (
                                <div className="flex justify-center">
                                  <Input
                                    placeholder="Buscar por afectación"
                                    value={table.getColumn('allocated_to')?.getFilterValue() as string}
                                    onChange={(event) => {
                                      table.getColumn('allocated_to')?.setFilterValue(event.target.value);
                                    }}
                                    className="max-w-sm"
                                  />
                                </div>
                              ) : header.id === 'intern_number' ? (
                                <div className="flex justify-center">
                                  <Input
                                    placeholder="Número de interno"
                                    value={table.getColumn('intern_number')?.getFilterValue() as string}
                                    onChange={(event) =>
                                      table.getColumn('intern_number')?.setFilterValue(event.target.value)
                                    }
                                    className="max-w-sm"
                                  />
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <Select
                                    value={selectValues[header.id]}
                                    onValueChange={(event) => {
                                      if (event === 'Todos') {
                                        table.getColumn(header.id)?.setFilterValue('');
                                        setSelectValues({
                                          ...selectValues,
                                          [header.id]: event,
                                        });
                                        return;
                                      }
                                      table.getColumn(header.id)?.setFilterValue(event);
                                      setSelectValues({
                                        ...selectValues,
                                        [header.id]: event,
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue placeholder={header.column.columnDef.header as string} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        {selectHeader[header.id as keyof typeof selectHeader]?.option?.map(
                                          (option: string) => (
                                            <SelectItem key={option} value={option}>
                                              {option}
                                            </SelectItem>
                                          )
                                        )}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )
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
                              <Avatar className="size-14 border border-black">
                                <AvatarImage
                                  src={cell.getValue() as any}
                                  alt="imagen del vehiculo"
                                  className="object-cover"
                                />
                                <AvatarFallback>foto</AvatarFallback>
                              </Avatar>
                            </Link>
                          ) : (
                            'No disponible'
                          )
                        ) : cell.column.id === 'status' ? (
                          <Badge
                            variant={
                              cell.getValue() === 'Completo'
                                ? 'success'
                                : cell.getValue() === 'Completo con doc vencida'
                                  ? 'yellow'
                                  : 'destructive'
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
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </TableCell>
                    ) : null;
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={defaultColumns.length} className="h-24 text-center">
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
