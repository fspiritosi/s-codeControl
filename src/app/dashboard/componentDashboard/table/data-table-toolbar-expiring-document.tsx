'use client';
'use client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { DataTableViewOptions } from '@/components/CheckList/tables/data-table-view-options';
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
import { Button } from '@/components/ui/button';
import { Card, CardDescription } from '@/components/ui/card';
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Cross2Icon, PersonIcon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { DownloadIcon, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { DataTableFacetedFilterExpirinDocuments } from './data-table-faceted-expiring-document-filter';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbarExpiringDocument<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
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

  const getUniqueValues = (columnId: string) => {
    return table.getColumn(columnId)?.getFacetedUniqueValues()
      ? Array.from(
          new Set(
            Array.from((table.getColumn(columnId)?.getFacetedUniqueValues() as any)?.keys()).map((item: any) => item)
          )
        )
      : [];
  };

  const uniqueEmpleados = getUniqueValues('Empleados');
  const uniqueDocumentos = getUniqueValues('Documentos');
  const uniqueEquipment = getUniqueValues('Equipment');

  const createOptions = (uniqueValues: string[], icon: any) => {
    return uniqueValues.map((value) => ({
      label: value,
      value: value,
      icon: icon,
    }));
  };

  const EmpleadosOptions = createOptions(uniqueEmpleados, PersonIcon);
  const EquipmentOptions = createOptions(uniqueEquipment, Truck);
  const DocumentosOptions = createOptions(uniqueDocumentos, PersonIcon);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {table.getColumn('Empleados') && (
          <DataTableFacetedFilterExpirinDocuments
            column={table.getColumn('Empleados')}
            title="Empleados"
            options={EmpleadosOptions}
          />
        )}
        {table.getColumn('Equipment') && (
          <DataTableFacetedFilterExpirinDocuments
            column={table.getColumn('Equipment')}
            title="Equipos"
            options={EquipmentOptions}
          />
        )}
        {table.getColumn('Documentos') && (
          <DataTableFacetedFilterExpirinDocuments
            column={table.getColumn('Documentos')}
            title="Documentos"
            options={DocumentosOptions}
          />
        )}
        {isFiltered && (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
            Limpiar filtros
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            disabled={
              table.getFilteredRowModel().rows.filter((row: any) => row.original.state !== 'pendiente').length === 0
            }
            className="mr-3"
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
              {table.getFilteredRowModel().rows.filter((row: any) => row.original.state === 'pendiente').length > 0 && (
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
      <DataTableViewOptions table={table} />
    </div>
  );
}
