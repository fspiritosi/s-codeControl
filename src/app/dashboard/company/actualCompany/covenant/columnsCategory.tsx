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

const editCategorySchema = z.object({
  category: z.string().nonempty('El nombre de la categoría es requerido.'),
}); 

const formSchema = z.object({
  
  termination_date: z.date({
    required_error: 'La fecha de baja es requerida.',
  }),
});

type Colum = {
  name: string;
  created_at:Date;
  is_active:boolean;
};

export const columnsCategory: ColumnDef<Colum>[] = [
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
      const [showCategoryModal, setShowCategoryModal] = useState(false);
      const [integerModal, setIntegerModal] = useState(false);
      const [id, setId] = useState('');
      const [categoryName, setCategoryName] = useState('');
      const category = row.original;
      const handleOpenModal = (id: string) => {
        setId(id);
        setShowModal(!showModal);
      };

      const handleOpenCategoryModal = (id: string) => {
        setId(id);
        setCategoryName(category.name);
        setShowCategoryModal(!showCategoryModal);
      };
      const actualCompany = useLoggedUserStore((state) => state.actualCompany);

      
      const handleOpenIntegerModal = (id: string) => {
        setId(id);
        setIntegerModal(!integerModal);
      };

      const { errorTranslate } = useEdgeFunctions();

      const formEditCategory = useForm<z.infer<typeof editCategorySchema>>({
        resolver: zodResolver(editCategorySchema),
        defaultValues: {
          category: '', 
        },
      });
      const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
        //   reason_for_termination: undefined,
        },
      });

      async function reintegerCategory() {
        toast.promise(
          async () => {
            const supabase = supabaseBrowser();

            const { data, error } = await supabase
              .from('category')
              .update({
                is_active: true,
                
              })
              .eq('id', category.id)
              //.eq('company_id', actualCompany?.id)
              .select();

            setIntegerModal(!integerModal);
            
            if (error) {
              throw new Error(handleSupabaseError(error.message));
            }
          },
          {
            loading: 'Reintegrando...',
            success: `Categoría reintegrada`,
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
              .from('category')
              .update({
                is_active: false,
                
              })
              .eq('id', category.id)
              

            setShowModal(!showModal);
            if (error) {
              throw new Error(handleSupabaseError(error.message));
            }
          },
          {
            loading: 'Eliminando...',
            success: 'Categoría eliminada',
            error: (error) => {
              return error;
            },
          }
        );
      }

      async function editCategory(values: z.infer<typeof editCategorySchema>) {
        toast.promise(
          async () => {
            const supabase = supabaseBrowser();

            const { data, error } = await supabase
              .from('category')
              .update({
                name: values.category, 
              })
              .eq('id', category.id)
              
              .select();

            setShowCategoryModal(!showCategoryModal);

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
                    {`Estás a punto de reintegrar la categoría ${category.name}`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => reintegerCategory()}>Continuar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {showModal && (
            <Dialog defaultOpen onOpenChange={() => setShowModal(!showModal)}>
              <DialogContent className="dark:bg-slate-950">
                <DialogTitle>Dar de baja Categoría</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas dar de baja esta categoría?, completa los campos para continuar.
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
          {showCategoryModal && (
            <Dialog defaultOpen onOpenChange={() => setShowCategoryModal(!showCategoryModal)}>
              <DialogContent className="dark:bg-slate-950">
                <DialogTitle>Editar Sindicato</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas editar este sindicato?, completa los campos para continuar.
                </DialogDescription>
                <DialogFooter>
                  <div className="w-full">
                    <Form {...formEditCategory}>
                      <form onSubmit={formEditCategory.handleSubmit(editCategory)} className="space-y-8">
                        <FormField
                          control={formEditCategory.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                              <Input
                              placeholder="Nombre de la categoría"
                              {...field}
                              value={categoryName}
                              onChange={(e) => {
                                setCategoryName(e.target.value);
                                field.onChange(e);
                              }}
                            />
                              </FormControl>
                              <FormDescription>Nombre de la categoría</FormDescription>
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

                  <Button variant="destructive" onClick={() => handleOpenCategoryModal(category?.id)} className="text-sm">
                    Editar Categoría
                  </Button>

                </Fragment>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {role !== 'Invitado' && (
                <Fragment>
                  {category.is_active ? (
                    <Button variant="destructive" onClick={() => handleOpenModal(category?.id)} className="text-sm">
                      Dar de baja Categoría
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => handleOpenIntegerModal(category.id)} className="text-sm">
                      Reintegrar Categoría
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
    header: 'Categoría',
  },

  {
    accessorKey: 'guild_id',
    header: 'Sindicato',
  },

  {
    accessorKey: 'covenant_id',
    header: 'convenio',
  },
  
  {
    accessorKey: 'showUnavaliableCovenant',
    header: 'Ver convenios dados de baja',
  },
];
