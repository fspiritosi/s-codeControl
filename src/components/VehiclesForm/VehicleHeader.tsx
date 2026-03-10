'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/BackButton';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { RiToolsFill } from 'react-icons/ri';

const variants: any = {
  operativo: 'success',
  'no operativo': 'destructive',
  'en reparación': 'yellow',
  'operativo condicionado': 'info',
  default: 'default',
};

const conditionConfig: any = {
  'operativo condicionado': { color: 'bg-blue-500', icon: AlertTriangle },
  operativo: { color: 'bg-green-500', icon: CheckCircle },
  'no operativo': { color: 'bg-red-500', icon: XCircle },
  'en reparación': { color: 'bg-yellow-500', icon: RiToolsFill },
};

interface VehicleHeaderProps {
  accion: string | null;
  vehicle: any;
  role?: string;
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
}

export function VehicleHeader({ accion, vehicle, role, readOnly, setReadOnly }: VehicleHeaderProps) {
  return (
    <header className="flex justify-between gap-4 flex-wrap">
      <div className="mb-4 flex justify-between w-full">
        <CardHeader className="h-[152px] flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
          {accion === 'edit' || accion === 'view' ? (
            <div className="flex gap-3 items-center">
              <CardTitle className=" font-bold tracking-tight">
                <Avatar className="size-[100px]">
                  <AvatarImage
                    className="object-cover border-2 border-black/30 rounded-full"
                    src={vehicle?.picture || 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80'}
                    alt="Imagen del empleado"
                  />
                  <AvatarFallback>CC</AvatarFallback>
                </Avatar>
              </CardTitle>
              <div className="text-muted-foreground text-2xl flex flex-col">
                <div>Tipo de equipo: {vehicle?.type?.name}</div>
                <div>Numero interno: {vehicle?.intern_number}</div>
                <Badge className="w-fit mt-2 capitalize" variant={variants[(vehicle?.condition as any) || 'default'] as any}>
                  <>
                    {React.createElement(
                      conditionConfig[vehicle?.condition || ('default' as keyof typeof conditionConfig)]?.icon || 's',
                      { className: 'mr-2 size-4' }
                    )}
                    {vehicle?.condition}
                  </>
                </Badge>
              </div>
            </div>
          ) : (
            <div>
              <CardTitle className="font-bold tracking-tight text-3xl">
                {accion === 'edit' ? 'Editar equipo' : accion === 'view' ? `Equipo ${vehicle?.type_of_vehicle} ${vehicle?.intern_number}` : 'Agregar equipo'}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xl">
                {accion === 'edit' || accion === 'view'
                  ? `${readOnly ? 'Vista previa de equipo' : ' En esta vista puedes editar los datos del equipo'}`
                  : 'En esta vista puedes agregar un nuevo equipo'}
              </CardDescription>
            </div>
          )}
          <div className="mt-4 flex flex-row gap-2">
            {role !== 'Invitado' && readOnly && accion === 'view' && (
              <div className="flex flex-row gap-2">
                <Button variant="default" onClick={() => setReadOnly(false)}>
                  Habilitar edición
                </Button>
              </div>
            )}
            <div className="flex flex-row gap-2">
              <BackButton />
            </div>
          </div>
        </CardHeader>
      </div>
    </header>
  );
}
