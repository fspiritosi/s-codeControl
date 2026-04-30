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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useEdgeFunctions } from '@/shared/hooks/useEdgeFunctions';
import { cn } from '@/shared/lib/utils';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  reactivateVehicle,
  deactivateVehicle,
} from '@/modules/equipment/features/create/actions.server';

const formSchema = z.object({
  reason_for_termination: z.string({
    required_error: 'La razon de la baja es requerida.',
  }),
  termination_date: z.date({
    required_error: 'La fecha de baja es requerida.',
  }),
});

interface EquipmentRowActionsProps {
  row: any;
}

export function EquipmentRowActions({ row }: EquipmentRowActionsProps) {
  const share = useLoggedUserStore((state) => state.sharedCompanies);
  const profile = useLoggedUserStore((state) => state.credentialUser?.id);
  const owner = useLoggedUserStore((state) => state.actualCompany?.owner_id.id);
  const users = useLoggedUserStore((state) => state);
  const company = useLoggedUserStore((state) => state.actualCompany?.id);
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);

  let role = '';
  if (owner === profile) {
    role = users?.actualCompany?.owner_id?.role as string;
  } else {
    const roleRaw = share
      ?.filter(
        (item: any) =>
          item.company_id.id === company &&
          Object.values(item).some(
            (value) => typeof value === 'string' && value.includes(profile as string)
          )
      )
      .map((item: any) => item.role);
    role = roleRaw?.join('');
  }

  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [integerModal, setIntegerModal] = useState(false);
  const [domain, setDomain] = useState('');
  const [showDeletedEquipment, setShowDeletedEquipment] = useState(false);
  const equipment = row.original;

  const handleOpenModal = (id: string) => {
    setDomain(id);
    setShowModal(!showModal);
  };

  const handleOpenIntegerModal = (id: string) => {
    setDomain(id);
    setIntegerModal(!integerModal);
  };

  const { errorTranslate } = useEdgeFunctions();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason_for_termination: undefined,
    },
  });

  async function reintegerEquipment() {
    try {
      const result = await reactivateVehicle(equipment.id, actualCompany?.id || '');

      if (result?.error) {
        toast.error('Error al reintegrar el equipo', { description: result.error });
        return;
      }

      setIntegerModal(!integerModal);
      setShowDeletedEquipment(false);
      router.refresh();
      toast.success('Equipo reintegrado', {
        description: `El equipo ${equipment?.domain ?? equipment?.engine} ha sido reintegrado`,
      });
    } catch (error: any) {
      const message = await errorTranslate(error?.message);
      toast.error('Error al reintegrar el equipo', { description: message });
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
      termination_date: format(values.termination_date, 'yyyy-MM-dd'),
    };

    try {
      const result = await deactivateVehicle(
        equipment.id,
        actualCompany?.id || '',
        data.termination_date,
        data.reason_for_termination
      );

      if (result?.error) {
        toast.error('Error al dar de baja el equipo', { description: result.error });
        return;
      }

      setShowModal(!showModal);
      router.refresh();
      toast.success('Equipo eliminado', {
        description: `El equipo ${equipment.domain} ha sido dado de baja`,
      });
    } catch (error: any) {
      const message = await errorTranslate(error?.message);
      toast.error('Error al dar de baja el equipo', { description: message });
    }
  }

  return (
    <DropdownMenu>
      {integerModal && (
        <AlertDialog defaultOpen onOpenChange={() => setIntegerModal(!integerModal)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reintegrar equipo</AlertDialogTitle>
              <AlertDialogDescription>
                {`Estás a punto de reintegrar el equipo ${equipment.domain ?? equipment.intern_number ?? ''}, dado de baja por ${equipment.reason_for_termination} el día ${equipment.termination_date ? format(new Date(equipment.termination_date), 'dd/MM/yyyy') : '—'}. Se limpiarán los datos de baja.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => reintegerEquipment()}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {showModal && (
        <Dialog defaultOpen onOpenChange={() => setShowModal(!showModal)}>
          <DialogContent className="dark:bg-slate-950">
            <DialogTitle>Dar de baja Equipo</DialogTitle>
            <DialogDescription>
              Estas seguro de que deseas dar de baja este equipo?, completa los campos para
              continuar.
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
                                <SelectValue placeholder="Selecciona la razon" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Venta del vehiculo">
                                Venta del vehiculo
                              </SelectItem>
                              <SelectItem value="Destruccion Total">Destruccion Total</SelectItem>
                              <SelectItem value="Fundido">Fundido</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Elige la razon por la que deseas dar de baja el equipo
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
                                  className={cn(' pl-3 text-left font-normal')}
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
                                disabled={(date) =>
                                  date > new Date() || date < new Date('1900-01-01')
                                }
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
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <DotsVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Opciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(equipment.domain)}>
          Copiar Dominio
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link className="w-full" href={`/dashboard/equipment/action?action=view&id=${equipment?.id}`}>
            Ver equipo
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          {role !== 'Invitado' && (
            <Link className="w-full" href={`/dashboard/equipment/action?action=edit&id=${equipment?.id}`}>
              Editar equipo
            </Link>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem>
          {role !== 'Invitado' && (
            <Fragment>
              {equipment.is_active ? (
                <Button
                  variant="destructive"
                  onClick={() => handleOpenModal(equipment?.id)}
                  className="text-sm"
                >
                  Dar de baja equipo
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => handleOpenIntegerModal(equipment.id)}
                  className="text-sm"
                >
                  Reintegrar Equipo
                </Button>
              )}
            </Fragment>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
