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
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { useEdgeFunctions } from '@/shared/hooks/useEdgeFunctions';
import { cn } from '@/shared/lib/utils';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpDown, CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  reactivateCustomer,
  reactivateContactsByCustomer,
  deactivateCustomer,
  deactivateContactsByCustomer,
  fetchCustomersByCompany,
} from '@/modules/company/features/customers/actions.server';
import { updateEmployeeAllocatedTo } from '@/modules/employees/features/create/actions.server';
import { updateVehicleAllocatedTo } from '@/modules/equipment/features/create/actions.server';
const formSchema = z.object({
  reason_for_termination: z.string({
    required_error: 'La razón de la baja es requerida.',
  }),
  termination_date: z.date({
    required_error: 'La fecha de baja es requerida.',
  }),
});

type Colum = {
  name: string;
  cuit: number;
  client_email: string;
  client_phone: number;
  address: string;
  is_active: boolean;
  showInactive: boolean;
  status: string;
};

export const columns: ColumnDef<Colum>[] = [
  {
    id: 'actions',
    cell: ({ row }: { row: any }) => {
      const profile = useLoggedUserStore((state) => state);
      const employ = useLoggedUserStore((state) => state.employeesToShow);
      const equip = useLoggedUserStore((state) => state.vehiclesToShow);

      let role = '';
      if (profile?.actualCompany?.owner_id.id === profile?.credentialUser?.id) {
        role = profile?.actualCompany?.owner_id?.role as string;
      } else {
        role = profile?.actualCompany?.share_company_users?.[0]?.role as string;
      }

      const [showModal, setShowModal] = useState(false);
      const [integerModal, setIntegerModal] = useState(false);
      const [cuit, setCuit] = useState('');
      //const user = row.original
      const [showInactive, setShowInactive] = useState<boolean>(false);
      const [showDeletedCustomer, setShowDeletedCustomer] = useState(false);
      const customers = row.original;

      const handleOpenModal = (id: string) => {
        setCuit(cuit);
        setShowModal(!showModal);
      };
      const actualCompany = useLoggedUserStore((state) => state.actualCompany);

      const fetchInactiveCustomer = async () => {
        try {
          const { error } = await fetchCustomersByCompany(actualCompany?.id || '');
          if (error) {
            console.error(error);
          }
        } catch (error) {
          console.error(error);
        }
      };
      useEffect(() => {
        fetchInactiveCustomer();
      }, []);
      const handleOpenIntegerModal = (id: string) => {
        setCuit(cuit);
        setIntegerModal(!integerModal);
      };

      const { errorTranslate } = useEdgeFunctions();

      const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          reason_for_termination: undefined,
        },
      });

      async function reintegerCustomer() {
        try {
          await reactivateCustomer(customers.id, actualCompany?.id || '');
          setIntegerModal(!integerModal);
          setShowDeletedCustomer(false);
          toast('Cliente reintegrado', { description: `El cliente ${customers?.name} ha sido reintegrado` });
        } catch (error: any) {
          const message = await errorTranslate(error?.message);
          toast('Error al reintegrar el cliente', { description: message });
        }

        try {
          await reactivateContactsByCustomer(customers.id, actualCompany?.id || '');
          setIntegerModal(!integerModal);
          setShowDeletedCustomer(false);
          toast('Contacto reintegrado');
        } catch (error: any) {
          const message = await errorTranslate(error?.message);
          toast('Error al reintegrar el contacto', { description: message });
        }
      }

      async function onSubmit(values: z.infer<typeof formSchema>) {
        const data = {
          ...values,
          termination_date: format(values.termination_date, 'yyyy-MM-dd'),
        };

        try {
          await deactivateCustomer(customers.id, actualCompany?.id || '', data.termination_date, data.reason_for_termination);
          setShowModal(!showModal);
          toast('Cliente eliminado');
        } catch (error: any) {
          const message = await errorTranslate(error?.message);
          toast('Error al dar de baja el cliente', { description: message });
        }

        try {
          await deactivateContactsByCustomer(customers.id, actualCompany?.id || '');
          setShowModal(!showModal);
          toast('Contacto eliminado');
        } catch (error: any) {
          const message = await errorTranslate(error?.message);
          toast('Error al dar de baja el contacto', { description: message });
        }

        const updatedEmployeesPromises = employ.map((employee: any) => {
          const updatedAllocatedTo = employee.allocated_to?.filter((clientId: string) => clientId !== customers.id);
          return updateEmployeeAllocatedTo(employee.id, updatedAllocatedTo);
        });
        await Promise.all(updatedEmployeesPromises);
        toast('Empleados actualizados', { description: `Los empleados afectados han sido actualizados` });

        const updatedEquipmentPromises = equip.map((equipment: any) => {
          const updatedAllocatedTo = equipment.allocated_to?.filter((clientId: string) => clientId !== customers.id);
          return updateVehicleAllocatedTo(equipment.id, updatedAllocatedTo);
        });
        await Promise.all(updatedEquipmentPromises);
        toast('Equipos actualizados', { description: `Los equipos afectados han sido actualizados` });
      }

      const handleToggleInactive = () => {
        setShowInactive(!showInactive);
      };

      return (
        <DropdownMenu>
          {integerModal && (
            <AlertDialog defaultOpen onOpenChange={() => setIntegerModal(!integerModal)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {`Estás a punto de reintegrar al equipo ${customers.name}, quien fue dado de baja por ${customers.reason_for_termination} el día ${customers.termination_date}. Al reintegrar al cliente, se borrarán estas razones. Si estás seguro de que deseas reintegrarlo, haz clic en 'Continuar'. De lo contrario, haz clic en 'Cancelar'.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => reintegerCustomer()}>Continuar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {showModal && (
            <Dialog defaultOpen onOpenChange={() => setShowModal(!showModal)}>
              <DialogContent className="dark:bg-slate-950">
                <DialogTitle>Dar de baja Cliente</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas dar de baja este cliente?, completa los campos para continuar.
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
                              {/* <Controller
                                name="reason_for_termination"
                                control={form.control}
                                defaultValue=""
                                render={({ field.value }) => ( */}
                              <Input
                                className="input w-[250px]"
                                placeholder="Escribe el motivo"
                                maxLength={80} // Limitar a 80 caracteres
                                value={field.value}
                                onChange={(e: any) => {
                                  field.onChange(e.target.value);
                                }}
                              />
                              {/* )}
                              /> */}
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
                              <FormDescription>Elige la razón por la que deseas dar de baja el equipo</FormDescription>
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
                    {/* <Button variant="destructive" onClick={() => handleDelete()}>
                    Eliminar
                  </Button> */}
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(customers.cuit)}>
              Copiar cuit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link className="w-full" href={`/dashboard/company/actualCompany/customers/action?action=view&id=${customers?.id}`}>
                Ver Cliente
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              {role !== 'Invitado' && (
                <Link className="w-full" href={`/dashboard/company/actualCompany/customers/action?action=edit&id=${customers?.id}`}>
                  Editar Cliente
                </Link>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {role !== 'Invitado' && (
                <Fragment>
                  {customers.is_active ? (
                    <Button variant="destructive" onClick={() => handleOpenModal(customers?.id)} className="text-sm">
                      Dar de baja Cliente
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => handleOpenIntegerModal(customers.id)} className="text-sm">
                      Reintegrar Cliente
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
    accessorKey: 'cuit',
    header: ({ column }: { column: any }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="p-0">
          Cuit
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'client_email',
    header: 'Email',
  },
  {
    accessorKey: 'client_phone',
    header: 'Teléfono',
  },
  {
    accessorKey: 'showUnavaliableContacts',
    header: 'Ver clientes dados de baja',
  },
];
