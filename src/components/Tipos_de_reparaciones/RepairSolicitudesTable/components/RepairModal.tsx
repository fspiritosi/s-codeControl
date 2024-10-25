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
import { PersonIcon } from '@radix-ui/react-icons';
import moment from 'moment';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { statuses } from '../data';

function RepairModal({ row, onlyView, action }: { row: any; onlyView?: boolean; action?: React.ReactNode }) {
  const state = statuses.find((status) => status.value === row.original.state);
  const supabase = supabaseBrowser();
  const [imageUrl, setImageUrl] = useState<string[]>([]);
  const [imagesMechanic, setImagesMechanic] = useState<(string | null)[]>([null, null, null]);
  const [repairSolicitudes, setRepairSolicitudes] = useState<any>([]);
  const [repairLogs, setRepairLogs] = useState(row.original.repairlogs);
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
      if (row.original.user_images) {
        const modifiedStrings = await Promise?.all(
          row.original.user_images?.map(async (str: any) => {
            const { data } = supabase.storage.from('repair_images').getPublicUrl(str);
            return data.publicUrl;
          })
        );
        setImageUrl(modifiedStrings);
      }
    };

    fetchImageUrls();
    const modifiedStringsMechanic = row.original.mechanic_images
      ?.filter((e: any) => e)
      .map((str: any) => {
        const { data } = supabase.storage.from('repair_images').getPublicUrl(str?.slice(1));
        return data.publicUrl;
      });
    setImagesMechanic(modifiedStringsMechanic);
  }, [row.original.user_images]);
  useEffect(() => {
    setRepairLogs(row.original.repairlogs);
    fetchRepairsLogs();
  }, [row.original.repairlogs]);
  const endingStates = ['Finalizado', 'Cancelado', 'Rechazado'];

  const router = useRouter();

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
      } else {
        // Si hay otras reparaciones pendientes, calcular el estado basado en ellas
        if (pendingRepairs.some((e: any) => e.state === 'En reparación')) {
          newStatus = 'en reparación';
        } else if (pendingRepairs.some((e: any) => e.reparation_type.criticity === 'Alta')) {
          newStatus = 'no operativo';
        } else if (pendingRepairs.some((e: any) => e.reparation_type.criticity === 'Media')) {
          newStatus = 'operativo condicionado';
        } else {
          newStatus = 'operativo';
        }
      }
    }

    const { data: vehicles, error: vehicleerror } = await supabase
      .from('vehicles')
      .update({ condition: newStatus } as any)
      .eq('id', vehicle_id);

    if (error) {
      //console.log(error);
      throw new Error(error.message);
    }
    document.getElementById('close-modal-mechanic-colum2')?.click();
    router.refresh();
  };

  //console.log('repairLogs', repairLogs);

  return (
    <Dialog>
      <DialogTrigger>
        {onlyView ? <>{action}</> : <Button variant="outline">Ver detalles de reparación</Button>}
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
              <Label>{row.original.domain ? 'Dominio' : 'Serie'}</Label>
              <div className="font-medium">{row.original.domain ?? row.original.serie}</div>
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
            {imageUrl.length > 0 && <Badge className="text-sm mb-2"> Imagenes del vehiculo a reparar</Badge>}
            {imageUrl.length > 0 && (
              <Carousel className="w-full">
                <CarouselContent>
                  {imageUrl.map((image, index) => (
                    <CarouselItem key={crypto.randomUUID()} className="md:basis-1/2 lg:basis-1/3">
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
            )}
          </div>
          {imagesMechanic?.length > 0 && (
            <div className="mx-auto w-[90%]">
              <Badge className="text-sm mb-2">Imagenes al finalizar la solicitud</Badge>
              <Carousel className="w-full">
                <CarouselContent className="p-2">
                  {imagesMechanic?.length
                    ? imagesMechanic?.map((image, index) => (
                        <CarouselItem key={crypto.randomUUID()} className="md:basis-1/2 lg:basis-1/3  overflow-hidden">
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
            {row.original.repairlogs.map((log: any, index: any) => {
              const state = statuses.find((status) => status.value === log.title);
              const fullName =
                log.modified_by_user?.fullname ??
                `${log.modified_by_employee?.firstname} ${log.modified_by_employee?.lastname}`;

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
                        <div className="flex gap-2 items-center">
                          <div className="font-medium flex items-center">
                            {state?.icon && <state.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                            <span>{state?.label}</span>
                          </div>
                          <Badge variant={'outline'} className="m-0 flex items-center p-1">
                            {log.kilometer} kms
                          </Badge>
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {moment(log.created_at).calendar(null, {
                            sameDay: '[Hoy,] h:mm A', // Hoy a las 2:30 PM
                            nextDay: '[Mañana,] h:mm A', // Mañana a las 2:30 PM
                            nextWeek: 'dddd [a las] h:mm A', // Sábado a las 2:30 PM
                            lastDay: '[Ayer,] h:mm A', // Ayer a las 2:30 PM
                            lastWeek: '[El] dddd [pasado a las] h:mm A', // El sábado pasado a las 2:30 PM
                            sameElse: 'DD/MM/YYYY', // 07/10/2021
                          })}
                        </div>
                      </div>
                      <CardDescription>
                        {log.description} <br></br>
                      </CardDescription>
                      <CardDescription className="m-0 flex gap-2 items-center">
                        <PersonIcon />
                        {fullName}
                      </CardDescription>
                    </div>
                  </div>
                </>
              );
            })}
          </div>
        </div>
        <DialogClose id="close-modal-mechanic-colum2" />
        {onlyView ? (
          <Button
            onClick={() => {
              document.getElementById('close-modal-mechanic-colum2')?.click();
            }}
            type="submit"
          >
            Cerrar
          </Button>
        ) : row.original.state === 'Pendiente' ? (
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
}

export default RepairModal;
