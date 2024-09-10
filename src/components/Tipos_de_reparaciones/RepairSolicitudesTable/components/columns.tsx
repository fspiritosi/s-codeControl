'use client';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { FormattedSolicitudesRepair } from '@/types/types';
import { ColumnDef } from '@tanstack/react-table';
import moment from 'moment';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { criticidad, labels, statuses } from '../data';
import { DataTableColumnHeader } from './data-table-column-header';

export const repairSolicitudesColums: ColumnDef<FormattedSolicitudesRepair[0]>[] = [
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
      const state = statuses.find((status) => status.value === row.original.state);
      const supabase = supabaseBrowser();
      const [imageUrl, setImageUrl] = useState<string[]>([]);
      const [imagesMechanic, setImagesMechanic] = useState<(string | null)[]>([null, null, null]);
      const [repairSolicitudes, setRepairSolicitudes] = useState<any>([]);
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
          const modifiedStrings = await Promise.all(
            row.original.user_images.map(async (str) => {
              const { data } = supabase.storage.from('repair_images').getPublicUrl(str);
              return data.publicUrl;
            })
          );
          setImageUrl(modifiedStrings);
        };

        fetchImageUrls();
        const modifiedStringsMechanic = row.original.mechanic_images
          ?.filter((e) => e)
          .map((str) => {
            const { data } = supabase.storage.from('repair_images').getPublicUrl(str?.slice(1));
            return data.publicUrl;
          });
        setImagesMechanic(modifiedStringsMechanic);
      }, [row.original.user_images]);
      useEffect(() => {
        fetchRepairsLogs();
      }, [row.original.repairlogs]);
      const endingStates = ['Finalizado', 'Cancelado', 'Rechazado'];

      const router = useRouter();
      console.log('imageUrl', imageUrl);

      //!Darle funcionalidad a este boton de cancelar, actualizar el estado y puede que un modal con una descripcion de la razon

      const handleCancelSolicitud = async () => {
        const { data, error } = await supabase
          .from('repair_solicitudes')
          .update({ state: 'Cancelado' })
          .eq('id', row.original.id);

        const vehicle_id = row.original.vehicle_id;

        const pendingRepairs = repairSolicitudes
          .filter((e: any) => !endingStates.includes(e.state))
          .filter((e: any) => e.id !== row.original.id);

        let newStatus = '';

        // Si la reparación actualizada es un estado de cierre
        if (endingStates.includes('Cancelado')) {
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
        }

        const { data: vehicles, error: vehicleerror } = await supabase
          .from('vehicles')
          .update({ condition: newStatus })
          .eq('id', vehicle_id);

        if (error) {
          console.log(error);
          throw new Error(error.message);
        }
        document.getElementById('close-modal-mechanic-colum2')?.click();
        router.refresh();
      };

      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Ver detalles de reparación</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de reparación</DialogTitle>
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
                  <Label>Estado de la solicitud</Label>
                  <Badge variant="outline" className="w-fit">
                    {state?.icon && <state.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                    <span>{state?.label}</span>
                  </Badge>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo de mantenimiento</Label>
                  <Badge className="font-medium w-fit" variant={'outline'}>
                    {row.original.type_of_maintenance}
                  </Badge>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Descripción</Label>
                <div>{row.original.user_description}</div>
              </div>
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
                  <Badge className="w-fit">{row.original.status}</Badge>
                </div>
                <div className="grid gap-2">
                  <Label>Chasis</Label>
                  <div className="font-medium">{row.original.chassis}</div>
                </div>
              </div>
              <div className="mx-auto w-[90%]">
                {imageUrl.length && <Badge className="text-sm mb-2"> Imagenes del vehiculo a reparar</Badge>}
                <Carousel className="w-full">
                  <CarouselContent>
                    {imageUrl.map((image, index) => (
                      <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                        <Card>
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
              {imagesMechanic?.length && (
                <div className="mx-auto w-[90%]">
                  <Badge className="text-sm mb-2">Imagenes al finalizar la solicitud</Badge>
                  <Carousel className="w-full">
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
                        : null}
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
                {row.original.repairlogs.map((log, index) => {
                  const state = statuses.find((status) => status.value === log.title);

                  return (
                    <>
                      <div className="relative flex items-start gap-4">
                        <div
                          className={cn(
                            'relative  flex max-h-[40px] max-w-[40px] size-10 items-center justify-center rounded-full  text-primary-foreground aspect-square flex-shrink-0',
                            index + 1 === row.original.repairlogs.length ? 'bg-primary' : 'bg-muted-foreground'
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
            <DialogClose id="close-modal-mechanic-colum2" />
            {row.original.state === 'Pendiente' ? (
              <div className="grid grid-cols-2 gap-4">
                <Button variant={'destructive'} onClick={() => handleCancelSolicitud()}>
                  Cancelar solicitud
                </Button>
                <Button
                  onClick={() => {
                    document.getElementById('close-modal-mechanic-colum2')?.click();
                  }}
                  type="submit"
                >
                  Cerrar
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  document.getElementById('close-modal-mechanic-colum2')?.click();
                }}
                type="submit"
              >
                Cerrar
              </Button>
            )}
          </DialogContent>
        </Dialog>
      );
    },
  },
];
