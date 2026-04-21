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
import { Badge } from '@/shared/components/ui/badge';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useEdgeFunctions } from '@/shared/hooks/useEdgeFunctions';
import { cn } from '@/shared/lib/utils';
import { useCountriesStore } from '@/shared/store/countries';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { ColumnDef, FilterFn, Row } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, ArrowUpDown, CalendarIcon, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import React, { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';
import { RiToolsFill } from 'react-icons/ri';
import { toast } from 'sonner';
import { z } from 'zod';
import { reactivateVehicle, deactivateVehicle } from '@/modules/equipment/features/create/actions.server';
const formSchema = z.object({
  reason_for_termination: z.string({
    required_error: 'La razon de la baja es requerida.',
  }),
  termination_date: z.date({
    required_error: 'La fecha de baja es requerida.',
  }),
});

type Colum = VehicleWithBrand;

const allocatedToRangeFilter: FilterFn<Colum> = (
  row: Row<Colum>,
  columnId: string,
  filterValue: any,
  addMeta: (meta: any) => void
) => {
  const contractorCompanies = useCountriesStore
    ?.getState?.()
    ?.customers.filter(
      (company: any) => company.company_id.toString() === useLoggedUserStore?.getState?.()?.actualCompany?.id
    )
    .find((e) => String(e.id) === String(row.original.allocated_to))?.name;

  if (contractorCompanies?.toLocaleLowerCase()?.includes(filterValue.toLocaleLowerCase())) {
    return true;
  }
  const sinAfectar = 'sin afectar';
  if (sinAfectar.includes(filterValue.toLocaleLowerCase()) && !row.original.allocated_to) return true;
  return false;
};
const conditionFilter: FilterFn<Colum> = (
  row: Row<Colum>,
  columnId: string,
  filterValue: any,
  addMeta: (meta: any) => void
) => {
  if (filterValue === 'Todos') {
    return true;
  }
  return row.original.condition === filterValue;
};

export const EquipmentColums: ColumnDef<Colum>[] = [
  {
    id: 'actions',
    cell: ({ row }: { row: any }) => {
      const share = useLoggedUserStore((state) => state.sharedCompanies);
      const profile = useLoggedUserStore((state) => state.credentialUser?.id);
      const owner = useLoggedUserStore((state) => state.actualCompany?.owner_id.id);
      const users = useLoggedUserStore((state) => state);
      const company = useLoggedUserStore((state) => state.actualCompany?.id);

      let role = '';
      if (owner === profile) {
        role = users?.actualCompany?.owner_id?.role as string;
      } else {
        const roleRaw = share
          ?.filter(
            (item: any) =>
              item.company_id.id === company &&
              Object.values(item).some((value) => typeof value === 'string' && value.includes(profile as string))
          )
          .map((item: any) => item.role);
        role = roleRaw?.join('');
      }
      const [showModal, setShowModal] = useState(false);
      const [integerModal, setIntegerModal] = useState(false);
      const [domain, setDomain] = useState('');
      //     //const user = row.original
      const [showInactive, setShowInactive] = useState<boolean>(false);
      const [showDeletedEquipment, setShowDeletedEquipment] = useState(false);
      const equipment = row.original;

      const handleOpenModal = (id: string) => {
        setDomain(id);
        setShowModal(!showModal);
      };
      const actualCompany = useLoggedUserStore((state) => state.actualCompany);

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
          await reactivateVehicle(equipment.id, actualCompany?.id || '');

          setIntegerModal(!integerModal);

          setShowDeletedEquipment(false);
          toast.success('Equipo reintegrado', {
            description: `El equipo ${equipment?.engine} ha sido reintegrado`,
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
          await deactivateVehicle(equipment.id, actualCompany?.id || '', data.termination_date, data.reason_for_termination);

          setShowModal(!showModal);

          toast.success('Equipo eliminado', { description: `El equipo ${equipment.domain} ha sido dado de baja` });
        } catch (error: any) {
          const message = await errorTranslate(error?.message);
          toast.error('Error al dar de baja el equipo', { description: message });
        }
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
                  <AlertDialogTitle>Estas completamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {`Estas a punto de reintegrar al equipo ${equipment.id}, quien fue dado de baja por ${equipment.reason_for_termination} el dia ${equipment.termination_date}. Al reintegrar al equipo, se borraran estas razones. Si estas seguro de que deseas reintegrarlo, haz clic en 'Continuar'. De lo contrario, haz clic en 'Cancelar'.`}
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
                  Estas seguro de que deseas dar de baja este equipo?, completa los campos para continuar.
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
                                  <SelectItem value="Venta del vehiculo">Venta del vehiculo</SelectItem>
                                  <SelectItem value="Destruccion Total">Destruccion Total</SelectItem>
                                  <SelectItem value="Fundido">Fundido</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>Elige la razon por la que deseas dar de baja el equipo</FormDescription>
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
                                        ' pl-3 text-left font-normal'
                                        //                                       !field.value && 'text-muted-foreground'
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
            {/* {role === "Invitado" ? null :( */}
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <DotsVerticalIcon className="h-4 w-4" />
            </Button>
            {/* )} */}
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
                    <Button variant="destructive" onClick={() => handleOpenModal(equipment?.id)} className="text-sm">
                      Dar de baja equipo
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => handleOpenIntegerModal(equipment.id)} className="text-sm">
                      Reintegrar Equipo
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
    accessorKey: 'intern_number',
    header: ({ column }: { column: any }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="p-0">
          Numero interno
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: any }) => {
      return (
        <Link href={`/dashboard/equipment/action?action=view&id=${row.original.id}`} className="hover:underline">
          {row.original.intern_number}
        </Link>
      );
    },
  },
  {
    accessorKey: 'domain',
    id: 'domain',
    header: ({ column }: { column: any }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="p-0">
          Dominio
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      //Filtrar por numero intenro o dominio
      if (
        row.original.intern_number?.toLowerCase().includes(filterValue.toLowerCase()) ||
        row.original.domain?.toLowerCase()?.includes(filterValue.toLowerCase())
      ) {
        return true;
      } else {
        return false;
      }
    },
  },
  {
    accessorKey: 'chassis',
    header: 'Chassis',
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const statusVariants: Record<string, 'success' | 'yellow' | 'destructive'> = {
        Avalado: 'success',
        Completo: 'success',
        Incompleto: 'yellow',
        'No avalado': 'destructive',
        'Completo con doc vencida': 'yellow',
      };
      const status = row.original.status as string | undefined;
      const label = status ? status.replaceAll('_', ' ') : '';
      return (
        <Badge variant={statusVariants[label] ?? 'destructive'}>
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
      return <Badge>{row.original.type?.name}</Badge>;
    },
    filterFn: (row, columnId, filterValue) => {
      //Filtrar por tipo de equipo
      return row.original.type?.name?.toLowerCase()?.includes(filterValue.toLowerCase()) ?? false;
    },
  },
  {
    accessorKey: 'types_of_vehicles',
    header: 'Tipos de vehiculos',
    cell: ({ row }) => {
      return <Badge>{row.original.types_of_vehicles?.name as string}</Badge>;
    },
  },

  {
    accessorKey: 'engine',
    header: 'Motor',
  },

  {
    accessorKey: 'serie',
    header: 'Serie',
  },
  {
    accessorKey: 'allocated_to',
    header: 'Afectado a',
    cell: ({ row }) => {

      return row.original.contractor_equipment?.map((contractor) => {
        return <Badge key={contractor.contractor_id.id}>{contractor.contractor_id.name}</Badge>;
      });
    },
    filterFn: (row, columnId, filterValue) => {
      // Filtrar por numero intenro o dominio
      if (filterValue === 'sin afectar' && row.original.allocated_to === null) {
        return true;
      }
      if (row.original.contractor_equipment?.some((contractor) => contractor.contractor_id.name.includes(filterValue))) {
        return true;
      } else {
        return false;
      }
    },
  },

  {
    accessorKey: 'year',
    header: 'Ano',
  },
  {
    accessorKey: 'condition',
    header: 'Condicion',
    cell: ({ row }) => {
      const variants = {
        operativo: 'success',
        'no operativo': 'destructive',
        'en reparacion': 'yellow',
        'operativo condicionado': 'info',
        default: 'default',
      };

      const conditionConfig = {
        'operativo condicionado': { color: 'bg-blue-500', icon: AlertTriangle },
        operativo: { color: 'bg-green-500', icon: CheckCircle },
        'no operativo': { color: 'bg-red-500', icon: XCircle },
        'en reparacion': { color: 'bg-yellow-500', icon: RiToolsFill },
      };

      const condition = row.original?.condition ? (row.original.condition as string).replaceAll('_', ' ') : '';
      const config = condition ? (conditionConfig as Record<string, any>)[condition] : null;
      return (
        <Badge variant={(variants as Record<string, string>)[condition || 'default'] as 'default'}>
          {config?.icon &&
            React.createElement(config.icon, { className: 'mr-2 size-4' })}
          {condition}
        </Badge>
      );
    },
    filterFn: conditionFilter,
  },
  {
    accessorKey: 'brand',
    header: 'Marca',
    cell: ({ row }) => {
      return <div>{row.original.brand?.name}</div>;
    },
    filterFn: (row, columnId, filterValue) => {
      //Filtrar por marca
      if (row.original?.brand?.name?.toLowerCase()?.includes(filterValue.toLowerCase())) {
        return true;
      } else {
        return false;
      }
    },
  },
  {
    accessorKey: 'kilometer',
    header: 'Kilometros',
    cell: ({ row }) => {
      return <Badge variant={'outline'}>{row.original.kilometer} km</Badge>;
    },
  },
  {
    accessorKey: 'model',
    header: 'Modelo',
    cell: ({ row }) => {
      return <div>{row.original.model?.name}</div>;
    },
    filterFn: (row, columnId, filterValue) => {
      //Filtrar por modelo
      if (row.original.model?.name?.toLowerCase().includes(filterValue.toLowerCase())) {
        return true;
      } else {
        return false;
      }
    },
  },
  {
    accessorKey: 'picture',
    header: 'Foto',
  },
  {
    accessorKey: 'showUnavaliableEquipment',
    header: 'Ver equipos dados de baja',
  },
];
