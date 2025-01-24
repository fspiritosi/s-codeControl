'use client';

import { CreateDiagrams, UpdateDiagramsById } from '@/app/server/UPDATE/actions';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { FormItemDatePicker } from '../ui/FormItemDatePicker';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Form } from '../ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface ErrorToCreate {
  employee_name: string;
  day: number;
  month: number;
  year: number;
  event_diagram_name: string;
  prev_event: string;
  prev_diagram_entry_id: string;
}

interface DiagramaToCreate {
  day: number;
  month: number;
  year: number;
  employee_id?: string;
  diagram_type?: string;
  event_diagram_name?: string;
}

interface EmployeeDiagramWithDiagramTypeWithPrevDiagramType extends EmployeeDiagramWithDiagramType {
  prev_diagram_type: string | null;
}

function DiagramFormUpdated({
  employees,
  diagrams,
  diagrams_types,
  defaultId,
}: {
  employees: Employee[];
  diagrams: EmployeeDiagramWithDiagramType[];
  diagrams_types: DiagramType[];
  defaultId?: string;
}) {
  const [existingDiagrams, setExistingDiagrams] = useState<EmployeeDiagramWithDiagramType[]>([]);
  const [newDiagrams, setNewDiagrams] = useState<DiagramaToCreate[]>([]);
  const [errorsDiagrams, setErrorsDiagrams] = useState<ErrorToCreate[]>([]);
  const [succesDiagrams, setSuccesDiagrams] = useState<DiagramaToCreate[]>([]);
  const router = useRouter();
  const FormSchema = z.object({
    dateRange: z
      .object({
        from: z.date(),
        to: z.date(),
      })
      .refine((data) => data.from <= data.to, {
        message: 'La fecha de finalización no puede ser anterior a la fecha de inicio',
        path: ['to'],
      }),
    employee_id: z.string({
      required_error: 'Por favor selecciona un empleado',
    }),
    diagram_type: z.string({
      required_error: 'Por favor selecciona un tipo de diagrama',
    }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      dateRange: undefined,
      employee_id: defaultId || undefined,
    },
  });


  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const { employee_id, dateRange, diagram_type } = data;

    // Filtrar diagramas del empleado seleccionado
    const employeeDiagrams = diagrams.filter((diagram) => diagram.employee_id?.id === employee_id);

    // Generar todas las fechas entre dateRange.from y dateRange.to
    const startDate = moment(dateRange.from);
    const endDate = moment(dateRange.to);
    const dates = [];

    while (startDate.isSameOrBefore(endDate)) {
      dates.push({
        day: startDate.date(),
        month: startDate.month() + 1, // Los meses en moment.js son 0-indexed
        year: startDate.year(),
      });
      startDate.add(1, 'day');
    }

    // Consultar diagramas existentes y agruparlos
    const existing: EmployeeDiagramWithDiagramTypeWithPrevDiagramType[] = [];
    const newDates: { day: number; month: number; year: number; diagram_type: string; employee_id: string }[] = [];

    dates.forEach((date) => {
      const existingDiagram = employeeDiagrams.find(
        (diagram) => diagram.day === date.day && diagram.month === date.month && diagram.year === date.year
      );
      if (existingDiagram) {
        existing.push({ ...existingDiagram, prev_diagram_type: existingDiagram.diagram_type.name });
      } else {
        newDates.push({
          day: date.day,
          month: date.month,
          year: date.year,
          diagram_type,
          employee_id,
        });
      }
    });

    setExistingDiagrams(existing);
    setNewDiagrams(newDates);

    // Mapear los diagramas existentes y nuevos a los estados correspondientes
    const errors = existing
      // .filter((diagram) => diagram.diagram_type?.id !== form.getValues('diagram_type'))
      .map((diagram) => ({
        employee_name:
          employees.find((e) => e?.id === diagram.employee_id?.id)?.firstname +
          ' ' +
          employees.find((e) => e?.id === diagram.employee_id?.id)?.lastname,
        day: diagram.day,
        month: diagram.month,
        year: diagram.year,
        event_diagram_name: diagrams_types.find((type) => type?.id === form.getValues('diagram_type'))?.name || '',
        prev_event: diagram.prev_diagram_type || '',
        prev_diagram_entry_id: diagram?.id,
      }));

    const successes = newDates.map((date) => ({
      employee_name:
        employees.find((e) => e?.id === employee_id)?.firstname +
        ' ' +
        employees.find((e) => e?.id === employee_id)?.lastname,
      day: date.day,
      month: date.month,
      year: date.year,
      event_diagram_name: diagrams_types.find((type) => type?.id === diagram_type)?.name || '',
    }));

    setErrorsDiagrams(errors);
    setSuccesDiagrams(successes);

  };

  const updateDiagram = async (diagramToUpdate: ErrorToCreate) => {
    toast.promise(
      async () =>
        await UpdateDiagramsById([
          { diagram_type: form.getValues('diagram_type'), diagramId: diagramToUpdate.prev_diagram_entry_id },
        ]),

      {
        loading: 'Actualizando diagrama...',
        success: 'Diagrama actualizado correctamente',
        error: 'Error al actualizar el diagrama',
      }
    );
    //Eliminar el diagrama de la lista de errores
    setErrorsDiagrams((prev) => prev.filter((d) => d.prev_diagram_entry_id !== diagramToUpdate.prev_diagram_entry_id));
    if (defaultId) {
      router.refresh();
    }
  };

  const updateAll = async (diagramsToUpdate: ErrorToCreate[]) => {
    toast.promise(
      async () =>
        await UpdateDiagramsById(
          diagramsToUpdate.map((diagram) => ({
            diagram_type: form.getValues('diagram_type'),
            diagramId: diagram.prev_diagram_entry_id,
          }))
        ),
      {
        loading: 'Actualizando diagramas...',
        success: 'Diagramas actualizados correctamente',
        error: 'Error al actualizar los diagramas',
      }
    );
    //Eliminar todos los diagramas de la lista de errores
    setErrorsDiagrams([]);
    if (defaultId) {
      router.refresh();
    }
  };

  const createDiagram = (diagramToCreate: DiagramaToCreate) => {
    const { day, month, year } = diagramToCreate;

    toast.promise(
      async () =>
        await CreateDiagrams([
          {
            day,
            month,
            year,
            employee_id: form.getValues('employee_id'),
            diagram_type: form.getValues('diagram_type'),
          },
        ]),
      {
        loading: 'Creando diagrama...',
        success: 'Diagrama creado correctamente',
        error: 'Error al crear el diagrama',
      }
    );
    setSuccesDiagrams((prev) =>
      prev.filter(
        (d) => !(d.day === diagramToCreate.day && d.month === diagramToCreate.month && d.year === diagramToCreate.year)
      )
    );
    if (defaultId) {
      router.refresh();
    }
  };

  const createAll = (diagramsToCreate: DiagramaToCreate[]) => {
    toast.promise(
      async () =>
        await CreateDiagrams(
          diagramsToCreate.map((diagram) => ({
            day: diagram.day,
            month: diagram.month,
            year: diagram.year,
            employee_id: form.getValues('employee_id'),
            diagram_type: form.getValues('diagram_type'),
          }))
        ),
      {
        loading: 'Creando diagramas...',
        success: 'Diagramas creados correctamente',
        error: 'Error al crear los diagramas',
      }
    );
    setSuccesDiagrams([]);
    if (defaultId) {
      router.refresh();
    }
  };

  const descartarOne = (diagram: any, index: number, type: 'e' | 's') => {
    if (type === 'e') {
      setErrorsDiagrams((prev) => prev.filter((_, i) => i !== index));
    } else {
      setSuccesDiagrams((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const descartarAll = (type: 'e' | 's') => {
    if (type === 'e') {
      setErrorsDiagrams([]);
    } else {
      setSuccesDiagrams([]);
    }
  };
  // Dentro del componente DiagramFormUpdated
  useEffect(() => {
    if (
      form.getValues('diagram_type') &&
      form.getValues('employee_id') &&
      form.getValues('dateRange.from') &&
      form.getValues('dateRange.to')
    ) {
      const { employee_id, dateRange, diagram_type } = form.getValues();

      // Filtrar diagramas del empleado seleccionado
      const employeeDiagrams = diagrams.filter((diagram) => diagram.employee_id?.id === employee_id);

      // Generar todas las fechas entre dateRange.from y dateRange.to
      const startDate = moment(dateRange?.from);
      const endDate = moment(dateRange.to);
      const dates = [];

      while (startDate.isSameOrBefore(endDate)) {
        dates.push({
          day: startDate.date(),
          month: startDate.month() + 1, // Los meses en moment.js son 0-indexed
          year: startDate.year(),
        });
        startDate.add(1, 'day');
      }

      // Consultar diagramas existentes y agruparlos
      const existing: EmployeeDiagramWithDiagramTypeWithPrevDiagramType[] = [];
      const newDates: { day: number; month: number; year: number; diagram_type: string; employee_id: string }[] = [];

      dates.forEach((date) => {
        const existingDiagram = employeeDiagrams.find(
          (diagram) => diagram.day === date.day && diagram.month === date.month && diagram.year === date.year
        );
        if (existingDiagram) {
          existing.push({ ...existingDiagram, prev_diagram_type: existingDiagram.diagram_type.name });
        } else {
          newDates.push({
            day: date.day,
            month: date.month,
            year: date.year,
            diagram_type,
            employee_id,
          });
        }
      });

      setExistingDiagrams(existing);
      setNewDiagrams(newDates);

      // Mapear los diagramas existentes y nuevos a los estados correspondientes
      const errors = existing
        // .filter((diagram) => diagram.diagram_type?.id !== diagram_type)
        .map((diagram) => ({
          employee_name:
            employees.find((e) => e?.id === diagram.employee_id?.id)?.firstname +
            ' ' +
            employees.find((e) => e?.id === diagram.employee_id?.id)?.lastname,
          day: diagram.day,
          month: diagram.month,
          year: diagram.year,
          event_diagram_name: diagrams_types.find((type) => type?.id === diagram_type)?.name || '',
          prev_event: diagram.prev_diagram_type || '',
          prev_diagram_entry_id: diagram?.id,
        }));

      const successes = newDates.map((date) => ({
        employee_name:
          employees.find((e) => e?.id === employee_id)?.firstname +
          ' ' +
          employees.find((e) => e?.id === employee_id)?.lastname,
        day: date.day,
        month: date.month,
        year: date.year,
        event_diagram_name: diagrams_types.find((type) => type?.id === diagram_type)?.name || '',
      }));

      setErrorsDiagrams(errors);
      setSuccesDiagrams(successes);
    }
  }, [form.watch('diagram_type'), form.watch('employee_id'), form.watch('dateRange.from'), form.watch('dateRange.to')]);

  return (
    <ResizablePanelGroup direction="horizontal" className="pt-6">
      <ResizablePanel className="">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col space-y-3 px-2">
              <FormField
                control={form.control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empleado</FormLabel>
                    <Select
                      disabled={defaultId ? true : false}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un empleado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee?.id} value={employee?.id.toString()}>
                            {employee.lastname.charAt(0).toUpperCase() + employee.lastname.slice(1)},{' '}
                            {employee.firstname.charAt(0).toUpperCase() + employee.firstname.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diagram_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de diagrama</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo de diagrama" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {diagrams_types.map((type) => (
                          <SelectItem key={type?.id} value={type?.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItemDatePicker
                name="dateRange"
                control={form.control}
                label="Fechas del diagrama"
                description="Selecciona el rango de fechas para diagrama"
              />
            </div>

            <Button type="button" onClick={() => form.handleSubmit(onSubmit)()} className="mt-4">
              Generar diagramas
            </Button>
          </form>
        </Form>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel className="pl-6 min-w-[600px] flex flex-col gap-4" defaultSize={70}>
        {errorsDiagrams.length > 0 && (
          <Card className="bg-red-50">
            <CardHeader>
              <CardTitle>Diagramas duplicados</CardTitle>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableHead>Nombre Empleado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Novedad Actual</TableHead>
                  <TableHead>Novedad Registrada</TableHead>
                  <TableHead></TableHead>
                </TableHeader>
                {errorsDiagrams.map((d, index: number) => (
                  <TableBody key={crypto.randomUUID()}>
                    <TableRow>
                      <TableCell>{d.employee_name}</TableCell>
                      <TableCell>
                        {d.day}/{d.month}/{d.year}
                      </TableCell>
                      <TableCell>{d.event_diagram_name}</TableCell>
                      <TableCell>{d.prev_event}</TableCell>
                      <TableCell className="flex gap-2 justify-around">
                        <Button variant={'default'} onClick={() => updateDiagram(d)}>
                          Actualizar
                        </Button>
                        <Button
                          variant={'link'}
                          className="font-bold text-red-600"
                          onClick={() => descartarOne(d, index, 'e')}
                        >
                          Descartar
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ))}
              </Table>
            </CardContent>
            {errorsDiagrams.length > 1 && (
              <CardFooter className="flex justify-around">
                <Button variant={'default'} onClick={() => updateAll(errorsDiagrams)}>
                  Actualizar Todos
                </Button>
                <Button variant={'link'} className="font-bold text-red-600" onClick={() => descartarAll('e')}>
                  Descartar Todos
                </Button>
              </CardFooter>
            )}
          </Card>
        )}
        {succesDiagrams.length > 0 && (
          <Card className="">
            <CardHeader>
              <CardTitle>Diagramas correctos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableHead>Nombre Empleado</TableHead>
                  <TableHead>Novedad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead></TableHead>
                </TableHeader>
                {succesDiagrams.map((d, index: number) => (
                  <TableBody key={crypto.randomUUID()}>
                    <TableRow>
                      <TableCell>
                        {employees.find((e) => e?.id === form.getValues('employee_id'))?.firstname +
                          ' ' +
                          employees.find((e) => e?.id === form.getValues('employee_id'))?.lastname}
                      </TableCell>
                      <TableCell>
                        {diagrams_types.find((type) => type?.id === form.getValues('diagram_type'))?.name || ''}
                      </TableCell>
                      <TableCell>
                        {d.day}/{d.month}/{d.year}
                      </TableCell>
                      <TableCell className="flex gap-2 justify-around">
                        <Button variant={'success'} onClick={() => createDiagram(d)}>
                          Crear
                        </Button>
                        <Button
                          variant={'link'}
                          className="font-bold text-red-600"
                          onClick={() => descartarOne(d, index, 's')}
                        >
                          Descartar
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ))}
              </Table>
            </CardContent>
            {succesDiagrams.length > 1 && (
              <CardFooter className="flex justify-around">
                <Button variant={'success'} onClick={() => createAll(succesDiagrams)}>
                  Crear Todos
                </Button>
                <Button variant={'link'} className="font-bold text-red-600" onClick={() => descartarAll('s')}>
                  Descartar Todos
                </Button>
              </CardFooter>
            )}
          </Card>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default DiagramFormUpdated;
