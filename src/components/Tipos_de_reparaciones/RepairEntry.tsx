'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { formatDocumentTypeName, setVehiclesToShow } from '@/lib/utils/utils';
import { TypeOfRepair } from '@/types/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { CardTitle } from '../ui/card';
import { Form } from '../ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import { Textarea } from '../ui/textarea';
type FormValues = {
  description: string;
  repair: string;
  provicionalId: string;
  domain: string;
  user_images: (string | null)[];
  files: (File | undefined)[];
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
  const router = useRouter();
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
    user_images: z.array(z.string().default('')).default([]),
    files: z.array(z.any()).optional(),
  });
  const [allRepairs, setAllRepairs] = useState<FormValues>([]);
  const [images, setImages] = useState<(string | null)[]>([null, null, null]);
  const [files, setFiles] = useState<(File | undefined)[]>([undefined, undefined, undefined]);

  function onSubmit(data: z.infer<typeof FormSchema>) {
    //Agregar la reparacion al otro formulario

    console.log(files, 'files');

    const dataWithImages = {
      ...data,
      user_images: images,
      files,
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
          const selectedRepair = tipo_de_mantenimiento.find((e) => e.id === allRepairs[0].repair);
          const vehicle_id = equipment?.find(
            (equip) => equip?.domain?.toLowerCase() === allRepairs[0]?.domain?.toLowerCase()
          ); //! OJO si se permiten mas de 1 vehiculo
          const condition = vehicle_id?.condition;
          console.log('vehicle_id', vehicle_id);
          console.log('equipment', equipment);
          console.log('allRepairs[0].domain.', allRepairs[0].domain);

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
                equipment_id: equipment.find((equip) => equip.domain === e.domain)?.id,
                user_description: e.description,
                user_id,
                user_images,
                state: 'Pendiente',
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

          if (hasHighCriticity && condition !== 'no operativo') {
            const { data: vehicles, error } = await supabase
              .from('vehicles')
              .update({ condition: 'no operativo' })
              .eq('id', vehicle_id?.id);
  
            console.log('error alta', error);
            console.log('vehicle_id alta', vehicle_id?.id);
          } else if (hasMediumCriticity && condition !== 'no operativo') {
            const { data: vehicles, error } = await supabase
              .from('vehicles')
              .update({ condition: 'operativo condicionado' })
              .eq('id', vehicle_id?.id);
            console.log('error media', error);
            console.log('vehicle_id media', vehicle_id?.id);
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
                                ? equipment?.find((equip) => equip.id === field.value)?.domain
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
                <Carousel
                  opts={{
                    align: 'start',
                  }}
                  className="w-full"
                >
                  Imagenes de la reparacion
                  <CarouselContent>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 ">
                        <div className="p-1">
                          <Card className="hover:cursor-pointer" onClick={() => handleCardClick(index)}>
                            <CardContent className="flex aspect-square items-center justify-center p-1">
                              {images[index] ? (
                                <img
                                  src={images[index] ||''}
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
      <ResizableHandle withHandle />
      <ResizablePanel className="pl-6 min-w-[600px]" defaultSize={70}>
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
                console.log('field', field.user_images);
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
    </ResizablePanelGroup>
  );
}
