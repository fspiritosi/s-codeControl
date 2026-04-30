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
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  reactivateEmployeeByDocNumber,
  resetDocumentEmployeesForReintegration,
  deactivateEmployee,
} from '@/modules/employees/features/create/actions.server';

const formSchema = z.object({
  reason_for_termination: z.string({
    required_error: 'La razon de la baja es requerida.',
  }),
  termination_date: z.date({
    required_error: 'La fecha de baja es requerida.',
  }),
});

interface EmployeeRowActionsProps {
  row: any;
}

export function EmployeeRowActions({ row }: EmployeeRowActionsProps) {
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
          Object.values(item).some(
            (value) => typeof value === 'string' && value.includes(profile as string)
          )
      )
      .map((item: any) => item.role);
    role = roleRaw?.join('');
  }

  const [showModal, setShowModal] = useState(false);
  const [integerModal, setIntegerModal] = useState(false);
  const [document, setDocument] = useState('');
  const [admissionMode, setAdmissionMode] = useState<'keep' | 'new'>('keep');
  const [newAdmissionDate, setNewAdmissionDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );
  const user = row.original;

  const handleOpenModal = (id: string) => {
    setDocument(id);
    setShowModal(!showModal);
  };

  const fetchDocuments = useLoggedUserStore((state) => state.documetsFetch);
  const setActivesEmployees = useLoggedUserStore((state) => state.setActivesEmployees);
  const setShowDeletedEmployees = useLoggedUserStore((state) => state.setShowDeletedEmployees);

  const handleOpenIntegerModal = (id: string) => {
    setDocument(id);
    setIntegerModal(!integerModal);
  };

  const { errorTranslate } = useEdgeFunctions();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason_for_termination: undefined,
    },
  });

  const router = useRouter();

  async function reintegerEmployee() {
    const documentToUpdate = useLoggedUserStore
      ?.getState()
      ?.active_and_inactive_employees?.find((e: any) => e.document_number === document)
      ?.documents_employees?.filter((e: any) => e.id_document_types?.down_document)
      ?.map((e: any) => e.id);

    try {
      const dateOverride = admissionMode === 'new' ? newAdmissionDate : null;
      const result = await reactivateEmployeeByDocNumber(document, dateOverride);

      if (result?.error) {
        toast('Error al reintegrar al empleado', { description: result.error });
        return;
      }

      if (documentToUpdate?.length) {
        await resetDocumentEmployeesForReintegration(documentToUpdate);
      }

      setIntegerModal(!integerModal);
      setActivesEmployees();
      setShowDeletedEmployees(false);
      router.refresh();
      fetchDocuments();
      toast('Empleado reintegrado', {
        description: `El empleado ${user.full_name} ha sido reintegrado`,
      });
    } catch (error: any) {
      const message = await errorTranslate(error?.message);
      toast('Error al reintegrar al empleado', { description: message });
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
      termination_date: format(values.termination_date, 'yyyy-MM-dd'),
    };

    try {
      await deactivateEmployee(document, data.termination_date, data.reason_for_termination);

      setShowModal(!showModal);

      toast('Empleado eliminado', {
        description: `El empleado ${user.full_name} ha sido eliminado`,
      });
      setActivesEmployees();
      router.refresh();
      fetchDocuments();
    } catch (error: any) {
      const message = await errorTranslate(error?.message);
      toast('Error al dar de baja al empleado', { description: message });
    }
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
              <AlertDialogTitle>Reintegrar empleado</AlertDialogTitle>
              <AlertDialogDescription>
                {`Estás a punto de reintegrar al empleado ${user.full_name}, quien fue dado de baja por ${user.reason_for_termination} el día ${user.termination_date ? format(new Date(user.termination_date), 'dd/MM/yyyy') : '—'}. Se limpiarán los datos de baja.`}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-3 py-2">
              <p className="text-sm font-medium">Fecha de alta</p>
              <div className="flex flex-col gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="admissionMode"
                    value="keep"
                    checked={admissionMode === 'keep'}
                    onChange={() => setAdmissionMode('keep')}
                  />
                  <span>
                    Mantener fecha original
                    {user.date_of_admission ? ` (${format(new Date(user.date_of_admission), 'dd/MM/yyyy')})` : ''}
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="admissionMode"
                    value="new"
                    checked={admissionMode === 'new'}
                    onChange={() => setAdmissionMode('new')}
                  />
                  <span>Asignar nueva fecha de alta</span>
                </label>
                {admissionMode === 'new' && (
                  <input
                    type="date"
                    value={newAdmissionDate}
                    onChange={(e) => setNewAdmissionDate(e.target.value)}
                    className="ml-6 rounded-md border px-2 py-1 text-sm w-fit"
                  />
                )}
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => reintegerEmployee()}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {showModal && (
        <Dialog defaultOpen onOpenChange={() => setShowModal(!showModal)}>
          <DialogContent className="dark:bg-slate-950">
            <DialogTitle>Dar de baja</DialogTitle>
            <DialogDescription>
              Estas seguro de que deseas eliminar este empleado?
              <br /> Completa los campos para continuar.
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
                          <FormLabel>Motivo de baja</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona la razon" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Despido sin causa">Despido sin causa</SelectItem>
                              <SelectItem value="Renuncia">Renuncia</SelectItem>
                              <SelectItem value="Despido con causa">Despido con causa</SelectItem>
                              <SelectItem value="Acuerdo de partes">Acuerdo de partes</SelectItem>
                              <SelectItem value="Fin de contrato">Fin de contrato</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Elige la razon por la que deseas eliminar al empleado
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
                          <FormLabel>Fecha de baja</FormLabel>
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
                            <PopoverContent className="w-auto p-2" align="start">
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
                                  <SelectValue placeholder="Elegir ano" />
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
                                disabled={(date) =>
                                  date > new Date() || date < new Date('1900-01-01')
                                }
                                selected={new Date(field.value) || today}
                                onSelect={(e) => {
                                  field.onChange(e);
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Fecha en la que se termino el contrato
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-4 justify-end">
                      <Button variant="destructive" type="submit">
                        Eliminar
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
          <span className="sr-only">Abrir menu</span>
          <DotsVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Opciones</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.document_number)}>
          Copiar DNI
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href={`/dashboard/employee/action?action=view&employee_id=${user?.id}`}>
            Ver empleado
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          {role !== 'Invitado' && (
            <Link href={`/dashboard/employee/action?action=edit&employee_id=${user?.id}`}>
              Editar empleado
            </Link>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem>
          {role !== 'Invitado' && (
            <Fragment>
              {user.is_active ? (
                <Button
                  variant="destructive"
                  onClick={() => handleOpenModal(user?.document_number)}
                  className="text-sm"
                >
                  Dar de baja
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => handleOpenIntegerModal(user?.document_number)}
                  className="text-sm"
                >
                  Reintegrar Empleado
                </Button>
              )}
            </Fragment>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
