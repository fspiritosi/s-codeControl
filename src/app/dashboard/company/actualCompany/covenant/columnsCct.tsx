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
import { CalendarIcon } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '../../../../../../supabase/supabase';

const editCovenantSchema = z.object({
  covenant: z.string().nonempty('El nombre del convenio es requerido.'),
});
const formSchema = z.object({
  termination_date: z.date({
    required_error: 'La fecha de baja es requerida.',
  }),
});

type Colum = {
  name: string;
  created_at: Date;
  is_active: boolean;
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
      const [showCovenantModal, setShowCovenantModal] = useState(false);
      const [integerModal, setIntegerModal] = useState(false);
      const [id, setId] = useState('');
      const [covenantName, setCovenantName] = useState('');
      const covenant = row.original;

      const handleOpenModal = (id: string) => {
        setId(id);
        setShowModal(!showModal);
      };

      const handleOpenCovenantModal = (id: string) => {
        setId(id);
        setCovenantName(covenant.name);
        setShowCovenantModal(!showCovenantModal);
      };
      const actualCompany = useLoggedUserStore((state) => state.actualCompany);

      const fetchCovenant = async () => {
        try {
          const { data, error } = await supabase
            .from('covenant')
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
        fetchCovenant();
      }, []);
      const handleOpenIntegerModal = (id: string) => {
        setId(id);
        setIntegerModal(!integerModal);
      };

      const { errorTranslate } = useEdgeFunctions();

      const formEditCovenant = useForm<z.infer<typeof editCovenantSchema>>({
        resolver: zodResolver(editCovenantSchema),
        defaultValues: {
          covenant: '',
        },
      });

      const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          //   reason_for_termination: undefined,
        },
      });

      async function reintegerCct() {
        toast.promise(
          async () => {
            const supabase = supabaseBrowser();

            const { data, error } = await supabase
              .from('covenant')
              .update({
                is_active: true,
              })
              .eq('id', covenant.id)
              //.eq('company_id', actualCompany?.id)
              .select();

            setIntegerModal(!integerModal);

            if (error) {
              throw new Error(handleSupabaseError(error.message));
            }
          },
          {
            loading: 'Reintegrando...',
            success: `Convenio reintegrado`,
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
              .from('covenant')
              .update({
                is_active: false,
              })
              .eq('id', covenant.id)
              .eq('company_id', actualCompany?.id || '')
              .select();

            const { error: categoryError } = await supabase
              .from('category')
              .update({
                is_active: false,
              })
              .eq('covenant_id', covenant.id);
            // .eq('company_id', actualCompany?.id);

            if (categoryError) {
              throw new Error(handleSupabaseError(categoryError.message));
            }

            setShowModal(!showModal);
            if (error) {
              throw new Error(handleSupabaseError(error.message));
            }
          },
          {
            loading: 'Eliminando...',
            success: 'Convenio y categoría eliminados',
            error: (error) => {
              return error;
            },
          }
        );
      }

      async function editCovenant(values: z.infer<typeof editCovenantSchema>) {
        toast.promise(
          async () => {
            const supabase = supabaseBrowser();

            const { data, error } = await supabase
              .from('covenant')
              .update({
                name: values.covenant,
              })
              .eq('id', covenant.id)
              .eq('company_id', actualCompany?.id || '')
              .select();

            setShowCovenantModal(!showCovenantModal);

            if (error) {
              throw new Error(handleSupabaseError(error.message));
            }
          },
          {
            loading: 'Editando...',
            success: `Convenio editado`,
            error: (error) => error.message,
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
                    {`Estás a punto de reintegrar el convenio ${covenant.name}`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => reintegerCct()}>Continuar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {showModal && (
            <Dialog defaultOpen onOpenChange={() => setShowModal(!showModal)}>
              <DialogContent className="dark:bg-slate-950">
                <DialogTitle>Dar de baja Convenio</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas dar de baja este convenio?, completa los campos para continuar.
                </DialogDescription>
                <DialogFooter>
                  <div className="w-full">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
          {showCovenantModal && (
            <Dialog defaultOpen onOpenChange={() => setShowCovenantModal(!showCovenantModal)}>
              <DialogContent className="dark:bg-slate-950">
                <DialogTitle>Editar Sindicato</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas editar este sindicato?, completa los campos para continuar.
                </DialogDescription>
                <DialogFooter>
                  <div className="w-full">
                    <Form {...formEditCovenant}>
                      <form onSubmit={formEditCovenant.handleSubmit(editCovenant)} className="space-y-8">
                        <FormField
                          control={formEditCovenant.control}
                          name="covenant"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nombre del sindicato"
                                  {...field}
                                  value={covenantName}
                                  onChange={(c) => {
                                    setCovenantName(c.target.value);
                                    field.onChange(c);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>Nombre del convenio</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-4 justify-end">
                          <Button variant="primary" type="submit">
                            Editar
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
            <DropdownMenuItem>
              {role !== 'Invitado' && (
                <Fragment>
                  <Button
                    variant="destructive"
                    onClick={() => handleOpenCovenantModal(covenant?.id)}
                    className="text-sm"
                  >
                    Editar Convenio
                  </Button>
                </Fragment>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem>
              {role !== 'Invitado' && (
                <Fragment>
                  {covenant.is_active ? (
                    <Button variant="destructive" onClick={() => handleOpenModal(covenant?.id)} className="text-sm">
                      Dar de baja Convenio
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => handleOpenIntegerModal(covenant.id)} className="text-sm">
                      Reintegrar Convenio
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
    accessorKey: 'name',
    header: 'Nombre',
  },

  {
    accessorKey: 'guild_id',
    header: 'Sindicato',
  },

  {
    accessorKey: 'showUnavaliableCovenant',
    header: 'Ver convenios dados de baja',
  },
];
