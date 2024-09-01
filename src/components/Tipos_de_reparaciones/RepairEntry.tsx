'use client';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { setVehiclesToShow } from '@/lib/utils/utils';
import { TypeOfRepair } from '@/types/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../ui/button';
import { CardTitle } from '../ui/card';
import { Form } from '../ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
type FormValues = {
  description: string;
  repair: string;
  provicionalId: string;
  domain: string;
}[];

export default function RepairNewEntry({
  tipo_de_mantenimiento,
  equipment,
  limittedEquipment,
  user_id,
}: {
  tipo_de_mantenimiento: TypeOfRepair;
  equipment: ReturnType<typeof setVehiclesToShow>;
  limittedEquipment?: boolean;
  user_id: string | undefined;
}) {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const router = useRouter()
  const FormSchema = z.object({
    provicionalId: z.string().default(crypto.randomUUID()),
    vehicle_id: z.string({
      required_error: 'Por favor selecciona un vehiculo',
    }),
    description: z
      .string({
        required_error: 'Por favor escribe una descripcion',
      })
      .min(3, { message: 'Intenta explicar con un poco mas de detalle' }),
    repair: z
      .string({
        required_error: 'Por favor selecciona una reparacion',
      })
      .min(1, { message: 'Debe seleccionar un tipo de reparacion' }),
    domain: z.string(),
  });
  const [allRepairs, setAllRepairs] = useState<FormValues>([]);

  function onSubmit(data: z.infer<typeof FormSchema>) {
    //Agregar la reparacion al otro formulario
    setAllRepairs((prev) => [...prev, data]);

    clearForm();
  }

  const createRepair = () => {
    toast.promise(
      async () => {
        try {
          const data = allRepairs.map((e) => {
            return {
              reparation_type: e.repair,
              equipment_id: equipment.find((equip) => equip.domain === e.domain)?.id,
              user_description: e.description,
              user_id,
            };
          });

          await fetch(`${URL}/api/repair_solicitud`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          router.refresh();
          clearForm()
          setAllRepairs([])
        } catch (error) {
          console.error(error);
        }
      },
      {
        loading: 'Creando tipo de reparación...',
        success: 'Tipo de reparación creado con éxito',
        error: 'Hubo un error al crear el tipo de reparación',
      }
    );
  };

  const clearForm = () => {
    form.setValue('description', '');
    form.setValue('repair', '');
  };

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const handleDeleteRepair = (provicionalId: string) => {
    setAllRepairs((prev) => prev.filter((e) => e.provicionalId !== provicionalId));
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="pt-6">
      <ResizablePanel>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-3 p-3">
                <FormField
                  control={form.control}
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Seleccionar equipo</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              disabled={limittedEquipment ? false : allRepairs.length > 0}
                              variant="outline"
                              role="combobox"
                              className={cn('justify-between', !field.value && 'text-muted-foreground')}
                            >
                              {field.value
                                ? equipment.find((equip) => equip.id === field.value)?.domain
                                : 'Selecciona un equipo'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className=" p-0">
                          <Command>
                            <CommandInput placeholder="Buscar equipo..." />
                            <CommandList>
                              <CommandEmpty>No se encontro el equipo</CommandEmpty>
                              <CommandGroup>
                                {equipment?.map((equip) => (
                                  <CommandItem
                                    value={equip.domain}
                                    key={equip.intern_number}
                                    onSelect={() => {
                                      form.setValue('vehicle_id', equip.id);
                                      form.setValue('domain', equip.domain);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        equip.id === field.value ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    {`${equip.domain} (Nº${equip.intern_number})`}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="repair"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>Selecciona un tipo de reparacion</FormLabel>
                        <Select key={field.value || ''} value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipos de reparaciones" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tipo_de_mantenimiento?.map((field) => {
                              return (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripcion</FormLabel>
                      <FormControl>
                        <Textarea
                          // key={field.value}
                          placeholder="Explica brevemente la reparacion"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-4 mt-2 justify-end pr-4">
                <Button type="submit" variant={'outline'}>
                  {' '}
                  Agregar reparacion
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel className="pl-6 min-w-[600px] flex flex-col gap-4" defaultSize={70}>
        <div className="flex flex-col gap-4">
          <CardTitle>Se registraran las siguientes reparaciones</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Nombre</TableHead>
                <TableHead className="w-[300px]">Descripcion</TableHead>
                <TableHead className="w-[300px]">Dominio</TableHead>
                <TableHead className="flex justify-end pr-14">Eliminar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRepairs.map((field) => {
                const repair = tipo_de_mantenimiento.find((e) => e.id === field.repair);
                console.log('repair', repair);
                console.log('field', field);
                return (
                  <TableRow key={field.provicionalId}>
                    <TableCell>{repair?.name}</TableCell>
                    <TableCell>{repair?.description}</TableCell>
                    <TableCell>{field.domain}</TableCell>
                    <TableCell align="right" className="pr-10">
                      <Button variant={'destructive'} onClick={() => handleDeleteRepair(field.provicionalId)}>
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {allRepairs.length > 0 && (
            <Button
              onClick={() => {
                createRepair();
              }}
              className="w-1/3 self-center mt-3"
            >
              Registrar solicitudes
            </Button>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
