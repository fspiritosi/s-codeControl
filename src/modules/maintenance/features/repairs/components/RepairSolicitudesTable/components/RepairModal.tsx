'use client';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/shared/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/shared/components/ui/carousel';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import { storage } from '@/shared/lib/storage';
import { updateVehicleById } from '@/modules/equipment/features/create/actions.server';
import {
  fetchRepairLogsBySolicitudId,
  fetchRepairSolicitudesByEquipment,
  updateRepairSolicitude,
} from '@/modules/maintenance/features/repairs/actions.server';
import { cn } from '@/shared/lib/utils';
import { PersonIcon } from '@radix-ui/react-icons';
import { format, isToday, isTomorrow, isYesterday, differenceInDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

function formatCalendar(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  if (isToday(date)) return `Hoy, ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Mañana, ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Ayer, ${format(date, 'h:mm a')}`;
  const daysDiff = differenceInDays(startOfDay(now), startOfDay(date));
  if (daysDiff > 0 && daysDiff < 7) return `El ${format(date, 'EEEE', { locale: es })} pasado a las ${format(date, 'h:mm a')}`;
  if (daysDiff < 0 && daysDiff > -7) return `${format(date, 'EEEE', { locale: es })} a las ${format(date, 'h:mm a')}`;
  return format(date, 'dd/MM/yyyy');
}
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { statuses } from '../data';

function RepairModal({ row, onlyView, action }: { row: any; onlyView?: boolean; action?: React.ReactNode }) {
  const state = statuses.find((status) => status.value === row.original.state);
  const [imageUrl, setImageUrl] = useState<string[]>([]);
  const [imagesMechanic, setImagesMechanic] = useState<(string | null)[]>([null, null, null]);
  const [repairSolicitudes, setRepairSolicitudes] = useState<any>([]);
  const [repairLogs, setRepairLogs] = useState<any[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isLogsLoading = isOpen && repairLogs === null;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    Promise.all([
      fetchRepairLogsBySolicitudId(row.original.id),
      fetchRepairSolicitudesByEquipment(row.original.vehicle_id),
    ])
      .then(([logs, solicitudes]) => {
        if (cancelled) return;
        setRepairLogs(logs);
        setRepairSolicitudes(solicitudes);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [isOpen, row.original.id, row.original.vehicle_id]);

  useEffect(() => {
    const fetchImageUrls = async () => {
      if (row.original.user_images) {
        const modifiedStrings = await Promise?.all(
          row.original.user_images?.map(async (str: any) => {
            return storage.getPublicUrl('repair_images', str);
          })
        );
        setImageUrl(modifiedStrings);
      }
    };

    fetchImageUrls();
    const modifiedStringsMechanic = row.original.mechanic_images
      ?.filter((e: any) => e)
      .map((str: any) => {
        return storage.getPublicUrl('repair_images', str?.slice(1));
      });
    setImagesMechanic(modifiedStringsMechanic);
  }, [row.original.user_images]);
  const endingStates = ['Finalizado', 'Cancelado', 'Rechazado'];

  const router = useRouter();

  const handleCancelSolicitud = async () => {
    const { error } = await updateRepairSolicitude(row.original.id, { state: 'Cancelado' });

    const vehicle_id = row.original.vehicle_id;

    const pendingRepairs = repairSolicitudes
      .filter((e: any) => !endingStates.includes(e.state))
      .filter((e: any) => e.id !== row.original.id);

    let newStatus = '';

    if (endingStates.includes('Cancelado')) {
      if (pendingRepairs.length === 0) {
        newStatus = 'operativo';
      } else {
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

    await updateVehicleById(vehicle_id, { condition: newStatus });

    if (error) {
      throw new Error(error);
    }
    document.getElementById('close-modal-mechanic-colum2')?.click();
    router.refresh();
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              <Badge className="w-fit">{(row.original.status as string)?.replaceAll('_', ' ')}</Badge>
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
                            <Image
                              src={image}
                              alt={`Imagen ${index + 1}`}
                              width={400}
                              height={400}
                              loading="lazy"
                              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
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
                    ? imagesMechanic?.map((image, index) =>
                        image ? (
                          <CarouselItem
                            key={crypto.randomUUID()}
                            className="md:basis-1/2 lg:basis-1/3  overflow-hidden"
                          >
                            <Card className="">
                              <Link target="_blank" href={image}>
                                <CardContent className="flex aspect-square items-center justify-center p-1">
                                  <Image
                                    src={image}
                                    alt={`Imagen ${index + 1}`}
                                    width={400}
                                    height={400}
                                    loading="lazy"
                                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                </CardContent>
                              </Link>
                            </Card>
                          </CarouselItem>
                        ) : null
                      )
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
          {isLogsLoading ? (
            <CardDescription>Cargando eventos...</CardDescription>
          ) : (
            <div className="relative flex flex-col gap-4 justify-start  w-full">
              {(repairLogs?.length ?? 0) > 0 && (
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-muted-foreground/20 " />
              )}
              {(repairLogs ?? []).map((log: any, index: number) => {
                const state = statuses.find((status) => status.value === log.title);
                const fullName =
                  log.modified_by_user?.fullname ??
                  `${log.modified_by_employee?.firstname ?? ''} ${log.modified_by_employee?.lastname ?? ''}`.trim();
                const logsCount = (repairLogs ?? []).length;

                return (
                  <div key={log.id} className="relative flex items-start gap-4">
                    <div
                      className={cn(
                        'relative  flex max-h-[40px] max-w-[40px] size-10 items-center justify-center rounded-full  text-primary-foreground aspect-square flex-shrink-0',
                        index + 1 === logsCount ? 'bg-primary' : 'bg-muted-foreground'
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
                          {formatCalendar(log.created_at)}
                        </div>
                      </div>
                      <CardDescription>
                        {log.description} <br />
                      </CardDescription>
                      <CardDescription className="m-0 flex gap-2 items-center">
                        <PersonIcon />
                        {fullName}
                      </CardDescription>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
