'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RepairsSolicituds } from '@/types/types';
import moment from 'moment';
import Image from 'next/image';
import { useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';

export default function VehicleRepairRequests({
  onReturn,
  pendingRequests,
}: {
  onReturn: () => void;
  pendingRequests: RepairsSolicituds;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RepairsSolicituds[0] | null>(null);

  const openModal = (request: RepairsSolicituds[0]) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  return (
    <Card className="min-h-screen">
      <CardHeader className="flex justify-center">
        <div className="flex items-center justify-center mb-4">
          <Image src="/logoLetrasNegras.png" alt="CodeControl Logo" width={240} height={60} className="h-15" />
        </div>
        <CardDescription className="text-center text-gray-600">
          Sistema de Checklist y Mantenimiento de Equipos
        </CardDescription>
        <div className="flex justify-center">
          <Button onClick={onReturn} variant={'ghost'} className="self-end">
            <FiArrowLeft className="mr-2 h-6 w-6" />
            Regresar
          </Button>
        </div>
      </CardHeader>
      <ScrollArea className="min-h-full flex">
        <div className="p-4 space-y-4">
          {pendingRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="text-xl">{request.reparation_type.name}</span>
                  <Badge
                    variant={
                      request.reparation_type.criticity === 'Alta'
                        ? 'destructive'
                        : request.reparation_type.criticity === 'Media'
                          ? 'yellow'
                          : 'outline'
                    }
                  >
                    {request.reparation_type.criticity}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <strong>Dominio:</strong> {request.equipment_id.domain}
                  </div>
                  <div>
                    <strong>Equipo:</strong> {request.equipment_id.brand.name} {request.equipment_id.model.name}
                  </div>
                  <div>
                    <strong>Fecha:</strong>{' '}
                    {moment(request.created_at, 'YYYY-MM-DD').format('DD/MM/YYYY')}
                  </div>
                  <div>
                    <strong>Estado de la solicitud:</strong> <Badge variant={'outline'}>{request.state}</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => openModal(request)}>
                  Ver detalles
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedRequest?.reparation_type.name}</DialogTitle>
            <DialogDescription>Detalles de la reparación y del vehículo</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="vehicle" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vehicle">Vehículo</TabsTrigger>
              <TabsTrigger value="repair">Reparación</TabsTrigger>
            </TabsList>
            <TabsContent value="vehicle">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="font-bold">Marca:</span>
                  <span>{selectedRequest?.equipment_id.brand.name}</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="font-bold">Modelo:</span>
                  <span>{selectedRequest?.equipment_id.model.name}</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="font-bold">Año:</span>
                  <span>{selectedRequest?.equipment_id.year}</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="font-bold">Dominio:</span>
                  <span>{selectedRequest?.equipment_id.domain}</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="font-bold">Número interno:</span>
                  <span>{selectedRequest?.equipment_id.intern_number}</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="font-bold">Kilometraje:</span>
                  <span>{selectedRequest?.equipment_id.kilometer} km</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="font-bold">Condición:</span>
                  <span>{selectedRequest?.equipment_id.condition}</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="repair">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="font-bold">Estado:</span>
                  <span>{selectedRequest?.state}</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="font-bold">Prioridad:</span>
                  <span>{selectedRequest?.reparation_type.criticity}</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="font-bold">Tipo de mantenimiento:</span>
                  <span>{selectedRequest?.reparation_type.type_of_maintenance}</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="font-bold">Descripción:</span>
                  <span>{selectedRequest?.user_description}</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="font-bold">Descripción del mecánico:</span>
                  <span>{selectedRequest?.mechanic_description || 'No disponible'}</span>
                </div>
                {selectedRequest?.user_images?.length && selectedRequest?.user_images?.length > 0 && (
                  <div>
                    <span className="font-bold">Imágenes del usuario:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRequest?.user_images?.map((img, index) => (
                        <Image
                          key={index}
                          src={img}
                          alt={`User image ${index + 1}`}
                          width={100}
                          height={100}
                          className="rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {selectedRequest?.mechanic_images?.length && selectedRequest?.mechanic_images?.length > 0 && (
                  <div>
                    <span className="font-bold">Imágenes del mecánico:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRequest?.mechanic_images?.map((img, index) => (
                        <Image
                          key={index}
                          src={img}
                          alt={`Mechanic image ${index + 1}`}
                          width={100}
                          height={100}
                          className="rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
