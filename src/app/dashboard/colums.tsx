'use client';

import SimpleDocument from '@/components/SimpleDocument';
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
import { saveAs } from 'file-saver';

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
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, DotsVerticalIcon } from '@radix-ui/react-icons';
import { ColumnDef, FilterFn, Row } from '@tanstack/react-table';
import { addMonths, format, formatRelative } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpDown } from 'lucide-react';
import moment from 'moment';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

type Colum = {
  vehicle_id?: string | undefined;
  applies: any;
  date: string;
  allocated_to: string | null;
  documentName: string;
  multiresource: string;
  validity: string | null;
  id: string;
  resource: string;
  state: string | null;
  document_number?: string;
  mandatory?: string;
  id_document_types?: string;
  intern_number?: string | undefined | null;
  serie?: string | undefined | null;
};
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

const dateRangeFilter: FilterFn<Colum> = (
  row: Row<Colum>,
  columnId: string,
  filterValue: any,
  addMeta: (meta: any) => void
) => {
  if (!row.original.validity) return false;
  const startDateInput = document.getElementById('date-from-full') as HTMLInputElement;
  const endDateInput = document.getElementById('date-limit-full') as HTMLInputElement;
  const startDateValue = startDateInput?.value ? new Date(startDateInput?.value) : null;
  const endDateValue = endDateInput?.value ? new Date(endDateInput?.value) : null;
  const [day, month, year] = row.original.validity?.split('/');
  const validityDate = row.original.validity === 'No vence' ? null : new Date(`${year}-${month}-${day}`);

  if (row.original.validity === 'No vence') return false;

  if (startDateValue && !endDateValue) {
    return validityDate! >= startDateValue;
  }
  if (!startDateValue && endDateValue) {
    return validityDate! <= endDateValue;
  }

  if (startDateValue && endDateValue) {
    return validityDate! >= startDateValue && validityDate! <= endDateValue;
  }
  return false;
};

const domainAndInternNumber: FilterFn<Colum> = (
  row: Row<Colum>,
  columnId: string,
  filterValue: any,
  addMeta: (meta: any) => void
) => {
  const words = filterValue.split(' ');

  if (!row.original?.intern_number) {
    if (row.original.resource.toUpperCase().includes(filterValue.toUpperCase())) return true;
    return false;
  }

  if (
    words.some((word: string) => row.original.resource.toUpperCase().includes(word.toUpperCase())) ||
    words.some((word: string) => row.original?.intern_number?.toUpperCase()?.includes(word.toUpperCase()))
  ) {
    return true;
  }

  return false;
};

