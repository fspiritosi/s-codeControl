'use client';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/shared/components/ui/carousel';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import { Card, CardContent, CardDescription, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Label } from '@/shared/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Separator } from '@/shared/components/ui/separator';
import { Textarea } from '@/shared/components/ui/textarea';
import { handleSupabaseError } from '@/shared/lib/errorHandler';
import { storage } from '@/shared/lib/storage';
import { fetchRepairLogsBySolicitudId, updateRepairSolicitude } from '@/modules/maintenance/features/repairs/actions.server';
import { cn } from '@/shared/lib/utils';
import { formatDocumentTypeName } from '@/shared/lib/utils/utils';
import { FormattedSolicitudesRepair } from '@/shared/types/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { PersonIcon } from '@radix-ui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import { CalendarIcon } from 'lucide-react';
import { format, format as formatDateFns, isToday, isTomorrow, isYesterday, differenceInDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

function formatCalendar(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  if (isToday(date)) return `Hoy, ${formatDateFns(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Mañana, ${formatDateFns(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Ayer, ${formatDateFns(date, 'h:mm a')}`;
  const daysDiff = differenceInDays(startOfDay(now), startOfDay(date));
  if (daysDiff > 0 && daysDiff < 7) return `El ${formatDateFns(date, 'EEEE', { locale: es })} pasado a las ${formatDateFns(date, 'h:mm a')}`;
  if (daysDiff < 0 && daysDiff > -7) return `${formatDateFns(date, 'EEEE', { locale: es })} a las ${formatDateFns(date, 'h:mm a')}`;
  return formatDateFns(date, 'dd/MM/yyyy');
}
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { criticidad, labels, statuses } from '../data';
import RepairModal from './RepairModal';
import { DataTableColumnHeader } from '@/shared/components/data-table';

export const mechanicColums: ColumnDef<FormattedSolicitudesRepair[0]>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Titulo" className="ml-2" />,
    cell: ({ row }) => (
      <RepairModal
        row={row}
        onlyView
        action={
          <div className="flex space-x-2">
            <CardTitle className="max-w-[300px] truncate font-medium hover:underline">
              {row.getValue('title')}
            </CardTitle>
          </div>
        }
      />
    ),
  },
  {
    accessorKey: 'user_description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripcion" />,
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[400px] truncate font-medium">{row.original.user_description}</span>
      </div>
    ),
  },
  {
    accessorKey: 'state',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const state = statuses.find((status) => status.value === row.original.state);
      if (!state) return null;
      return (
        <div className={`flex items-center ${state.color}`}>
          {state.icon && <state.icon className={`mr-2 h-4 w-4 ${state.color}`} />}
          <span>{state.label}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Criticidad" />,
    cell: ({ row }) => {
      const priority = criticidad.find((priority) => priority.value === row.getValue('priority'));
      const label = labels.find((label) => label.value === row.original.priority);
      if (!priority) return null;
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
  },
  {
    accessorKey: 'intern_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Numero interno" />,
    cell: ({ row }) => <div className="flex items-center">{row.original.intern_number}</div>,
  },
  {
    accessorKey: 'domain',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Equipo" />,
    cell: ({ row }) => <div className="flex items-center">{row.original.domain}</div>,
  },
  {
    accessorKey: 'created_at',
    id: 'created_at',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => (
      <div className="flex items-center">{formatDateFns(new Date(row.original.created_at), 'dd/MM/yyyy')}</div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const [imageUrl, setImageUrl] = useState<string[]>([]);
      const [imagesMechanic, setImagesMechanic] = useState<(string | null)[]>([null, null, null]);
      const [images, setImages] = useState<(string | null)[]>([null, null, null]);
      const [files, setFiles] = useState<(File | undefined)[]>([undefined, undefined, undefined]);
      const [status, setStatus] = useState<string>(row.original.solicitud_status);
      const router = useRouter();
      const endingStates = ['Finalizado', 'Cancelado', 'Rechazado'];
      const [repairLogs, setRepairLogs] = useState<any[] | null>(null);
      const [isOpen, setIsOpen] = useState(false);
      const isLogsLoading = isOpen && repairLogs === null;
      const FormSchema = z.object({
        mechanic_description:
          row.original.state !== status && status !== 'Programado'
            ? z
                .string({ required_error: 'La descripción es requerida.' })
                .min(3, {
                  message: 'La descripción debe tener al menos 3 caracteres.',
                })
                .max(200, {
                  message: 'La descripción debe tener menos de 200 caracteres.',
                })
            : z.string().optional(),
        kilometer: z.string().refine(
          (value) => {
            if (value) {
              return Number(value) >= Number(row.original.kilometer);
            }
          },
          {
            message: `El kilometraje no puede ser menor al actual (${row.original.kilometer})`,
          }
        ),
        scheduled:
          status === 'Programado'
            ? z.date({ required_error: 'Ingrese la fecha para la cual esta programada la reparacion' })
            : z.date().optional(),
      });

      useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        fetchRepairLogsBySolicitudId(row.original.id)
          .then((logs) => {
            if (!cancelled) setRepairLogs(logs);
          })
          .catch(console.error);
        return () => {
          cancelled = true;
        };
      }, [isOpen, row.original.id]);

      useEffect(() => {
        const fetchImageUrls = async () => {
          const modifiedStrings = row.original.user_images
            ?.map((str) => {
              return storage.getPublicUrl('repair_images', str.slice(1));
            })
            .filter((e) => e);

          const modifiedStringsMechanic = row.original.mechanic_images
            ?.filter((e) => e)
            .map((str) => {
              return storage.getPublicUrl('repair_images', str?.slice(1));
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
        const maintenanceName = formatDocumentTypeName(row.original.title);
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
          let mechanic_imagesData = files.map((file, index) =>
            formatImages(file, row.original.domain ?? row.original.serie, index)
          );

          const mechanic_images = mechanic_imagesData
            .map((e) => e?.url)
            .filter((u): u is string => typeof u === 'string');
          const mechanic_description = form.getValues('mechanic_description');

          const { error } = await updateRepairSolicitude(row.original.id, {
            state: status,
            mechanic_description,
            mechanic_images,
            kilometer: form.getValues('kilometer'),
            scheduled: form.getValues('scheduled'),
          });

          mechanic_imagesData
            .filter((e) => e)
            .forEach(async (e) => {
              if (!e) return;
              await storage.upload('repair_images', e?.url, e?.image, { upsert: true });
            });
          if (error) {
            console.error(error);
            throw new Error(handleSupabaseError(error));
          }
        } else if (shouldUpdateStatus) {
          await saveNewStatus();
        } else if (shouldUpdateFiles) {
          await updateRepair();
        }
        form.reset();
      };

      const saveNewStatus = async () => {
        const mechanic_description = form.getValues('mechanic_description');

        const { error } = await updateRepairSolicitude(row.original.id, {
          state: status,
          mechanic_description,
          kilometer: form.getValues('kilometer'),
        });

        if (error) {
          console.error(error);
          throw new Error(handleSupabaseError(error));
        }
      };

      const updateRepair = async () => {
        let mechanic_imagesData = files.map((file, index) =>
          formatImages(file, row.original.domain ?? row.original.serie, index)
        );

        const mechanic_images = mechanic_imagesData
          .map((e) => e?.url)
          .filter((u): u is string => typeof u === 'string');

        await updateRepairSolicitude(row.original.id, {
          mechanic_images,
          kilometer: form.getValues('kilometer'),
        });

        mechanic_imagesData
          .filter((e) => e)
          .forEach(async (e) => {
            if (!e) return;
            await storage.upload('repair_images', e?.url, e?.image);
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
          kilometer: row.original.kilometer ?? '0',
        },
      });

      function onSubmit() {
        handleSaveChangues();
      }

      const logsList = repairLogs ?? [];
      const repairLogsKilometers =
        logsList.length > 0
          ? Number(logsList[logsList.length - 1]?.kilometer ?? 0) -
            Number(logsList[0]?.kilometer ?? 0)
          : 0;

      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                      <SelectItem key={crypto.randomUUID()} value={status.value}>
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
                    <Form {...form}>
                      <form id="miFormulario" onSubmit={form.handleSubmit(onSubmit)}>
                        {status !== 'Programado' && (
                          <>
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
                            <FormField
                              control={form.control}
                              name="kilometer"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Kilometraje</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Kilometraje" className="resize-none" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    Kilometraje del vehículo al momento de la reparación
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                        {status === 'Programado' && (
                          <FormField
                            control={form.control}
                            name="scheduled"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Fecha programada</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={'outline'}
                                        className={cn(
                                          'pl-3 text-left font-normal',
                                          !field.value && 'text-muted-foreground'
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, 'PPP', { locale: es })
                                        ) : (
                                          <span>Seleccionar fecha</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value || new Date()}
                                      onSelect={field.onChange}
                                      disabled={(date: any) => date < new Date()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>Fecha para la cual esta programada la reparacion</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
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
                  <Label>{row.original.domain ? 'Dominio' : 'Serie'}</Label>
                  <div className="font-medium">{row.original.domain ?? row.original.serie}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Motor</Label>
                  <div className="font-medium">{row.original.engine}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Estado</Label>
                  <Badge className="w-fit" variant={'outline'}>
                    {(row.original.status as string)?.replaceAll('_', ' ')}
                  </Badge>
                </div>
                <div className="grid gap-2">
                  <Label>Chasis</Label>
                  <div className="font-medium">{row.original.chassis}</div>
                </div>
              </div>
              <div className="mx-auto w-[90%]">
                {imageUrl?.length > 0 && <Badge className="text-sm mb-2"> Imagenes del equipo a reparar</Badge>}
                {imageUrl?.length > 0 && (
                  <Carousel className="w-full">
                    <CarouselContent className="p-2">
                      {imageUrl.map((image, index) => (
                        <CarouselItem key={crypto.randomUUID()} className="md:basis-1/2 lg:basis-1/3  overflow-hidden">
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
                )}
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
                            <CarouselItem
                              key={crypto.randomUUID()}
                              className="md:basis-1/2 lg:basis-1/3  overflow-hidden"
                            >
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
                            <CarouselItem key={crypto.randomUUID()} className="md:basis-1/2 lg:basis-1/3 ">
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
                {isLogsLoading ? (
                  <CardDescription>Cargando eventos de la reparación...</CardDescription>
                ) : logsList.length > 0 ? (
                  <CardTitle>
                    Kilometros totales de la reparacion: {repairLogsKilometers} kms
                  </CardTitle>
                ) : null}
              </div>
              <div className="relative flex flex-col gap-4 justify-start w-full">
                {logsList.length > 0 && (
                  <div className="absolute left-[19px] top-0 bottom-0 w-px bg-muted-foreground/20 " />
                )}
                {logsList.map((log: any, index: number) => {
                  const state = statuses.find((status) => status.value === log.title);
                  const fullName =
                    log.modified_by_user?.fullname ??
                    `${log.modified_by_employee?.firstname ?? ''} ${log.modified_by_employee?.lastname ?? ''}`.trim();

                  return (
                    <div key={log.id} className="relative flex items-start gap-4">
                      <div
                        className={cn(
                          'relative flex max-h-[40px] max-w-[40px] size-10 items-center justify-center rounded-full text-primary-foreground aspect-square flex-shrink-0',
                          index + 1 === logsList.length ? 'bg-primary' : 'bg-muted-foreground'
                        )}
                      >
                        {index + 1}
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex gap-2 items-center">
                            <div className="font-medium flex items-center">
                              {state?.icon && <state.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                              <span>{state?.label}</span>
                            </div>
                            <CardDescription className="m-0 flex gap-2 items-center">
                              <PersonIcon />
                              {fullName}
                            </CardDescription>
                          </div>
                          <div className="text-muted-foreground text-sm flex gap-2 items-center">
                            <Badge variant={'outline'} className="m-0 flex items-center p-1">
                              {log.kilometer} kms
                            </Badge>
                            <CardDescription>{formatCalendar(log.created_at)}</CardDescription>
                          </div>
                        </div>
                        <CardDescription>
                          {log.description} <br />
                        </CardDescription>
                      </div>
                    </div>
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
