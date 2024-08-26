/**
 * This file contains the definition of the columns used in the dashboard.
 */

'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { useEdgeFunctions } from '@/hooks/useEdgeFunctions';
import { cn } from '@/lib/utils';
import { saveAs } from 'file-saver';

import { zodResolver } from '@hookform/resolvers/zod';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpDown, CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '../../../../supabase/supabase';
import { handleSupabaseError } from '@/lib/errorHandler';

const formSchema = z.object({
  reason_for_termination: z.string({
    required_error: 'La razón de la baja es requerida.',
  }),
  termination_date: z.date({
    required_error: 'La fecha de baja es requerida.',
  }),
});

type DocumentHistory = {
  documents_employees_id: string;
  modified_by: string;
  updated_at: string;
};

type Colum = {
  id?: string;
  id_storage: string | null;
  id_document_types: string | null;
  applies: string | null;
  validity: Date | null;
  state: string;
  is_active: boolean;
  user_id: string | undefined;
  document_url: string | null;
};

export const columEmp: ColumnDef<Colum>[] = [
  {
    id: 'actions',
    cell: ({ row }: { row: any }) => {
      const [showModal, setShowModal] = useState(false);
      const [integerModal, setIntegerModal] = useState(false);
      const [viewModal, setViewModal] = useState(false);
      const [domain, setDomain] = useState('');
      const [documentHistory, setDocumentHistory] = useState<DocumentHistory[]>([]);
      //const user = row.original
      const [showInactive, setShowInactive] = useState<boolean>(false);
      const [showDeletedEquipment, setShowDeletedEquipment] = useState(false);
      const equipment = row.original;
      const document = row.original;
      const handleDownload = async (path: string, fileName: string, resourceName: string) => {

        toast.promise(
          async () => {
            const { data, error } = await supabase.storage.from('document_files').download(path);

            if (error) {
              throw new Error(handleSupabaseError(error.message));
            }

            // Extrae la extensión del archivo del path
            const extension = path.split('.').pop();

            const blob = new Blob([data], { type: 'application/octet-stream' });
            // Usa la extensión del archivo al guardar el archivo
            saveAs(blob, `${resourceName} ${fileName}.${extension}`);
          },
          {
            loading: 'Descargando documento...',
            success: 'Documento descargado',
            error: (error) => {
              return error;
            },
          }
        );
      };

      const handleOpenModal = (id: string) => {
        setDomain(id);
        setShowModal(!showModal);
      };
      // const { fetchDocumentEquipmentByCompany } = useDocument()

      // useEffect(() => {
      //   fetchDocumentEquipmentByCompany
      // }, [])
      const handleOpenIntegerModal = (id: string) => {
        setDomain(id);
        setIntegerModal(!integerModal);
      };

      const handleOpenViewModal = (id: string) => {
        setDomain(id);

        setViewModal(!viewModal);
      };

      const { errorTranslate } = useEdgeFunctions();

      const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          reason_for_termination: undefined,
        },
      });

      async function reintegerDocumentEmployees() {
        try {
          const { data, error } = await supabase
            .from('documents_employees')
            .update({
              is_active: true,
              // termination_date: null,
              // reason_for_termination: null,
            })
            .eq('id', document.id)
            .select();

          setIntegerModal(!integerModal);
          //setInactive(data as any)
          setShowDeletedEquipment(false);
          toast('Equipo reintegrado', { description: `El equipo ${equipment?.engine} ha sido reintegrado` });
        } catch (error: any) {
          const message = await errorTranslate(error?.message);
          toast('Error al reintegrar el equipo', { description: message });
        }
      }

      async function onSubmit(values: z.infer<typeof formSchema>) {
        const data = {
          ...values,
          termination_date: format(values.termination_date, 'yyyy-MM-dd'),
        };

        try {
          await supabase
            .from('documents_employees')
            .update({
              is_active: false,
              //termination_date: data.termination_date,
              //reason_for_termination: data.reason_for_termination,
            })
            .eq('id', document.id)
            .select();

          setShowModal(!showModal);

          toast('Documento eliminado', { description: `El documento ${document.name} ha sido dado de baja` });
        } catch (error: any) {
          const message = await errorTranslate(error?.message);
          toast('Error al dar de baja el documento', { description: message });
        }
      }
      const handleToggleInactive = () => {
        setShowInactive(!showInactive);
      };

      async function viewDocumentEmployees() {
        try {
          const { data, error } = await supabase
            .from('documents_employees_logs')
            .select('*, documents_employees(user_id(email))')
            .eq('documents_employees_id', document.id);

          if (data) {
            setDocumentHistory(data);
          }
        } catch (error: any) {
          const message = await errorTranslate(error?.message);
          toast(
           'Error al reintegrar el equipo',
           { description: message,}
          );
        }
      }
      useEffect(() => {
        viewDocumentEmployees();
      }, []);

      return (
        <DropdownMenu>
          {integerModal && (
            <AlertDialog defaultOpen onOpenChange={() => setIntegerModal(!integerModal)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {`Estás a punto de reintegrar el documento ${document.id_document_types}, que fue dado de baja por ${equipment.reason_for_termination} el día ${equipment.termination_date}. Al reintegrar el documento, se borrarán estas razones. Si estás seguro de que deseas reintegrarlo, haz clic en 'Continuar'. De lo contrario, haz clic en 'Cancelar'.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => reintegerDocumentEmployees()}>Continuar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {showModal && (
            <Dialog defaultOpen onOpenChange={() => setShowModal(!showModal)}>
              <DialogContent className="dark:bg-slate-950">
                <DialogTitle>Dar de baja Documento</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas dar de baja este documento?, completa los campos para continuar.
                </DialogDescription>
                <DialogFooter>
                  <div className="w-full">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                          control={form.control}
                          name="reason_for_termination"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Motivo de Baja</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona la razón" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Despido de empleado">Despido de empleado</SelectItem>
                                  <SelectItem value="Renuncia de empleado">Renuncia de empleado</SelectItem>
                                  <SelectItem value="Cambio de Funciones de empleado">
                                    Cambio de Funciones de empleado
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Elige la razón por la que deseas dar de baja el documento
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="termination_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fecha de Baja</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={'outline'}
                                      className={cn(
                                        ' pl-3 text-left font-normal',
                                        !field.value && 'text-muted-foreground'
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, 'P', {
                                          locale: es,
                                        })
                                      ) : (
                                        <span>Elegir fecha</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                    initialFocus
                                    locale={es}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription>Fecha en la que se dio de baja</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-4 justify-end">
                          <Button variant="destructive" type="submit">
                            Dar de Baja
                          </Button>
                          <DialogClose>Cancelar</DialogClose>
                        </div>
                      </form>
                    </Form>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {viewModal && (
            <Dialog defaultOpen onOpenChange={() => setViewModal(!viewModal)}>
              <DialogContent>
                <DialogTitle>Historial de Modificaciones</DialogTitle>
                <DialogDescription>Aquí se muestra quién modificó el documento y cuándo</DialogDescription>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Fecha de modificación</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentHistory?.map((entry: any) => (
                      <TableRow key={entry.documents_employees_id}>
                        <TableCell>{entry.documents_employees.user_id.email}</TableCell>
                        <TableCell>{entry.updated_at}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <DialogFooter>
                  <Button onClick={() => setViewModal(false)}>Cerrar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <DotsVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(document.applies)}>
              Copiar DNI
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenViewModal(domain)}>Historial de modificaciones</DropdownMenuItem>
            <DropdownMenuItem
             disabled={row.original.state === 'pendiente'}
              onClick={() =>
                handleDownload(row.original.document_url, row.original.documentName, row.original.resource)
              }
            >
              Descargar documento
            </DropdownMenuItem>
            <DropdownMenuItem>
              {document.is_active ? (
                <Button variant="destructive" onClick={() => handleOpenModal(equipment?.id)} className="text-sm">
                  Dar de baja documento
                </Button>
              ) : (
                <Button variant="primary" onClick={() => handleOpenIntegerModal(equipment.id)} className="text-sm">
                  Reintegrar Equipo
                </Button>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
  {
    accessorKey: 'domain',
    header: ({ column }: { column: any }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="p-0">
          Dominio
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'id_document_types',
    header: 'Tipo de documento',
  },
  {
    accessorKey: 'validity',
    header: 'Fecha de validez',
  },
  {
    accessorKey: 'lastName',
    header: 'Apellido',
  },
  {
    accessorKey: 'firstName',
    header: 'Nombre',
  },

  {
    accessorKey: 'state',
    header: 'Estado',
    cell: ({ row }) => {
      const variants: {
        [key: string]:
          | 'destructive'
          | 'success'
          | 'default'
          | 'secondary'
          | 'outline'
          | 'yellow'
          | 'red'
          | null
          | undefined;
      } = {
        vencido: 'red',
        rechazado: 'destructive',
        aprobado: 'success',
        presentado: 'default',
      };
      return <Badge variant={variants[row.original.state]}>{row.original.state}</Badge>;
    },
  },
  {
    accessorKey: 'applies',
    header: 'DNI',
  },
  {
    accessorKey: 'is_active',
    header: 'Activo',
  },
  {
    accessorKey: 'document_url',
    header: 'Archivo',
  },
];
