'use client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { saveAs } from 'file-saver';

import { Button } from '@/components/ui/button';
import { Card, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import JSZip from 'jszip';
import { ArrowUpDown, DownloadIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import moment from 'moment';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  setShowLastMonthDocuments?: () => void;
  pending?: boolean;
  vehicles?: boolean;
  defaultVisibleColumnsCustom?: string[];
  localStorageName: string;
  monthly?: boolean;
  permanent?: boolean;
}

export function ExpiredDataTable<TData, TValue>({
  columns,
  data,
  setShowLastMonthDocuments,
  pending,
  vehicles,
  defaultVisibleColumnsCustom,
  localStorageName,
  monthly,
  permanent,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const loader = useLoggedUserStore((state) => state.isLoading);
  const defaultVisibleColumns = defaultVisibleColumnsCustom || ['date', 'resource', 'documentName', 'validity', 'id'];

  const [defaultVisibleColumns1, setDefaultVisibleColumns1] = useState(() => {
    if (typeof window !== 'undefined') {
      const valorGuardado = JSON.parse(localStorage.getItem(localStorageName) || '[]');
      return valorGuardado.length ? valorGuardado : defaultVisibleColumns;
    }
    return defaultVisibleColumns;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(localStorageName, JSON.stringify(defaultVisibleColumns1));
    }
  }, [defaultVisibleColumns1]);

  useEffect(() => {
    const valorGuardado = JSON.parse(localStorage.getItem(localStorageName) || '[]');
    if (valorGuardado.length) {
      setColumnVisibility(
        columns.reduce((acc: any, column: any) => {
          acc[column.accessorKey] = valorGuardado.includes(column.accessorKey);
          return acc;
        }, {})
      );
    }
  }, [columns]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    columns.reduce((acc: any, column: any) => {
      acc[column.accessorKey] = defaultVisibleColumns.includes(column.accessorKey);
      return acc;
    }, {})
  );
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
    sortingFns: {
      myCustomSortingFn: (rowA, rowB, columnId) => {
        return rowA.original[columnId] > rowB.original[columnId]
          ? 1
          : rowA.original[columnId] < rowB.original[columnId]
            ? -1
            : 0;
      },
    },
  });

  const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: isVisible,
    }));
    setDefaultVisibleColumns1((prev: any) => {
      const newVisibleColumns = isVisible ? [...prev, columnId] : prev.filter((id: string) => id !== columnId);
      localStorage.setItem(localStorageName, JSON.stringify(newVisibleColumns));
      return newVisibleColumns;
    });
  };

  function createOptions(key: string) {
    const values = data?.flatMap((item: any) => item?.[key]);
    return ['Todos', ...Array.from(new Set(values))];
  }

  const allOptions = {
    documentName: createOptions('documentName'),
    resource: createOptions('resource'),
    state: createOptions('state'),
    multiresource: createOptions('multiresource'),
    allocated_to: createOptions('allocated_to'),
    mandatory: createOptions('mandatory'),
  };

  const selectHeader = {
    resource: {
      name: 'resource',
      option: allOptions.resource,
      label: 'Recurso',
    },
    documentName: {
      name: 'documentName',
      option: allOptions.documentName,
      label: 'Documento',
    },
    state: {
      name: 'state',
      option: allOptions.state,
      label: 'Estado',
    },
    multiresource: {
      name: 'multiresource',
      option: allOptions.multiresource,
      label: 'Multirecurso',
    },
    allocated_to: {
      name: 'allocated_to',
      option: allOptions.allocated_to,
      label: 'Afectado a',
    },
    mandatory: {
      name: 'mandatory',
      option: allOptions.mandatory,
      label: 'Mandatorio',
    },
  };

  const [selectValues, setSelectValues] = useState<{ [key: string]: string }>({});

  if (selectValues.companyName && selectValues.companyName !== 'Todos') {
    const resourceOptions = data
      ?.filter((item: any) => item.companyName === selectValues.companyName)
      ?.flatMap((item: any) => item?.resource);
    allOptions.resource = ['Todos', ...Array.from(new Set(resourceOptions))];
  } else {
    allOptions.resource = createOptions('resource');
  }
  const maxRows = ['20', '40', '60', '80', '100'];
  const handleClearFilters = () => {
    table.getAllColumns().forEach((column) => {
      column.setFilterValue('');
    });

    setSelectValues({
      companyName: 'Todos',
      resource: 'Todos',
      documentName: 'Todos',
      state: 'Todos',
      multiresource: 'Todos',
      mandatory: 'Todos',
    });
  };

  const showLastMonth = () => {
    if (setShowLastMonthDocuments) {
      setShowLastMonthDocuments();
    }
  };
  const getColorForRow = (row: any) => {
    const isNoPresented = row.getValue('state') === 'pendiente';
    if (isNoPresented) {
      return; // Clase por defecto si no está vencido
    } else {
      if (!row.original.validity) return;
  
      const validityDateStr = row.original.validity; // Obtener la fecha en formato "dd/mm/yyyy"

      const validityDate = moment(validityDateStr);
      const currentDate = moment();
      const differenceInDays = validityDate.diff(currentDate, 'days');
  
      if (differenceInDays < 0) {
        return 'bg-red-100 dark:bg-red-100/30 hover:bg-red-100/30'; // Vencido
      } else if (differenceInDays <= 7) {
        return 'bg-yellow-100 dark:bg-yellow-100/30 hover:bg-yellow-100/30'; // Próximo a vencer en los próximos 7 días
      } else {
        return;
      }
    }
  };

  const supabase = supabaseBrowser();
  const handleDownloadAll = async () => {
    toast.promise(
      async () => {
        const zip = new JSZip();
        const documentToDownload = table
          .getFilteredRowModel()
          .rows.map((row) => row.original)
          .filter((row: any) => row.state !== 'pendiente') as any;

        const files = await Promise.all(
          documentToDownload?.map(async (doc: any) => {
            const { data, error } = await supabase.storage.from('document_files').download(doc.document_url);

            if (error) {
              // console.log('Salio este error', error);
              throw new Error(handleSupabaseError(error.message));
            }

            // Extrae la extensión del archivo del document_path
            const extension = doc.document_url.split('.').pop();

            return {
              data,
              name: `${doc.resource}-(${doc?.documentName}).${extension}`,
            };
          }) || []
        );

        files.forEach((file) => {
          zip.file(file.name, file.data);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'documents.zip');
      },
      {
        loading: 'Descargando documentos...',
        success: 'Documentos descargados',
        error: (error) => {
          return error;
        },
      }
    );
  };

  return (
    <div className="mb-10 grid px-4 rounded-lg max-w-[100vw] overflow-x-auto">
      <div className="flex justify-between items-end">
        <div className="flex flex-wrap items-end pb-4 gap-y-4 overflow-x-auto w-full">
          <Input
            placeholder={vehicles ? 'Buscar por dominio o numero interno' : 'Buscar por nombre de empleado'}
            value={(table.getColumn('resource')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('resource')?.setFilterValue(event.target.value)}
            className="max-w-sm ml-2"
          />
          <div className="flex items-start gap-2 flex-wrap gap-y-2 justify-start">
            <Button variant="outline" size="default" className="ml-2 self-end" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>

            <div className=" flex gap-2 flex-wrap">
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
                  <Button variant="outline">Columnas</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[50dvh] overflow-y-auto">
                  {table
                    .getAllColumns()
                    ?.filter((column) => column.getCanHide())
                    ?.map((column) => {
                      if (column.id === 'intern_number') {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => handleColumnVisibilityChange(column.id, !!value)}
                          >
                            Numero interno
                          </DropdownMenuCheckboxItem>
                        );
                      }
                      if (column.id === 'actions' || typeof column.columnDef.header !== 'string') {
                        return null;
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

          {monthly && (
            <div className="flex gap-4 flex-wrap">
              <div className="flex flex-col">
                <Label className="ml-4 mb-2">Desde</Label>
                <Input
                  placeholder={vehicles ? 'Buscar por dominio' : 'Buscar por nombre de empleado'}
                  onChange={(event) => table.getColumn('validity')?.setFilterValue(event.target.value)}
                  className="max-w-sm ml-2"
                  type="month"
                  id="date-from"
                />
              </div>
              <div className="flex flex-col self-start">
                <Label className="ml-4 mb-2">Hasta</Label>

                <Input
                  placeholder={vehicles ? 'Buscar por dominio' : 'Buscar por nombre de empleado'}
                  onChange={(event) => table.getColumn('validity')?.setFilterValue(event.target.value)}
                  className="max-w-sm ml-2"
                  type="month"
                  id="date-limit"
                />
              </div>
            </div>
          )}
          {permanent && (
            <div className="flex gap-4 flex-wrap">
              <div className="flex flex-col">
                <Label className="ml-4 mb-2">Desde (vencimiento)</Label>
                <Input
                  placeholder={vehicles ? 'Buscar por dominio' : 'Buscar por nombre de empleado'}
                  onChange={(event) => table.getColumn('validity')?.setFilterValue(event.target.value)}
                  className="max-w-sm ml-2"
                  type="date"
                  id="date-from-full"
                />
              </div>
              <div className="flex flex-col self-start">
                <Label className="ml-4 mb-2">Hasta (vencimiento)</Label>
                <Input
                  placeholder={vehicles ? 'Buscar por dominio' : 'Buscar por nombre de empleado'}
                  onChange={(event) => table.getColumn('validity')?.setFilterValue(event.target.value)}
                  className="max-w-sm ml-2"
                  type="date"
                  id="date-limit-full"
                />
              </div>
            </div>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={
                table.getFilteredRowModel().rows.filter((row: any) => row.original.state !== 'pendiente').length === 0
              }
              className="ml-6 mb-4"
              variant={'outline'}
            >
              <DownloadIcon className="size-5 mr-2" />
              Descargar Documentos
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Estas a punto de descargar{' '}
                {table.getFilteredRowModel().rows.filter((row: any) => row.original.state !== 'pendiente').length}{' '}
                documentos
              </AlertDialogTitle>
              <AlertDialogDescription className="max-h-[65vh] overflow-y-auto">
                {table.getFilteredRowModel().rows.filter((row: any) => row.original.state === 'pendiente').length >
                  0 && (
                  <div>
                    <CardDescription className="underline">
                      Alerta: Hay documentos que estan pendientes y no se descargarán
                    </CardDescription>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-red-600">
                          {
                            table.getFilteredRowModel().rows.filter((row: any) => row.original.state === 'pendiente')
                              .length
                          }{' '}
                          Documentos pendientes
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col gap-2">
                            {table
                              .getFilteredRowModel()
                              .rows.filter((row: any) => row.original.state === 'pendiente')
                              .map((row) => (
                                <Card className="p-2 border-red-300" key={row.id}>
                                  <CardDescription>
                                    {(row.original as any).resource} ({(row.original as any).documentName})
                                  </CardDescription>
                                </Card>
                              ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-green-600">
                      {' '}
                      {
                        table.getFilteredRowModel().rows.filter((row: any) => row.original.state !== 'pendiente').length
                      }{' '}
                      Documentos presentados
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className=" flex flex-col gap-2 mt-2">
                        {table
                          .getFilteredRowModel()
                          .rows.filter((row: any) => row.original.state !== 'pendiente')
                          .map((row) => {
                            return (
                              <Card className="p-2 border-green-600" key={row.id}>
                                <CardDescription>
                                  {(row.original as any).resource} ({(row.original as any).documentName})
                                </CardDescription>
                              </Card>
                            );
                          })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  handleDownloadAll();
                }}
              >
                Descargar documentos
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="rounded-md border mb-6 overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups()?.map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers?.map((header) => {
                  const column = table.getColumn(header.id);

                  return (
                    <TableHead key={header.id} className="text-center">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.id in selectHeader ? (
                              header.id === 'allocated_to' ? (
                                <div className="flex justify-center">
                                  <Input
                                    placeholder="Buscar por afectación"
                                    value={table.getColumn('allocated_to')?.getFilterValue() as string}
                                    onChange={(event) =>
                                      table.getColumn('allocated_to')?.setFilterValue(event.target.value)
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
                                    <SelectTrigger className="">
                                      <SelectValue
                                        placeholder={
                                          header.column.columnDef.header === 'Empleado' && vehicles
                                            ? 'Vehículo'
                                            : (header.column.columnDef.header as string)
                                        }
                                      />
                                    </SelectTrigger>
                                    {header.id === 'resource' && (
                                      <div className=" grid place-content-center ml-0 pl-0">
                                        <ArrowUpDown
                                          onClick={() => column?.toggleSorting(column?.getIsSorted() === 'asc')}
                                          className="ml-1 h-4 w-4 cursor-pointer"
                                        />
                                      </div>
                                    )}
                                    {header.id === 'Vencimiento' && (
                                      <div className=" grid place-content-center ml-0 pl-0">
                                        <ArrowUpDown
                                          onClick={() => column?.toggleSorting(column?.getIsSorted() === 'asc')}
                                          className="ml-1 h-4 w-4 cursor-pointer"
                                        />
                                      </div>
                                    )}
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
          <TableBody>
            {table.getRowModel()?.rows?.length ? (
              table.getRowModel().rows?.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn('text-center', getColorForRow(row))}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells()?.map((cell) => {
                    return (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    );
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
                  ) : pending ? (
                    'No hay documentos pendientes'
                  ) : (
                    'No hay documentos a vencer'
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

// {pending
//   ? 'No hay documentos pendientes'
//   : 'No hay documentos a vencer'}