export const ExpiredColums: ColumnDef<Colum>[] = [
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
        viewDocumentEmployees();
      };

      const { errorTranslate } = useEdgeFunctions();

      const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          reason_for_termination: undefined,
        },
      });

      async function reintegerDocumentEmployees() {
        toast.promise(
          async () => {
            const supabase = supabaseBrowser();
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
            if (error) {
              throw new Error(error.message);
            }
          },
          {
            loading: 'Reintegrando...',
            success: 'Documento reintegrado!',
            error: (error) => {
              return error;
            },
          }
        );
      }

      async function onSubmit(values: z.infer<typeof formSchema>) {
        toast.promise(
          async () => {
            const data = {
              ...values,
              termination_date: format(values.termination_date, 'yyyy-MM-dd'),
            };

            const supabase = supabaseBrowser();

            const { error } = await supabase
              .from('documents_employees')
              .update({
                is_active: false,
                //termination_date: data.termination_date,
                //reason_for_termination: data.reason_for_termination,
              })
              .eq('id', document.id)
              .select();

            setShowModal(!showModal);

            if (error) {
              throw new Error(error.message);
            }
          },
          {
            loading: 'Eliminando...',
            success: 'Documento eliminado!',
            error: (error) => {
              return error;
            },
          }
        );
      }
      const handleToggleInactive = () => {
        setShowInactive(!showInactive);
      };

      async function viewDocumentEmployees() {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from('documents_employees_logs')
          .select('*, documents_employees(user_id(email))')
          .eq('documents_employees_id', document.id);

        if (error) {
          toast.error(`${handleSupabaseError(error.message)}`);
        }
        if (data) {
          setDocumentHistory(data);
        }
      }
      // useEffect(() => {
      // }, []);

      const today = new Date();
      const nextMonth = addMonths(new Date(), 1);
      const [month, setMonth] = useState<Date>(nextMonth);

      const yearsAhead = Array.from({ length: 20 }, (_, index) => {
        const year = today.getFullYear() - index - 1;
        return year;
      });
      const [years, setYear] = useState(today.getFullYear().toString());
      const supabase = supabaseBrowser();
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
                                        format(field.value, 'PPP', {
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
                                  {/* <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={date =>
                                      date > new Date() ||
                                      date < new Date('1900-01-01')
                                    }
                                    initialFocus
                                    locale={es}
                                  /> */}
                                  <Select
                                    onValueChange={(e) => {
                                      setMonth(new Date(e));
                                      setYear(e);
                                      const newYear = parseInt(e, 10);
                                      const dateWithNewYear = new Date(field.value);
                                      dateWithNewYear.setFullYear(newYear);
                                      field.onChange(dateWithNewYear);
                                      setMonth(dateWithNewYear);
                                    }}
                                    value={years || today.getFullYear().toString()}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Elegir año" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                      <SelectItem
                                        value={today.getFullYear().toString()}
                                        disabled={years === today.getFullYear().toString()}
                                      >
                                        {today.getFullYear().toString()}
                                      </SelectItem>
                                      {yearsAhead?.map((year) => (
                                        <SelectItem key={year} value={`${year}`}>
                                          {year}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Calendar
                                    month={month}
                                    onMonthChange={setMonth}
                                    toDate={today}
                                    locale={es}
                                    mode="single"
                                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                    selected={new Date(field.value) || today}
                                    onSelect={(e) => {
                                      field.onChange(e);
                                    }}
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
                      <TableCell className="text-center">Usuario</TableCell>
                      <TableCell className="text-center">Fecha de modificación</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentHistory?.map((entry: any, index: number) => (
                      <TableRow key={crypto.randomUUID()}>
                        <TableCell className="text-center">{entry.documents_employees.user_id.email}</TableCell>

                        <TableCell className="text-center">
                          {formatRelative(new Date(entry.updated_at), new Date(), { locale: es })}
                        </TableCell>
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
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(
                  row.original.allocated_to === 'Vehículos' ? row.original.resource : row.original.document_number
                )
              }
            >
              {row.original.allocated_to === 'Vehículos' ? 'Copiar Patente' : 'Copiar Documento'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenViewModal(domain)}>Historial de Modificaciones</DropdownMenuItem>
            <DropdownMenuItem
              disabled={row.original.state === 'pendiente'}
              onClick={() =>
                // console.log('Andamo ruleta en una camioneta',row)
                handleDownload(row.original.document_url, row.original.documentName, row.original.resource)
              }
            >
              Descargar documento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
  {
    accessorKey: 'resource',
    header: 'Empleado',
    cell: ({ row, table }) => {
      return <p>{row.original.resource === 'null' ? row.original.serie : row.original.resource}</p>;
    },
    filterFn: domainAndInternNumber,
  },
  {
    accessorKey: 'documentName',
    header: 'Documento'
  },
  {
    accessorKey: 'intern_number',
    header: ({ column, table, header }) => {
      const rowId = column.id; // Suponiendo que props.column.id contiene el id de la fila
      const row = table.getRowModel().rows.some((e) => e.original.intern_number);

      if (!row) return null;
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Numero interno
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },

    cell: ({ row, table }) => {
      const isHide = table.getRowModel().rows.some((e) => e.original.intern_number);
      if (!isHide) return null;
      return <p>{row.original.intern_number}</p>;
    },
  },
  {
    accessorKey: 'id_document_types'.replaceAll('_', ' '),
    header: undefined,
  },

  {
    accessorKey: 'allocated_to',
    header: 'Afectado a',
    cell: ({ row }) => {
      const values = row.original.allocated_to;
      const theme = useTheme();

      // console.log(values);

      if (!values)
        return (
          <Badge
            variant={
              cn(theme.theme === 'dark' ? 'default' : 'outline') as
                | 'default'
                | 'secondary'
                | 'destructive'
                | 'outline'
                | 'success'
                | 'yellow'
                | 'red'
                | null
                | undefined
            }
          >
            Sin afectar
          </Badge>
        );
      const contractorCompanies = Array.isArray(values)
        ? values
            .map((allocatedToId) =>
              useCountriesStore(
                (state) => state.customers?.find((company: any) => String(company.id) === String(allocatedToId))?.name
              )
            )
            .join(', ')
        : useCountriesStore(
            (state) => state.customers?.find((company: any) => String(company.id) === String(values))?.name
          );

      return <p>{contractorCompanies}</p>;
    },
  },

  {
    accessorKey: 'mandatory',
    header: 'Mandatorio',
  },
  {
    accessorKey: 'state',
    header: 'Estado',
    cell: ({ row }) => {
      const variants: {
        [key: string]: 'destructive' | 'success' | 'default' | 'secondary' | 'outline' | 'yellow' | null | undefined;
      } = {
        vencido: 'yellow',
        rechazado: 'destructive',
        pendiente: 'destructive',
        aprobado: 'success',
        presentado: 'default',
      };
      return <Badge variant={variants[row.original.state || '']}>{row.original.state}</Badge>;
    },
  },
  {
    accessorKey: 'multiresource',
    header: 'Multirecurso',
  },
  {
    accessorKey: 'validity',
    filterFn: dateRangeFilter,
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Vencimiento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isNoPresented = row.getValue('state') === 'pendiente';
      //console.log(row.original.validity, 'row.original.validity');

      if (isNoPresented) {
        return <Badge variant={'destructive'}>Pendiente</Badge>;
      } else {
        if (row.original.validity) {
          return moment(row.original.validity).format('DD/MM/YYYY');
        } else {
          console.log('row.original.validity', row.original.validity);
          return <Badge variant={'outline'}>No vence</Badge>;
        }
      }
    },
  },
  {
    accessorKey: 'date',
    sortingFn: 'datetime',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Subido el
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isNoPresented = row.getValue('state') === 'pendiente';

      if (isNoPresented) {
        return 'No disponible';
      } else {
        const [day, month, year] = row.original.date.split('/');
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        return date.toLocaleDateString();
      }
    },
  },
  {
    accessorKey: 'id',
    header: 'Revisar documento',
    cell: ({ row }) => {
      const isNoPresented = row.getValue('state') === 'pendiente';
      const role = useLoggedUserStore?.getState?.().roleActualCompany;

      const [open, setOpen] = useState(false);

      const handleOpen = () => setOpen(!open);
      const applies = row.original.applies === 'Persona' ? 'empleado' : 'equipo';

      if (isNoPresented) {
        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              {role !== 'Invitado' && <Button variant="outline">Subir documento</Button>}
            </AlertDialogTrigger>
            <AlertDialogContent asChild>
              <AlertDialogHeader>
                <div className="max-h-[90vh] overflow-y-auto">
                  <div className="space-y-3">
                    <div>
                      <SimpleDocument
                        resource={applies}
                        handleOpen={() => handleOpen()}
                        defaultDocumentId={row.original.id_document_types}
                        // document={document}
                        numberDocument={row.original.document_number || row.original.vehicle_id}
                      />
                    </div>
                  </div>
                </div>
              </AlertDialogHeader>
            </AlertDialogContent>
          </AlertDialog>
        );
      }

      return (
        <Link href={`/dashboard/document/${row.original.id}?resource=${row.original.applies}`}>
          <Button>Ver documento</Button>
        </Link>
      );
    },
  },
];
