'use client';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { formatDocumentTypeName } from '@/lib/utils/utils';
import { FormattedSolicitudesRepair } from '@/types/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { ColumnDef } from '@tanstack/react-table';
import moment from 'moment';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { criticidad, labels, statuses } from '../data';
import { DataTableColumnHeader } from './data-table-column-header';

export const mechanicColums: ColumnDef<FormattedSolicitudesRepair[0]>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Titulo" className="ml-2" />,
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <CardTitle className="max-w-[300px] truncate font-medium">{row.getValue('title')}</CardTitle>
        </div>
      );
    },
  },
  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripcion" />,
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[400px] truncate font-medium">{row.original.user_description}</span>
        </div>
      );
    },
  },
  // {
  //   accessorKey: 'id',
  //   header: ({ column }) => <DataTableColumnHeader column={column} title="Task" />,
  //   cell: ({ row }) => <div className="w-[80px]">{row.getValue('id')}</div>,
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: 'state',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const state = statuses.find((status) => status.value === row.original.state);

      if (!state) {
        return null;
      }

      return (
        <div className={`flex  items-center ${state.color}`}>
          {state.icon && <state.icon className={`mr-2 h-4 w-4 ${state.color}`} />}
          <span>{state.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Criticidad" />,
    cell: ({ row }) => {
      const priority = criticidad.find((priority) => priority.value === row.getValue('priority'));
      const label = labels.find((label) => label.value === row.original.priority);
      if (!priority) {
        return null;
      }

      return (
        <Badge
          variant={label?.value === 'Baja' ? 'success' : label?.value === 'Media' ? 'yellow' : 'destructive'}
          className="flex items-center w-fit"
        >
          {priority.icon && <priority.icon className="mr-2 h-4 w-4" />}
          <span>{priority.label}</span>
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'domain',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Equipo" />,
    cell: ({ row }) => {
      return <div className="flex items-center">{row.original.domain}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'fecha',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => {
      return <div className="flex items-center">{moment(row.original.created_at).format('DD/MM/YYYY')}</div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const supabase = supabaseBrowser();
      const [imageUrl, setImageUrl] = useState<string[]>([]);
      const [imagesMechanic, setImagesMechanic] = useState<(string | null)[]>([null, null, null]);
      const [images, setImages] = useState<(string | null)[]>([null, null, null]);
      const [files, setFiles] = useState<(File | undefined)[]>([undefined, undefined, undefined]);
      const [status, setStatus] = useState<string>(row.original.solicitud_status);
      // const [mechanic_description, setMechanic_description] = useState('');
      const router = useRouter();
      const endingStates = ['Finalizado', 'Cancelado', 'Rechazado'];
      const [repairLogs, setRepairLogs] = useState(row.original.repairlogs);
      const [repairSolicitudes, setRepairSolicitudes] = useState<any>([]);
      const FormSchema = z.object({
        mechanic_description:
          row.original.state !== status
            ? z
                .string({ required_error: 'La descripción es requerida.' })
                .min(3, {
                  message: 'La descripción debe tener al menos 3 caracteres.',
                })
                .max(200, {
                  message: 'La descripción debe tener menos de 200 caracteres.',
                })
            : z.string().optional(),
      });
      useEffect(() => {
        setRepairLogs(row.original.repairlogs);
        fetchRepairsLogs();
      }, [row.original.repairlogs]);

      const fetchRepairsLogs = async () => {
        const { data, error } = await supabase
          .from('repair_solicitudes')
          .select('*,reparation_type(*)')
          .eq('equipment_id', row.original.vehicle_id);

        if (error) {
          throw new Error(handleSupabaseError(error.message));
        }

        setRepairSolicitudes(data);
      };

      useEffect(() => {
        const fetchImageUrls = async () => {
          const modifiedStrings = row.original.user_images
            .map((str) => {
              const { data } = supabase.storage.from('repair_images').getPublicUrl(str.slice(1));
              return data.publicUrl;
            })
            .filter((e) => e);

          const modifiedStringsMechanic = row.original.mechanic_images
            ?.filter((e) => e)
            .map((str) => {
              const { data } = supabase.storage.from('repair_images').getPublicUrl(str?.slice(1));
              return data.publicUrl;
            });
          setImagesMechanic(modifiedStringsMechanic);
          setImageUrl(modifiedStrings);
        };

        fetchImageUrls();
      }, [row.original.user_images]);
      const [formattedToday] = useState(formatDocumentTypeName(new Date().toISOString()));

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
      const formatImages = (image: File | undefined, domain: string, index: number) => {
        if (!image) return;
        const maintenanceName = formatDocumentTypeName(row.original.title); //Aqui va el nombre del mantenimiento
        const user_pictures = row.original.user_images.filter((e) => e);
        const str = user_pictures[index];
        const regex = /\(([^)]+)\)/;
        const user_pictures_date = str?.match(regex);

        const formatedDomain = formatDocumentTypeName(domain);

        const url = `/${formatedDomain}/${maintenanceName}-(${user_pictures_date?.[1] ?? formattedToday.replaceAll('/', '-')})/mechanic-images/${index}`;

        return {
          url,
          image,
        };
      };

      const combinedUpdate = async () => {
        const shouldUpdateStatus = status !== row.original.state;
        const shouldUpdateFiles = files.some((e) => e !== undefined);

        if (shouldUpdateStatus || shouldUpdateFiles) {
          let mechanic_imagesData = files.map((file, index) => formatImages(file, row.original.domain, index));

          const mechanic_images = mechanic_imagesData.map((e) => e?.url);
          const vehicle_id = row.original.vehicle_id;
          const mechanic_description = form.getValues('mechanic_description');

          const { data, error } = await supabase
            .from('repair_solicitudes')
            .update({ state: status, mechanic_description, mechanic_images })
            .eq('id', row.original.id);

          mechanic_imagesData
            .filter((e) => e)
            .forEach(async (e) => {
              if (!e) return;
              const { data, error } = await supabase.storage
                .from('repair_images')
                .upload(e?.url, e?.image, { upsert: true });
              if (error) {
                throw new Error(handleSupabaseError(error.message));
              }
            });
          if (error) {
            console.log(error);
            throw new Error(handleSupabaseError(error.message));
          }

          const pendingRepairs = repairSolicitudes
            .filter((e: any) => !endingStates.includes(e.state))
            .filter((e: any) => e.id !== row.original.id);

          console.log(pendingRepairs, 'pendingRepairs');

          let newStatus = '';

          // Si la reparación actualizada es un estado de cierre
          if (endingStates.includes(status)) {
            // Si no hay más reparaciones pendientes, el vehículo está operativo
            if (pendingRepairs.length === 0) {
              newStatus = 'operativo';
              console.log('1 operativo (Es un estado de cierre y no hay más reparaciones pendientes)');
            } else {
              // Si hay otras reparaciones pendientes, calcular el estado basado en ellas
              if (pendingRepairs.some((e: any) => e.state === 'En reparación')) {
                console.log(
                  '2 en reparacion (Es un estado de cierre y hay más reparaciones pendientes (en estado de repuestos o en reparacion))'
                );
                newStatus = 'en reparación';
              } else if (pendingRepairs.some((e: any) => e.reparation_type.criticity === 'Alta')) {
                newStatus = 'no operativo';
                console.log('3 no operativo (Hay otra reparación pendiente de criticidad alta)');
                console.log(
                  pendingRepairs.find((e: any) => e.reparation_type.criticity === 'Alta'),
                  'reparacion pendiente de criticidad alta'
                );
                console.log(row.original, 'row.origilal');
                console.log(status, 'newState');
              } else if (pendingRepairs.some((e: any) => e.reparation_type.criticity === 'Media')) {
                newStatus = 'operativo condicionado';
                console.log('4 operativo condicionado (Hay otra reparación pendiente de criticidad media)');
              } else {
                newStatus = 'operativo';
                console.log('5 operativo (Hay otra reparación pendiente de criticidad baja)');
              }
            }
          } else {
            // Si la reparación actualizada no es un estado de cierre, calcular el estado basado en todas las reparaciones pendientes incluyendo la actualizada
            const allPendingRepairs = [
              ...pendingRepairs,
              { state: status, reparation_type: { criticity: row.original.priority } },
            ];
            console.log(allPendingRepairs, 'allPendingRepairs');
            if (allPendingRepairs.some((e: any) => e.state === 'En reparación')) {
              console.log(
                '6 en reparacion (No es un estado de cierre y hay más reparaciones pendientes (en estado de repuestos o en reparacion))'
              );
              newStatus = 'en reparación';
            } else if (allPendingRepairs.some((e: any) => e.reparation_type.criticity === 'Alta')) {
              newStatus = 'no operativo';
              console.log(
                '7 no operativo (No es un estado de cierre y hay otra reparación pendiente de criticidad alta)'
              );
            } else if (allPendingRepairs.some((e: any) => e.reparation_type.criticity === 'Media')) {
              newStatus = 'operativo condicionado';
              console.log(
                '8 operativo condicionado (No es un estado de cierre y hay otra reparación pendiente de criticidad media)'
              );
            } else {
              newStatus = 'operativo';
              console.log('9 operativo (No es un estado de cierre y hay otra reparación pendiente de criticidad baja)');
            }
          }

          const { data: vehicles, error: vehicleerror } = await supabase
            .from('vehicles')
            .update({ condition: newStatus })
            .eq('id', vehicle_id);
        } else if (shouldUpdateStatus) {
          await saveNewStatus();
        } else if (shouldUpdateFiles) {
          await updateRepair();
        }
        form.reset();
      };

      const saveNewStatus = async () => {
        const vehicle_id = row.original.vehicle_id;
        const mechanic_description = form.getValues('mechanic_description');

        const { data, error } = await supabase
          .from('repair_solicitudes')
          .update({ state: status, mechanic_description })
          .eq('id', row.original.id);

        if (error) {
          console.log(error);
          throw new Error(handleSupabaseError(error.message));
        }

        const pendingRepairs = repairSolicitudes
          .filter((e: any) => !endingStates.includes(e.state))
          .filter((e: any) => e.id !== row.original.id);

        console.log(pendingRepairs, 'pendingRepairs');

        let newStatus = '';

        // Si la reparación actualizada es un estado de cierre
        if (endingStates.includes(status)) {
          // Si no hay más reparaciones pendientes, el vehículo está operativo
          if (pendingRepairs.length === 0) {
            newStatus = 'operativo';
            console.log('1 operativo (Es un estado de cierre y no hay más reparaciones pendientes)');
          } else {
            // Si hay otras reparaciones pendientes, calcular el estado basado en ellas
            if (pendingRepairs.some((e: any) => e.state === 'En reparación')) {
              console.log(
                '2 en reparacion (Es un estado de cierre y hay más reparaciones pendientes (en estado de repuestos o en reparacion))'
              );
              newStatus = 'en reparación';
            } else if (pendingRepairs.some((e: any) => e.reparation_type.criticity === 'Alta')) {
              newStatus = 'no operativo';
              console.log('3 no operativo (Hay otra reparación pendiente de criticidad alta)');
              console.log(
                pendingRepairs.find((e: any) => e.reparation_type.criticity === 'Alta'),
                'reparacion pendiente de criticidad alta'
              );
              console.log(row.original, 'row.origilal');
              console.log(status, 'newState');
            } else if (pendingRepairs.some((e: any) => e.reparation_type.criticity === 'Media')) {
              newStatus = 'operativo condicionado';
              console.log('4 operativo condicionado (Hay otra reparación pendiente de criticidad media)');
            } else {
              newStatus = 'operativo';
              console.log('5 operativo (Hay otra reparación pendiente de criticidad baja)');
            }
          }
        } else {
          // Si la reparación actualizada no es un estado de cierre, calcular el estado basado en todas las reparaciones pendientes incluyendo la actualizada
          const allPendingRepairs = [
            ...pendingRepairs,
            { state: status, reparation_type: { criticity: row.original.priority } },
          ];
          console.log(allPendingRepairs, 'allPendingRepairs');
          if (allPendingRepairs.some((e: any) => e.state === 'En reparación')) {
            console.log(
              '6 en reparacion (No es un estado de cierre y hay más reparaciones pendientes (en estado de repuestos o en reparacion))'
            );
            newStatus = 'en reparación';
          } else if (allPendingRepairs.some((e: any) => e.reparation_type.criticity === 'Alta')) {
            newStatus = 'no operativo';
            console.log(
              '7 no operativo (No es un estado de cierre y hay otra reparación pendiente de criticidad alta)'
            );
          } else if (allPendingRepairs.some((e: any) => e.reparation_type.criticity === 'Media')) {
            newStatus = 'operativo condicionado';
            console.log(
              '8 operativo condicionado (No es un estado de cierre y hay otra reparación pendiente de criticidad media)'
            );
          } else {
            newStatus = 'operativo';
            console.log('9 operativo (No es un estado de cierre y hay otra reparación pendiente de criticidad baja)');
          }
        }

        const { data: vehicles, error: vehicleerror } = await supabase
          .from('vehicles')
          .update({ condition: newStatus })
          .eq('id', vehicle_id);
        console.log('error', vehicleerror);
      };

      const updateRepair = async () => {
        let mechanic_imagesData = files.map((file, index) => formatImages(file, row.original.domain, index));

        const mechanic_images = mechanic_imagesData.map((e) => e?.url);

        const { data, error } = await supabase
          .from('repair_solicitudes')
          .update({ mechanic_images })
          .eq('id', row.original.id);

        mechanic_imagesData
          .filter((e) => e)
          .forEach(async (e) => {
            if (!e) return;
            const { data, error } = await supabase.storage.from('repair_images').upload(e?.url, e?.image);
            if (error) {
              throw new Error(handleSupabaseError(error.message));
            }
          });
      };

      const handleSaveChangues = async () => {
        toast.promise(
          async () => {
            await combinedUpdate();
          },
          {
            loading: 'Guardando cambios',
            success: 'Cambios guardados',
            error: (error) => error,
          }
        );
        setStatus(row.original.state);

        document.getElementById('close-modal-mechanic-colum')?.click();
        router.refresh();
      };
      const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
          mechanic_description: '',
        },
      });

      function onSubmit() {
        handleSaveChangues();
      }
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Reparar equipo</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[50vw] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reparación de equipo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label>Tipo de reparación</Label>
                  <div className="font-medium">{row.original.title}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Criticidad</Label>
                  <Badge
                    variant={
                      row.original.priority === 'Alta'
                        ? 'destructive'
                        : row.original.priority === 'Media'
                          ? 'yellow'
                          : 'outline'
                    }
                    className="w-fit"
                  >
                    {row.original.priority}
                  </Badge>
                </div>
                <div className="grid gap-2">
                  <Label>Descripción de la solicitud</Label>
                  <div>{row.original.user_description}</div>
                </div>

                <div className="grid gap-2">
                  <Label>Tipo de mantenimiento</Label>
                  <Badge className="font-medium w-fit" variant={'outline'}>
                    {row.original.type_of_maintenance}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select
                  defaultValue={row.original.state}
                  disabled={row.original.state === 'Finalizado' || row.original.state === 'Cancelado'}
                  onValueChange={(valor) => {
                    setStatus(valor);
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center">
                          {status.icon && <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                          <span>{status.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {row.original.state !== status && (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    {/* <Label>Descripción del nuevo estado de la solicitud</Label>
                    <Textarea
                      placeholder="Informa al usuario acerca del nuevo estado"
                      value={mechanic_description}
                      onChange={(e) => {
                        setMechanic_description(e.target.value);
                      }}
                    /> */}
                    <Form {...form}>
                      <form id="miFormulario" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                          control={form.control}
                          name="mechanic_description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Informa al usuario acerca del nuevo estado"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>Descripción del nuevo estado de la solicitud</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </div>
                </div>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label>Tipo de equipo</Label>
                  <div className="font-medium">{row.original.type_of_equipment}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Año</Label>
                  <div className="font-medium">{row.original.year}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Marca</Label>
                  <div className="font-medium">{row.original.brand}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Modelo</Label>
                  <div className="font-medium">{row.original.model}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Dominio</Label>
                  <div className="font-medium">{row.original.domain}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Motor</Label>
                  <div className="font-medium">{row.original.engine}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Estado</Label>
                  <Badge className="w-fit" variant={'outline'}>
                    {row.original.status}
                  </Badge>
                </div>
                <div className="grid gap-2">
                  <Label>Chasis</Label>
                  <div className="font-medium">{row.original.chassis}</div>
                </div>
              </div>
              <div className="mx-auto w-[90%]">
                <Badge className="text-sm mb-2"> Imagenes del equipo a reparar</Badge>
                <Carousel className="w-full">
                  <CarouselContent className="p-2">
                    {imageUrl.map((image, index) => (
                      <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3  overflow-hidden">
                        <Card className="">
                          <Link target="_blank" href={image || ''}>
                            <CardContent className="flex aspect-square items-center justify-center p-1">
                              <img
                                src={image}
                                alt={`Imagen ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </CardContent>
                          </Link>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
              {(imagesMechanic?.length || (status !== row.original.state && endingStates.includes(status))) && (
                <div className="mx-auto w-[90%]">
                  <Badge className="text-sm mb-2 block w-fit"> Adjuntar imagenes</Badge>
                  {!imagesMechanic?.length && status !== row.original.state && (
                    <CardDescription>
                      Una vez subida una imagen no se podra modificar ni subir otra imagen, si desea hacerlo tendra que
                      realizar una nueva solicitud
                    </CardDescription>
                  )}
                  <Carousel
                    opts={{
                      align: 'start',
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="p-2">
                      {imagesMechanic?.length
                        ? imagesMechanic?.map((image, index) => (
                            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3  overflow-hidden">
                              <Card className="">
                                <Link target="_blank" href={image || ''}>
                                  <CardContent className="flex aspect-square items-center justify-center p-1">
                                    <img
                                      src={image || ''}
                                      alt={`Imagen ${index + 1}`}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  </CardContent>
                                </Link>
                              </Card>
                            </CarouselItem>
                          ))
                        : status !== row.original.state &&
                          Array.from({ length: 3 }).map((_, index) => (
                            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 ">
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
              )}
              <div className="grid gap-2">
                <CardTitle>Eventos de la reparacion</CardTitle>
              </div>
              <div className="relative flex flex-col gap-4 justify-start  w-full">
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-muted-foreground/20 " />
                {repairLogs.map((log, index) => {
                  const state = statuses.find((status) => status.value === log.title);

                  return (
                    <>
                      <div className="relative flex items-start gap-4">
                        <div
                          className={cn(
                            'relative  flex max-h-[40px] max-w-[40px] size-10 items-center justify-center rounded-full  text-primary-foreground aspect-square flex-shrink-0',
                            index + 1 === repairLogs.length ? 'bg-primary' : 'bg-muted-foreground'
                          )}
                        >
                          {index + 1}
                        </div>
                        <div className="flex flex-col gap-1  w-full">
                          <div className="flex items-center justify-between w-full">
                            <div className="font-medium flex items-center">
                              {state?.icon && <state.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                              <span>{state?.label}</span>
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {moment(log.created_at).format('[Hoy,] h:mm A')}
                            </div>
                          </div>
                          <CardDescription>{log.description}</CardDescription>
                        </div>
                      </div>
                    </>
                  );
                })}
              </div>
            </div>
            <DialogClose id="close-modal-mechanic-colum" />
            {row.original.state === 'Finalizado' || row.original.state === 'Cancelado' ? (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={'destructive'}
                  className="col-span-2"
                  type="submit"
                  onClick={() => {
                    document.getElementById('close-modal-mechanic-colum')?.click();
                  }}
                >
                  Cerrar
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Button type="submit" form="miFormulario" className="col-span-1">
                  Guardar cambios
                </Button>

                <Button
                  variant={'destructive'}
                  className="col-span-1"
                  type="submit"
                  onClick={() => {
                    document.getElementById('close-modal-mechanic-colum')?.click();
                  }}
                >
                  Cerrar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      );
    },
  },
];
