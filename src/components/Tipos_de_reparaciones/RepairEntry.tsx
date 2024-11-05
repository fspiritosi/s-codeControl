'use client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';

import { formatDocumentTypeName, setVehiclesToShow } from '@/lib/utils/utils';
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
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CardTitle } from '../ui/card';
import { Form } from '../ui/form';
import { Input } from '../ui/input';
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
  user_images: (string | null)[];
  files: (File | undefined)[];
  kilometer: string | undefined;
}[];

export default function RepairNewEntry({
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
  const [typeOfEquipment, setTypeOfEquipment] = useState<string | undefined>(
    equipment?.find((equip) => equip.id === default_equipment_id)?.types_of_vehicles
  );
  const [selectedEquipment, setSelectedEquipment] = useState<ReturnType<typeof setVehiclesToShow>[0] | undefined>(
    equipment?.find((equip) => equip.id === default_equipment_id)
  );
  const FormSchema = z.object({
    provicionalId: z.string().default(crypto.randomUUID()),
    vehicle_id: z.string({
      required_error: 'Por favor selecciona un vehiculo',
    }),
    kilometer: z
      .string()
      .optional()
      .refine(
        (value) => {
          if (value) {
            // console.log('value', value);
            // console.log('Number(value) > Number(selectedEquipment?.kilometer)', selectedEquipment?.kilometer);
            // console.log(
            //   'Number(value) > Number(selectedEquipment?.kilometer)',
            //   Number(value) > Number(selectedEquipment?.kilometer)
            // );
            return Number(value) >= Number(selectedEquipment?.kilometer);
          }
        },
        {
          message: `El kilometraje no puede ser menor al actual (${selectedEquipment?.kilometer})`,
        }
      ),
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
      vehicle_id: default_equipment_id || '',
      domain: equipment?.find((equip) => equip.id === default_equipment_id)?.domain || '',
      kilometer: selectedEquipment?.kilometer || '0',
    },
  });
  const [images, setImages] = useState<(string | null)[]>([null, null, null]);
  const [files, setFiles] = useState<(File | undefined)[]>([undefined, undefined, undefined]);

  const verifyIfExistOpenRepairSolicitud = async (repairTypeId: string) => {
    const vehicle_id = equipment?.find(
      (equip) => equip.domain === form.getValues('domain') || equip.serie === form.getValues('domain')
    );

    if (vehicle_id?.id) {
      //Primero verificar el array de reparaciones
      const hasOpenRepair = allRepairs.some((e) => e.repair === repairTypeId);
      if (hasOpenRepair) {
        toast.error(
          'Ya existe una solicitud de reparacion con los mismos datos en estado pendiente para este vehiculo'
        );
        return true;
      }

      const { data: repair_solicitudes, error } = await supabase
        .from('repair_solicitudes')
        .select('*')
        .eq('equipment_id', vehicle_id?.id)
        .eq('reparation_type', repairTypeId)
        .neq('state', 'Cancelado')
        .neq('state', 'Finalizado')
        .neq('state', 'Rechazado');

      if (repair_solicitudes?.length ?? 0 > 0) {
        toast.error(
          `Ya existe una solicitud de reparacion con los mismos datos en estado ${repair_solicitudes?.[0].state} para este vehiculo`
        );
        return true; // Indica que se encontró una solicitud abierta
      }
    } else {
      toast.error('No se encontro el vehiculo');
      return true; // Indica que no se encontró el vehículo
    }

    return false; // Indica que no se encontró una solicitud abierta
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    //Agregar la reparacion al otro formulario
    const hasOpenRepair = await verifyIfExistOpenRepairSolicitud(data.repair);

    // Si se encontró una reparación abierta, detener la ejecución
    if (hasOpenRepair) {
      return;
    }

    const dataWithImages = {
      ...data,
      user_images: images,
      files,
      kilometer: data.kilometer,
    };

    setAllRepairs((prev) => [...prev, dataWithImages]);

    clearForm();
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
  const [formattedToday] = useState(formatDocumentTypeName(new Date().toISOString()));

  const supabase = supabaseBrowser();
  const formatImagesUrl = async (image: File | undefined, domain: string, repair_id: string, index: number) => {
    if (!image) return;
    const maintenanceName = formatDocumentTypeName(tipo_de_mantenimiento.find((e) => e.id === repair_id)?.name || '');
    const formatedDomain = formatDocumentTypeName(domain);
    const url = `/${formatedDomain}/${maintenanceName}-(${formattedToday.replaceAll('/', '-')})/user-image/${index}`;

    const { data, error } = await supabase.storage.from('repair_images').upload(url, image);

    if (error) {
      throw new Error(`${error.message}`);
    }
    return data?.path;
  };

  const formatImages = async (image: File | undefined, domain: string, repair_id: string, index: number) => {
    if (!image) return;
    const maintenanceName = formatDocumentTypeName(tipo_de_mantenimiento.find((e) => e.id === repair_id)?.name || '');
    const formatedDomain = formatDocumentTypeName(domain);
    const url = `/${formatedDomain}/${maintenanceName}-(${formattedToday.replaceAll('/', '-')})/user-image/${index}`;

    return url;
  };

  const createRepair = () => {
    toast.promise(
      async () => {
        try {
          const vehicle_id = equipment?.find(
            (equip) =>
              equip?.domain?.toLowerCase() === allRepairs[0]?.domain?.toLowerCase() ||
              equip?.serie?.toLowerCase() === allRepairs[0]?.domain?.toLowerCase()
          ); //! OJO si se permiten mas de 1 vehiculo
          const condition = vehicle_id?.condition;

          const data = await Promise.all(
            allRepairs.map(async (e) => {
              const user_images = e.files
                ? await Promise.all(
                    e.files
                      .filter((image) => image)
                      .map((image, index) => formatImages(image, e.domain, e.repair, index))
                  )
                : null;

              return {
                reparation_type: e.repair,
                equipment_id:
                  equipment.find((equip) => equip.domain === e.domain)?.id ||
                  equipment.find((equip) => equip.serie === e.domain)?.id,
                user_description: e.description,
                user_id,
                user_images,
                state: 'Pendiente',
                employee_id,
                kilometer: e.kilometer,
              };
            })
          );

          // Verificar la criticidad de todas las reparaciones
          const hasHighCriticity = allRepairs.some((e) => {
            const repair = tipo_de_mantenimiento.find((repair) => repair.id === e.repair);
            return repair?.criticity === 'Alta';
          });

          const hasMediumCriticity = allRepairs.some((e) => {
            const repair = tipo_de_mantenimiento.find((repair) => repair.id === e.repair);
            return repair?.criticity === 'Media';
          });

          if (hasHighCriticity && condition !== 'no operativo' && condition !== 'en reparación') {
            const { data: vehicles, error } = await supabase
              .from('vehicles')
              .update({ condition: 'no operativo', kilometer: allRepairs[0].kilometer })
              .eq('id', vehicle_id?.id || '');
          } else if (hasMediumCriticity && condition !== 'no operativo' && condition !== 'en reparación') {
            const { data: vehicles, error } = await supabase
              .from('vehicles')
              .update({ condition: 'operativo condicionado', kilometer: allRepairs[0].kilometer })
              .eq('id', vehicle_id?.id || '');
          } else {
            const { data: vehicles, error } = await supabase
              .from('vehicles')
              .update({ kilometer: allRepairs[0].kilometer })
              .eq('id', vehicle_id?.id || '');
          }

          await fetch(`${URL}/api/repair_solicitud`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          allRepairs.forEach(async (e) => {
            e.files
              ? await Promise.all(
                  e.files
                    .filter((image) => image)
                    .map((image, index) => formatImagesUrl(image, e.domain, e.repair, index))
                )
              : null;
          });
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

  //console.log(typeOfEquipment, 'typeOfEquipmenttypeOfEquipment');

  const handleDeleteRepair = (provicionalId: string) => {
    setAllRepairs((prev) => prev.filter((e) => e.provicionalId !== provicionalId));
  };
  const vehicle = equipment.find(
    (equip) => equip.domain === form.getValues('domain') || equip.serie === form.getValues('domain')
  );
  const [open, setOpen] = useState(false);
  return (
    <ResizablePanelGroup direction="horizontal" className="pt-6 flex flex-wrap sm:flex-nowrap w-full">
      <ResizablePanel className="sm:min-w-[280px] min-w-full">
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-3 p-3 w-full">
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
                                ? equipment?.find((equip) => equip.id === field.value)?.domain ||
                                  equipment?.find((equip) => equip.id === field.value)?.serie
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
                                {equipment?.map((equip) => {
                                  return (
                                    <CommandItem
                                      value={equip.domain ?? equip.serie}
                                      key={equip.intern_number}
                                      onSelect={() => {
                                        form.setValue('vehicle_id', equip.id);
                                        form.setValue('domain', equip.domain ?? equip.serie);
                                        form.setValue('kilometer', equip.kilometer);

                                        setTypeOfEquipment(equip.types_of_vehicles);
                                        setSelectedEquipment(equip);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          equip.id === field.value ? 'opacity-100' : 'opacity-0'
                                        )}
                                      />
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
                  name="kilometer"
                  // disabled={limittedEquipment ? false : allRepairs.length > 0}
                  render={({ field }) => (
                    <FormItem className={cn(typeOfEquipment === 'Vehículos' ? '' : 'hidden')}>
                      <FormLabel>Kilometraje</FormLabel>
                      <FormControl>
                        <Input
                          disabled={limittedEquipment ? false : allRepairs.length > 0}
                          {...field}
                          placeholder="Kilometraje"
                          value={field.value === undefined || field.value === null ? '' : field.value.toString()}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (isNaN(Number(value)) || value === ' ') {
                              return;
                            }

                            form.setValue('kilometer', value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                                    disabled={allRepairs.some((e) => e.repair === item.id)}
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
                <TableHead className="flex justify-end pr-14">Eliminar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="overflow-x-auto">
              {allRepairs.map((field) => {
                const repair = tipo_de_mantenimiento.find((e) => e.id === field.repair);
                return (
                  <TableRow key={field.provicionalId}>
                    <TableCell>
                      <div className="flex items-center justify-between gap-3">
                        {repair?.name}
                        <div className="flex -space-x-2">
                          {field.user_images
                            .filter((url) => url)
                            .map((url) => (
                              <Avatar key={url} className="border-black border size-8 ">
                                <AvatarImage src={url || ''} alt="Preview de la reparacion" />
                                <AvatarFallback>CN</AvatarFallback>
                              </Avatar>
                            ))}
                        </div>
                      </div>
                    </TableCell>
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
                      <Accordion type="single" collapsible key={field.provicionalId}>
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
                            <li key={field.provicionalId} className="">
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
                                  <div className="flex -space-x-2 mt-2">
                                    {field.user_images
                                      .filter((url) => url)
                                      .map((url) => (
                                        <Avatar key={url} className="border-black border size-8 ">
                                          <AvatarImage src={url || ''} alt="Preview de la reparacion" />
                                          <AvatarFallback>CN</AvatarFallback>
                                        </Avatar>
                                      ))}
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <ReaderIcon className="mr-2 h-4 w-4" />
                                  <span className="text-sm text-muted-foreground">{maintenance?.description}</span>
                                </div>
                                <Button
                                  variant={'destructive'}
                                  size={'sm'}
                                  onClick={() => handleDeleteRepair(field.provicionalId)}
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
