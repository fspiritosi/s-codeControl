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
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEdgeFunctions } from '@/hooks/useEdgeFunctions';
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpDown, CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '../../../../../../supabase/supabase';
const formSchema = z.object({
  reason_for_termination: z.string({
    required_error: 'La razón de la baja es requerida.',
  }),
  termination_date: z.date({
    required_error: 'La fecha de baja es requerida.',
  }),
});

type Colum = {
  contact_name: string;
  constact_email: string;
  contact_phone: number;
  contact_charge: string;
  customer_id: { id: string; name: string };
  showInactive: boolean;
  status: string;
};

export const columns: ColumnDef<Colum>[] = [
  {
    id: 'actions',
    cell: ({ row }: { row: any }) => {
      const profile = useLoggedUserStore((state) => state);
      let role = '';
      if (profile?.actualCompany?.owner_id.id === profile?.credentialUser?.id) {
        role = profile?.actualCompany?.owner_id?.role as string;
      } else {
        role = profile?.actualCompany?.share_company_users?.[0]?.role as string;
      }

      const [showModal, setShowModal] = useState(false);
      const [integerModal, setIntegerModal] = useState(false);
      const [id, setId] = useState('');
      const [showInactive, setShowInactive] = useState('');
      const [showDeletedContact, setShowDeletedContact] = useState(false);
      const contacts = row.original;

      const handleOpenModal = (id: string) => {
        setId(id);
        setShowModal(!showModal);
      };
      const actualCompany = useLoggedUserStore((state) => state.actualCompany);

      const fetchInactiveContacts = async () => {
        try {
          const { data, error } = await supabase
            .from('contacts')
            .select('*')
            //.eq('is_active', false)
            .eq('company_id', actualCompany?.id)
            .select();

          if (error) {
            toast.error(`${handleSupabaseError(error.message)}`);
          }
        } catch (error) {
          toast.error(handleSupabaseError(`${error}`));
        }
      };
      useEffect(() => {
        fetchInactiveContacts();
      }, []);
      const handleOpenIntegerModal = (id: string) => {
        setId(id);
        setIntegerModal(!integerModal);
      };

      const { errorTranslate } = useEdgeFunctions();

      const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          reason_for_termination: undefined,
        },
      });

      async function reintegerContact() {
        toast.promise(
          async () => {
            const supabase = supabaseBrowser();

            const { data, error } = await supabase
              .from('contacts')
              .update({
                is_active: true,
                termination_date: null,
                reason_for_termination: null,
              })
              .eq('id', contacts.id)
              //.eq('company_id', actualCompany?.id)
              .select();

            setIntegerModal(!integerModal);
            //setInactive(data as any)
            setShowDeletedContact(false);

            if (error) {
              throw new Error(handleSupabaseError(error.message));
            }
          },
          {
            loading: 'Reintegrando...',
            success: `Contacto reintegrado`,
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
              .from('contacts')
              .update({
                is_active: false,
                termination_date: data.termination_date,
                reason_for_termination: data.reason_for_termination,
              })
              .eq('id', contacts.id)
              .eq('company_id', actualCompany?.id || '')
              .select();

            setShowModal(!showModal);
            if (error) {
              throw new Error(handleSupabaseError(error.message));
            }
          },
          {
            loading: 'Eliminando...',
            success: 'Contacto eliminado',
            error: (error) => {
              return error;
            },
          }
        );
      }
      const today = new Date();
      const nextMonth = addMonths(new Date(), 1);
      const [month, setMonth] = useState<Date>(nextMonth);

      const yearsAhead = Array.from({ length: 20 }, (_, index) => {
        const year = today.getFullYear() - index - 1;
        return year;
      });
      const [years, setYear] = useState(today.getFullYear().toString());

      return (
        <DropdownMenu>
          {integerModal && (
            <AlertDialog defaultOpen onOpenChange={() => setIntegerModal(!integerModal)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {`Estás a punto de reintegrar el contacto ${contacts.name}, quien fue dado de baja por ${contacts.reason_for_termination} el día ${contacts.termination_date}. Al reintegrar al contacto, se borrarán estas razones. Si estás seguro de que deseas reintegrarlo, haz clic en 'Continuar'. De lo contrario, haz clic en 'Cancelar'.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => reintegerContact()}>Continuar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {showModal && (
            <Dialog defaultOpen onOpenChange={() => setShowModal(!showModal)}>
              <DialogContent className="dark:bg-slate-950">
                <DialogTitle>Dar de baja Contacto</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas dar de baja este contacto?, completa los campos para continuar.
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
                              <Input
                                className="input w-[250px]"
                                placeholder="Escribe el motivo"
                                maxLength={80} // Limitar a 80 caracteres
                                value={field.value}
                                onChange={(e: any) => {
                                  field.onChange(e.target.value);
                                }}
                              />
                              {/* <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona la razón" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Fin del contrato">Fin del Contrato</SelectItem>
                                  <SelectItem value="Cerro la empresa">Cerro la Empresa</SelectItem>
                                  <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                              </Select> */}
                              {/* <FormDescription>
                                Elige la razón por la que deseas dar de baja el
                                contacto
                              </FormDescription>
                              <FormMessage /> */}
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
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <DotsVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(contacts.constact_email)}>
              Copiar email
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link className="w-full" href={`/dashboard/company/actualCompany/contact/action?action=view&id=${contacts?.id}`}>
                Ver Contacto
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              {role !== 'Invitado' && (
                <Link className="w-full" href={`/dashboard/company/actualCompany/contact/action?action=edit&id=${contacts?.id}`}>
                  Editar Contacto
                </Link>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {role !== 'Invitado' && (
                <Fragment>
                  {contacts.is_active ? (
                    <Button variant="destructive" onClick={() => handleOpenModal(contacts?.id)} className="text-sm">
                      Dar de baja Contacto
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => handleOpenIntegerModal(contacts.id)} className="text-sm">
                      Reintegrar Contacto
                    </Button>
                  )}
                </Fragment>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
  {
    accessorKey: 'contact_name',
    header: ({ column }: { column: any }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="p-0">
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },

  {
    accessorKey: 'constact_email',
    header: 'Email',
  },
  {
    accessorKey: 'contact_phone',
    header: 'Teléfono',
  },
  {
    accessorKey: 'contact_charge',
    header: 'Cargo',
  },
  {
    accessorKey: 'customers.name',
    header: 'Cliente',
  },

  {
    accessorKey: 'showUnavaliableContacts',
    header: 'Ver contactos dados de baja',
  },
];
