'use client';

import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/shared/components/ui/dialog';
import { AlertDialogFooter } from '@/shared/components/ui/alert-dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import BackButton from '@/shared/components/common/BackButton';
import { UseFormReturn } from 'react-hook-form';

interface EmployeeTerminationDialogProps {
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  form2: UseFormReturn<any>;
  onDelete: (values: any) => Promise<void>;
  today: Date;
  month: Date;
  setMonth: (v: Date) => void;
  yearsAhead: number[];
  years: string;
  setYear: (v: string) => void;
}

export function EmployeeTerminationDialog({
  showModal,
  setShowModal,
  form2,
  onDelete,
  today,
  month,
  setMonth,
  yearsAhead,
  years,
  setYear,
}: EmployeeTerminationDialogProps) {
  return (
    <>
      <Dialog onOpenChange={() => setShowModal(!showModal)}>
        <DialogTrigger asChild>
          <Button variant="destructive">Dar de baja</Button>
        </DialogTrigger>
        <BackButton />
        <DialogContent className="dark:bg-slate-950">
          <DialogTitle>Dar de baja</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar este empleado?
            <br /> Completa los campos para continuar.
          </DialogDescription>
          <AlertDialogFooter>
            <div className="w-full">
              <Form {...form2}>
                <form onSubmit={form2.handleSubmit(onDelete)} className="space-y-8">
                  <FormField
                    control={form2.control}
                    name="reason_for_termination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo de baja</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona la razón" />
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
                          Elige la razón por la que deseas eliminar al empleado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form2.control}
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
                        <FormDescription>Fecha en la que se terminó el contrato</FormDescription>
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
          </AlertDialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
