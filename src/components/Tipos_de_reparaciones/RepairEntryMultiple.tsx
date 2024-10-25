'use client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';

import { setVehiclesToShow } from '@/lib/utils/utils';
import { TypeOfRepair } from '@/types/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { ReaderIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiTool } from 'react-icons/fi';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CardTitle } from '../ui/card';
import { Form } from '../ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { criticidad } from './RepairSolicitudesTable/data';
type FormValues = {
  description: string;
  repair: string;
  provicionalId: string;
  domain: string;
  kilometer: string;
  vehicle_id: string;
}[];

export default function RepairNewEntryMultiple({
  tipo_de_mantenimiento,
  equipment,
  limittedEquipment,
  user_id,
  default_equipment_id,
  employee_id,
  onReturn,
}: {
  tipo_de_mantenimiento: TypeOfRepair;
  equipment: ReturnType<typeof setVehiclesToShow>;
  limittedEquipment?: boolean;
  user_id?: string | undefined;
  default_equipment_id?: string;
  employee_id?: string | undefined;
  onReturn?: () => void;
}) {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const router = useRouter();
  const [allRepairs, setAllRepairs] = useState<FormValues>([]);
  const FormSchema = z.object({
    provicionalId: z.string().default(crypto.randomUUID()),
    vehicle_id: z.array(z.string()).default([]),
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
    user_images: z.array(z.string().default('')).default([]),
    files: z.array(z.any()).optional(),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      vehicle_id: [],
      domain: equipment?.find((equip) => equip.id === default_equipment_id)?.domain || '',
    },
  });
  const [images, setImages] = useState<(string | null)[]>([null, null, null]);
  const [files, setFiles] = useState<(File | undefined)[]>([undefined, undefined, undefined]);

  const verifyIfExistOpenRepairSolicitud = async (repairTypeId: string, vehiclesIds: string[]) => {
    const domainsOrSeries = vehiclesIds.map(
      (id) => equipment.find((equip) => equip.id === id)?.domain || equipment.find((equip) => equip.id === id)?.serie
    );

    const hasOpenRepair = allRepairs.filter((e) => domainsOrSeries.includes(e.domain) && e.repair === repairTypeId);

    if (hasOpenRepair.length > 0) {
      toast.error(
        `Los equipos con los siguientes dominios o series ya tienen una solicitud de reparacion a ser registrada ${hasOpenRepair
          .map((e) => e.domain)
          .join(', ')}`
      );
      return true;
    }

    //Consultar en la base de datos si ya existe una solicitud de reparacion abierta para alguno de los vehiculos
    const { data, error: errorAllRepairs } = await supabase
      .from('repair_solicitudes')
      .select('*,equipment_id(*)')
      .in('equipment_id', vehiclesIds)
      .eq('reparation_type', repairTypeId)
      .neq('state', 'Cancelado')
      .neq('state', 'Finalizado')
      .neq('state', 'Rechazado');

    if (errorAllRepairs) {
      console.error(errorAllRepairs);
    }

    if (data?.length ?? 0 > 0) {
      //console.log('dadadad', data);
      toast.error(
        `
        El equipo con dominio o serie "${(data?.[0].equipment_id as any).domain || (data?.[0].equipment_id as any).serie}" ya tiene una solicitud de reparacion con los mismos datos en estado ${data?.[0].state}`
      );
      return true; // Indica que se encontró una solicitud abierta
    }

    return false; // Indica que no se encontró una solicitud abierta
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    //Agregar la reparacion al otro formulario
    const hasOpenRepair = await verifyIfExistOpenRepairSolicitud(data.repair, data.vehicle_id);

    // Si se encontró una reparación abierta, detener la ejecución
    if (hasOpenRepair) {
      return;
    }

    data.vehicle_id.forEach((vehicle_id) => {
      setAllRepairs((prev) => [
        ...prev,
        {
          ...data,
          domain:
            equipment.find((equip) => equip.id === vehicle_id)?.domain ||
            equipment.find((equip) => equip.id === vehicle_id)?.serie ||
            '',
          kilometer: equipment.find((equip) => equip.id === vehicle_id)?.kilometer || '',
          vehicle_id,
        },
      ]);
    });
  }

  const handleCardClick = (index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      // const files
      if (file) {
        const newFiles = [...files];
        newFiles[index] = file;
        setFiles(newFiles);
        const reader = new FileReader();
        reader.onload = () => {
          const newImages = [...images];
          newImages[index] = reader.result as string;
          setImages(newImages);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const supabase = supabaseBrowser();
  const createRepair = async () => {
    toast.promise(
      async () => {
        try {
          // Obtener los IDs de los equipos seleccionados
          const selectedEquipmentIds = form.getValues('vehicle_id');

          // Crear un array para almacenar todas las reparaciones
          const data = allRepairs.map((repair) => ({
            reparation_type: repair.repair,
            equipment_id: repair.vehicle_id,
            user_description: repair.description,
            user_id,
            state: 'Pendiente',
            employee_id,
            kilometer: repair.kilometer,
          }));

          // Verificar la criticidad de las reparaciones y actualizar la condición del equipo en la base de datos
          for (const equipmentId of selectedEquipmentIds) {
            const repairsForEquipment = data.filter((repair) => repair.equipment_id === equipmentId);
            const currentEquipmentKilometer = equipment.find((equip) => equip.id === equipmentId)?.kilometer;

            const hasHighCriticity = repairsForEquipment.some((e) => {
              const repair = tipo_de_mantenimiento.find((repair) => repair.id === e.reparation_type);
              return repair?.criticity === 'Alta';
            });

            const hasMediumCriticity = repairsForEquipment.some((e) => {
              const repair = tipo_de_mantenimiento.find((repair) => repair.id === e.reparation_type);
              return repair?.criticity === 'Media';
            });

            const equipmentItem = equipment.find((equip) => equip.id === equipmentId);
            const condition = equipmentItem?.condition;

            if (hasHighCriticity && condition !== 'no operativo' && condition !== 'en reparación') {
              await supabase
                .from('vehicles')
                .update({ condition: 'no operativo', kilometer: currentEquipmentKilometer })
                .eq('id', equipmentId);
            } else if (hasMediumCriticity && condition !== 'no operativo' && condition !== 'en reparación') {
              await supabase
                .from('vehicles')
                .update({ condition: 'operativo condicionado', kilometer: currentEquipmentKilometer })
                .eq('id', equipmentId);
            }
          }

          // Enviar las reparaciones a la API
          await fetch(`${URL}/api/repair_solicitud`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          // Refrescar la página y limpiar el formulario
          router.refresh();
          clearForm();
          setAllRepairs([]);
          if (employee_id && onReturn) {
            onReturn();
          }
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
    setImages([null, null, null]);
    setFiles([undefined, undefined, undefined]);
  };

  const handleDeleteRepair = (vehicle_id: string, repair_id: string) => {
    setAllRepairs((prev) => prev.filter((e) => !(e.vehicle_id === vehicle_id && e.repair === repair_id)));
  };
  const vehicle = equipment.find(
    (equip) => equip.domain === form.getValues('domain') || equip.serie === form.getValues('domain')
  );
  const [selectedEquipmentss, setSelectedEquipmentss] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  //console.log(form.formState.errors);

  return (
    <ResizablePanelGroup direction="horizontal" className="pt-6 flex flex-wrap sm:flex-nowrap w-full">
      <ResizablePanel className="sm:min-w-[280px] min-w-full">
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-3 p-3 w-full">
                <FormField
                  control={form.control}
                  name="repair"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Selecciona un tipo de reparación</FormLabel>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn('justify-between', !field.value && 'text-muted-foreground')}
                            >
                              {field.value
                                ? tipo_de_mantenimiento.find((item) => item.id === field.value)?.name
                                : 'Tipos de reparaciones'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Command>
                            <CommandInput placeholder="Buscar tipo de reparación..." />
                            <CommandList>
                              <CommandEmpty>No se encontró ningún tipo de reparación.</CommandEmpty>
                              <CommandGroup>
                                {tipo_de_mantenimiento.map((item) => (
                                  <CommandItem
                                    value={item.name}
                                    key={item.id}
                                    onSelect={() => {
                                      form.setValue('repair', item.id);
                                      setOpen(false); // Cierra el Popover
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        item.id === field.value ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    {item.name}
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
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Seleccionar equipos</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn('justify-between', !field.value && 'text-muted-foreground')}
                            >
                              {`${selectedEquipmentss?.length || '0'} equipos seleccionados`}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Command>
                            <CommandInput placeholder="Buscar equipo..." />
                            <CommandList>
                              <CommandEmpty>No se encontró el equipo</CommandEmpty>
                              <CommandGroup>
                                {equipment?.map((equip) => {
                                  const isSelected = selectedEquipmentss?.includes(equip.id);
                                  return (
                                    <CommandItem
                                      value={equip.domain ?? equip.serie}
                                      key={equip.intern_number}
                                      onSelect={() => {
                                        const updatedEquipment = isSelected
                                          ? selectedEquipmentss?.filter((id) => id !== equip.id)
                                          : [...selectedEquipmentss, equip.id];

                                        setSelectedEquipmentss(updatedEquipment);
                                        form.setValue('vehicle_id', updatedEquipment);
                                      }}
                                    >
                                      <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                                      {`${equip.domain ?? equip.serie} (Nº${equip.intern_number})`}
                                    </CommandItem>
                                  );
                                })}
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

                <Carousel
                  opts={{
                    align: 'start',
                  }}
                  className="w-full"
                >
                  Imagenes de la reparacion
                  <CarouselContent>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <CarouselItem key={crypto.randomUUID()} className="basis-1/3 ">
                        <div className="p-1">
                          <Card className="hover:cursor-pointer" onClick={() => handleCardClick(index)}>
                            <CardContent className="flex aspect-square items-center justify-center p-1">
                              {images[index] ? (
                                <img
                                  src={images[index] || ''}
                                  alt={`Imagen ${index + 1}`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <span className="text-3xl font-semibold">{index + 1}</span>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
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
      <ResizableHandle withHandle className="hidden sm:flex" />
      <ResizablePanel className="pl-6 min-w-[600px] hidden sm:flex w-full" defaultSize={70}>
        <div className="flex flex-col gap-4 w-full ">
          <CardTitle>Se registraran las siguientes reparaciones</CardTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Nombre</TableHead>
                <TableHead className="w-[300px]">Descripcion</TableHead>
                <TableHead className="w-[300px]">Dominio o Serie</TableHead>
                <TableHead className="w-[300px]">Kilometros</TableHead>
                <TableHead className="flex justify-end pr-14">Eliminar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="overflow-x-auto">
              {allRepairs.map((field) => {
                const repair = tipo_de_mantenimiento.find((e) => e.id === field.repair);
                return (
                  <TableRow key={crypto.randomUUID()}>
                    <TableCell>
                      <div className="flex items-center justify-between gap-3">{repair?.name}</div>
                    </TableCell>
                    <TableCell>{repair?.description}</TableCell>
                    <TableCell>{field.domain}</TableCell>
                    <TableCell>{equipment.find((equip) => equip.id === field.vehicle_id)?.kilometer || ''}</TableCell>
                    <TableCell align="right" className="pr-10">
                      <Button
                        variant={'destructive'}
                        onClick={() => {
                          // console.log('field', field);
                          // console.log('allRepairs', allRepairs);
                          handleDeleteRepair(field.vehicle_id, field.repair);
                        }}
                      >
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
      <ResizablePanel className=" min-w-[250px] sm:hidden" defaultSize={70}>
        <div className="">
          <Separator></Separator>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              {/* <CardTitle className="text-2xl font-bold">{repair?.name}</CardTitle> */}
              {/* <Badge variant="outline" className="text-sm">
                {repair?.criticity}
              </Badge> */}
            </CardHeader>
            <CardContent className="grid p-0 gap-4 overflow-x-auto w-full">
              <div className="flex p-2  gap-3 flex-wrap">
                {vehicle?.picture && (
                  <div className="relative w-24 h-24 rounded-md overflow-hidden">
                    <Image src={vehicle?.picture} alt={`Vehicle ${vehicle?.domain}`} layout="fill" objectFit="cover" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Vehiculo: {vehicle?.domain}</p>
                  <p className="text-sm text-muted-foreground">Numero interno: {vehicle?.intern_number}</p>
                  <p className="text-sm text-muted-foreground">Año: {vehicle?.year}</p>
                  <p className="text-sm text-muted-foreground">Condicion: {vehicle?.condition}</p>
                </div>
                <ul className="w-full">
                  {allRepairs.map((field, index) => {
                    const repair = tipo_de_mantenimiento.find((e) => e.id === field.repair);
                    const maintenance = tipo_de_mantenimiento.find((e) => e.id === field.repair);
                    const priority = criticidad.find((priority) => priority.value === repair?.criticity);
                    const badgeVariant =
                      repair?.criticity === 'Baja'
                        ? 'success'
                        : repair?.criticity === 'Media'
                          ? 'yellow'
                          : ('destructive' as
                              | 'success'
                              | 'default'
                              | 'destructive'
                              | 'outline'
                              | 'secondary'
                              | 'yellow'
                              | 'red'
                              | null
                              | undefined);
                    return (
                      <Accordion type="single" collapsible key={crypto.randomUUID()}>
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="active:no-underline focus:no-underline">
                            {' '}
                            <div className="flex flex-row items-center w-full justify-between space-y-0 pb-2 mr-2">
                              <div className="flex gap-2">
                                <CardDescription>{repair?.name}</CardDescription>
                                <Badge variant={badgeVariant} className="font-bold">
                                  {' '}
                                  {priority?.icon && <priority.icon className="mr-2 h-4 w-4 font-bold" />}
                                  {repair?.criticity}
                                </Badge>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <li key={crypto.randomUUID()} className="">
                              <CardContent className="grid p-0 gap-4 overflow-x-auto w-full">
                                <div className="flex flex-col ">
                                  <div className="flex items-center">
                                    <FiTool className="mr-2 h-4 w-4" />
                                    <span className="text-sm">
                                      Tipo de mantenimiento: {maintenance?.type_of_maintenance}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <FiTool className="mr-2 h-4 w-4" />
                                    <span className="text-sm">Nombre: {maintenance?.name}</span>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <ReaderIcon className="mr-2 h-4 w-4" />
                                  <span className="text-sm text-muted-foreground">{maintenance?.description}</span>
                                </div>
                                <Button
                                  variant={'destructive'}
                                  size={'sm'}
                                  onClick={() => handleDeleteRepair(field.vehicle_id, field.repair)}
                                >
                                  Eliminar
                                </Button>
                              </CardContent>
                            </li>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    );
                  })}
                </ul>
              </div>
            </CardContent>
          </Card>

          {allRepairs.length > 0 && (
            <Button
              onClick={() => {
                createRepair();
              }}
              className="w-full mt-4"
            >
              Registrar solicitudes
            </Button>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
