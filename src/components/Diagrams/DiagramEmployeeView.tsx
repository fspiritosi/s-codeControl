'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { DropdownMenuCheckboxItemProps } from '@radix-ui/react-dropdown-menu';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from '../ui/form';

type Checked = DropdownMenuCheckboxItemProps['checked'];
type DiamgramParsed = {
  name: string;
  lastName: string;
  diagram_type: string;
  date: string;
};

function DiagramEmployeeView({
  diagrams,
  activeEmployees,
  className,
}: {
  diagrams: any;
  activeEmployees: any;
  className?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 30),
  });
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [filteredResources, setFilteredResources] = useState(activeEmployees);
  const [inputValue, setInputValue] = useState<string>('');

  const fechaInicio = date?.from;
  const fechaFin = date?.to;

  /*---------------------INICIO ESQUEMA EMPLEADOS---------------------------*/
  const formSchema = z.object({
    resources: z
      .array(z.string(), { required_error: 'Los recursos son requeridos' })
      .min(1, 'Selecciona al menos 1 recursos'),
    //! Cambiar a 1 si se necesita que sea solo uno
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resources: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const resourceId = selectedResources?.map((resource) => {
      const employee = activeEmployees.find((element: any) => {
        return element.document === resource;
      });
      return setSelectedResources(employee?.id);
    });
  }

  /*---------------------FIN ESQUEMA EMPLEADOS------------------------------*/

  function generarDiasEntreFechas({ fechaInicio, fechaFin }: { fechaInicio?: Date; fechaFin?: Date }) {
    const dias = [];
    let fechaActual = new Date(fechaInicio!);

    while (fechaActual <= new Date(fechaFin!)) {
      dias.push(new Date(fechaActual));
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return dias;
  }

  const groupedDiagrams = diagrams.reduce((acc: any, diagram: any) => {
    if (!acc[diagram.employee_id]) {
      acc[diagram.employee_id] = [];
    }
    acc[diagram.employee_id].push(diagram);
    return acc;
  }, {});

  const mes = generarDiasEntreFechas({ fechaInicio, fechaFin });

  console.log(filteredResources);
  console.log(selectedResources);

  useEffect(() => {
    form.reset();
    setSelectedResources([]);
  }, [activeEmployees]);

  return (
    <div>
      <div className="py-2 w-full flex justify-around">
        <>
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="resources"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn('justify-between', !field.value && 'text-muted-foreground')}
                            >
                              {`${selectedResources.length || '0'} empleados seleccionados`}
                              <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className=" p-0">
                          <Command>
                            <CommandInput
                              placeholder="Buscar recursos..."
                              className="h-9"
                              onFocus={() => {
                                setFilteredResources(activeEmployees);
                              }}
                              onInput={(e) => {
                                const inputValue = (e.target as HTMLInputElement).value.toLowerCase();
                                setInputValue(inputValue);
                                const isNumberInput = /^\d+$/.test(inputValue);

                                const filteredresources = activeEmployees?.filter((person: any) => {
                                  if (isNumberInput) {
                                    return person.document.includes(inputValue);
                                  } else {
                                    return (
                                      person.name.toLowerCase().includes(inputValue) ||
                                      person.document.includes(inputValue)
                                    );
                                  }
                                });
                                setFilteredResources(filteredresources);
                              }}
                            />
                            <CommandEmpty>No se encontraron recursos con ese nombre o documento</CommandEmpty>
                            <CommandGroup>
                              {filteredResources?.map((person: any) => {
                                //const key = /^\d+$/.test(inputValue) ? person.document : person.name;
                                const key = /^\d+$/.test(inputValue) ? person.id : person.full_name;

                                //const value = /^\d+$/.test(inputValue) ? person.document : person.name;
                                const value = /^\d+$/.test(inputValue) ? person.id : person.full_name;

                                return (
                                  <CommandItem
                                    value={value}
                                    key={key}
                                    onSelect={() => {
                                      const updatedResources = selectedResources.includes(person.id)
                                        ? selectedResources?.filter((resource) => resource !== person.id)
                                        : [...selectedResources, person.id];

                                      setSelectedResources(updatedResources);
                                      form.setValue('resources', updatedResources);
                                    }}
                                  >
                                    {person.full_name}
                                    <CheckIcon
                                      className={cn(
                                        'ml-auto h-4 w-4',
                                        selectedResources?.includes(person.id) ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>{` Selecciona al menos 1 recurso para ver su diagrama.`}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </>
        <div className={cn('grid gap-2', className)}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn('w-[300px] justify-start text-left font-normal', !date && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'dd/MM/yyyyy', { locale: es })} -{' '}
                      {format(date.to, 'dd/MM/yyyyy', { locale: es })}
                    </>
                  ) : (
                    format(date.from, 'dd/MM/yyyyy', { locale: es })
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableHead>Empleado</TableHead>
          {mes.map((d, index) => (
            <TableHead key={index} className="text-center">
              {d.getDate() + '/' + (d.getMonth() + 1)}
            </TableHead>
          ))}
        </TableHeader>

        <TableBody>
          {selectedResources.length > 0 &&
            Object.keys(groupedDiagrams)
              .filter((employeeId) => selectedResources.includes(employeeId))
              .map((employeeId, index) => {
                const employeeDiagrams = groupedDiagrams[employeeId];
                const employee = employeeDiagrams[0].employees; // Asumimos que todos los diagramas tienen el mismo empleado
                return (
                  <TableRow key={index}>
                    <TableCell>
                      {employee.lastname}, {employee.firstname}
                    </TableCell>
                    {mes.map((day, dayIndex) => {
                      const diagram = employeeDiagrams.find(
                        (diagram: any) =>
                          diagram.day === day.getDate() &&
                          diagram.month === day.getMonth() + 1 &&
                          diagram.year === day.getFullYear()
                      );
                      return (
                        <TableCell
                          key={dayIndex}
                          className="text-center border"
                          style={{ backgroundColor: diagram?.diagram_type.color }}
                        >
                          {diagram?.diagram_type.short_description}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </div>
  );
}

export default DiagramEmployeeView;
