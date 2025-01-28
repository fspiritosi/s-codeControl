'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function DiagramForm({
  activeEmploees,
  diagrams_types,
  diagrams,
  defaultId,
}: {
  diagrams: any[];
  activeEmploees: [];
  diagrams_types: [];
  defaultId?: string;
}) {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [duration, setDuration] = useState<number>(0);
  const [succesDiagrams, setSuccesDiagrams] = useState<DiagramaToCreate[]>([]);
  const [errorsDiagrams, setErrorsDiagrams] = useState<ErrorToCreate[]>([]);
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const router = useRouter();
  useEffect(() => {
    if (fromDate && toDate) {
      const diferenciaMilisegundos = toDate.getTime() - fromDate.getTime();
      const milisegundosPorDia = 1000 * 60 * 60 * 24;
      const diferenciaDias = diferenciaMilisegundos / milisegundosPorDia;
      setDuration(Math.ceil(diferenciaDias) + 1);
    } else {
      setDuration(0);
    }
  }, [fromDate && toDate]);

  // const Diagram = z.object({
  //   employee: z.string().min(1, { message: 'Debe selecciónar un empleado' }),
  //   event_diagram: z.string().min(1, { message: 'Debe selecciónar un tipo de novedad' }),
  //   initial_date: z.date(),
  //   finaly_date: z.date()
  // });
  const Diagram = z
    .object({
      employee: z.string().min(1, { message: 'Debe seleccionar un empleado' }),
      event_diagram: z.string().min(1, { message: 'Debe seleccionar un tipo de novedad' }),
      initial_date: z.date(),
      finaly_date: z.date(),
    })
    .refine((data) => data.finaly_date >= data.initial_date, {
      message: 'La fecha final no puede ser menor que la fecha inicial',
      path: ['finaly_date'], // Indica que el error está en el campo finaly_date
    });

  type Diagram = z.infer<typeof Diagram>;

  type DiagramaToCreate = {
    employee: string;
    employee_name: string;
    event_diagram: string;
    event_diagram_name: string;
    day: number;
    month: number;
    year: number;
  };
  type ErrorToCreate = {
    id: string;
    employee: string;
    employee_name: string;
    event_diagram: string;
    event_diagram_name: string;
    day: number;
    month: number;
    year: number;
    prev_event?: string;
  };

  const form = useForm<Diagram>({
    resolver: zodResolver(Diagram),
    defaultValues: {
      employee: defaultId || '',
      event_diagram: '',
      initial_date: new Date(),
      finaly_date: new Date(),
    },
  });

  //CREA UN SOLO REGISTRO EN LA BASE DE DATOS
  async function createDiagram(values: DiagramaToCreate) {
    const data = values;
    toast.promise(
      async () => {
        const valueToSend = JSON.stringify(values);
        const response = await fetch(`${URL}/api/employees/diagrams`, { method: 'POST', body: valueToSend });
        return response;
      },
      {
        loading: 'Cargando...',
        success: `Se creo la novedad de ${data.employee_name} para el empleado ${data.event_diagram_name} para el día ${data.day}/${data.month}/${data.year}`,
        error: 'No se pudo crear la novedad',
      }
    );
    // Filtrar el evento específico de succesDiagrams
    setSuccesDiagrams(
      succesDiagrams.filter(
        (diagram) =>
          diagram.employee !== data.employee ||
          diagram.year !== data.year ||
          diagram.month !== data.month ||
          diagram.day !== data.day
      )
    );
    router.refresh();
  }
  //CREA TODOS LOS REGISTROS EN LA BASE DE DATOS
  function createAll(data: DiagramaToCreate[]) {
    //console.log(data);
    data.map((novedad) => {
      try {
        createDiagram(novedad);
        setSuccesDiagrams([]);
      } catch (error) {
        console.log(error);
      }
    });
    router.refresh();
  }

  //ACTUALIZA UN REGISTRO EN LA BASE DE DATOS
  async function updateDiagram(values: ErrorToCreate) {
    const data = values;
    //console.log(data);
    toast.promise(
      async () => {
        console.log(values, 'values');
        const valueToSend = JSON.stringify(values);
        const response = await fetch(`${URL}/api/employees/diagrams`, { method: 'PUT', body: valueToSend });
        return response;
      },
      {
        loading: 'Cargando...',
        success: `Se actualizó la novedad de ${data.employee_name} para el empleado ${data.event_diagram_name} para el día ${data.day}/${data.month}/${data.year}`,
        error: 'No se pudo actualizar la novedad',
      }
    );
    // Filtrar el evento específico de succesDiagrams
    setErrorsDiagrams(
      errorsDiagrams.filter(
        (diagram) =>
          diagram.employee !== data.employee ||
          diagram.year !== data.year ||
          diagram.month !== data.month ||
          diagram.day !== data.day
      )
    );
    router.refresh();
  }

  //ACTUALIZA TODOS LOS REGISTROS EN LA BASE DE DATOS
  async function updateAll(data: ErrorToCreate[]) {
    data.map((novedad) => {
      try {
        updateDiagram(novedad);
        setErrorsDiagrams([]);
      } catch (error) {
        console.log(error);
      }
    });
    router.refresh();
  }
  //DESCARTAR UN SOLO REGISTRO DEL ARRAY CORRESPONDIENTE
  function descartarOne(data: any, index: number, from: string) {
    // Filtrar el elemento específico por índice en succesDiagrams
    if (from === 's') {
      const successDiagramDeleteOne = succesDiagrams.filter((_, i) => i !== index);
      // Actualizar los estados solo si hay cambios
      if (successDiagramDeleteOne.length !== succesDiagrams.length) {
        setSuccesDiagrams(successDiagramDeleteOne);
      }
    }

    if (from === 'e') {
      // Filtrar el elemento específico por índice en errorsDiagrams
      const errorDiagramDeleteOne = errorsDiagrams.filter((_, i) => i !== index);

      if (errorDiagramDeleteOne.length !== errorsDiagrams.length) {
        setErrorsDiagrams(errorDiagramDeleteOne);
      }
    }
  }
  //DESCARTAR TODOS LOS REGISTROS DEL ARRAY CORRESPONDIENTE
  function descartarAll(from: string) {
    if (from === 's') {
      setSuccesDiagrams([]);
    }

    if (from === 'e') {
      setErrorsDiagrams([]);
    }
  }

  async function onSubmit2(values: Diagram) {
    const data = values;
    const tipoDeDiagrama: any = diagrams_types.find((d: any) => d.id === data.event_diagram);
    const employee: any = activeEmploees.find((e: any) => e.id === data.employee);

    const diagramasToCreate: DiagramaToCreate[] = [];
    const errorToCreate: ErrorToCreate[] = [];

    //función para armar dia por día.

    for (let i = values.initial_date; i <= values.finaly_date; i.setDate(i.getDate() + 1)) {
      let element = {
        employee: values.employee,
        employee_name: employee.full_name,
        event_diagram: values.event_diagram,
        event_diagram_name: tipoDeDiagrama.name,
        day: i.getDate(),
        month: i.getMonth() + 1,
        year: i.getFullYear(),
      };

      let checkExist: any = diagrams.find(
        (d: any) =>
          d.employee_id === element.employee &&
          d.year === element.year &&
          d.month === element.month &&
          d.day === element.day
      );

      if (checkExist) {
        const prevEventName: any = diagrams_types.find((d: any) => d.id === checkExist?.diagram_type.id);

        let errorElement = {
          ...element,
          prev_event: prevEventName.name,
          id: checkExist.id,
        };
        errorToCreate.push(errorElement);
      } else {
        diagramasToCreate.push(element);
      }
    }
    setSuccesDiagrams([...succesDiagrams, ...diagramasToCreate]);
    setErrorsDiagrams([...errorsDiagrams, ...errorToCreate]);
  }

  console.log('errors',form.formState.errors);

  return (
    <ResizablePanelGroup direction="horizontal" className="pt-6">
      <ResizablePanel>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit2)} className="space-y-8">
            <FormField
              control={form.control}
              name="employee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empleado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={defaultId ? true : false} className="w-[400px]">
                        <SelectValue placeholder="Elegir empleado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeEmploees?.map((e: any) => (
                        <SelectItem value={e.id} key={e.id}>
                          {e.full_name}
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
              name="event_diagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novedad</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[400px]">
                        <SelectValue placeholder="Elegir novedad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {diagrams_types?.map((n: any) => (
                        <SelectItem value={n.id} key={n.id}>
                          {n.name}
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
              name="initial_date"
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-4 items-center w-[400px] justify-between">
                    <FormLabel>Fecha de inicio</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-[240px] pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? field.value.toLocaleDateString() : 'Elegir fecha'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setFromDate(date);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="finaly_date"
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-4 items-center w-[400px] justify-between">
                    <FormLabel className="mr-4">Fecha de fin</FormLabel>
                    <FormControl className="w-[400px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-[240px] pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? field.value.toLocaleDateString() : 'Elegir fecha'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setToDate(date);
                            }}
                            disabled={(date) => date < fromDate!}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {duration === 0 ? (
              <></>
            ) : duration === 1 ? (
              <div>
                <Label>La novedad dura: {duration} día</Label>
              </div>
            ) : (
              <div>
                <Label>La novedad dura: {duration} días</Label>
              </div>
            )}
            <Button
              className="mt-4"
              type="button"
              onClick={() => {
                // Verificar que el formulario sea válido
                form.handleSubmit(
                  async (values) => {
                    await onSubmit2(values);
                  },
                  (errors) => {
                    console.log(errors);
                  }
                );
              }}
            >
              Comprobar novedades
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
                {errorsDiagrams.map((d: ErrorToCreate, index: number) => (
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
                {succesDiagrams.map((d: DiagramaToCreate, index: number) => (
                  <TableBody key={crypto.randomUUID()}>
                    <TableRow>
                      <TableCell>{d.employee_name}</TableCell>
                      <TableCell>{d.event_diagram_name}</TableCell>
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
