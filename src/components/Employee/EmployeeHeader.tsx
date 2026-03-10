'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/BackButton';
import { Loader } from 'lucide-react';
import { EmployeeTerminationDialog } from './EmployeeTerminationDialog';
import { UseFormReturn } from 'react-hook-form';

interface EmployeeHeaderProps {
  accion: string | null;
  user: any;
  role: string | null;
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  form2: UseFormReturn<any>;
  onDelete: (values: any) => Promise<void>;
  today: Date;
  month: Date;
  setMonth: (v: Date) => void;
  yearsAhead: number[];
  years: string;
  setYear: (v: string) => void;
}

export function EmployeeHeader({
  accion,
  user,
  role,
  readOnly,
  setReadOnly,
  showModal,
  setShowModal,
  form2,
  onDelete,
  today,
  month,
  setMonth,
  yearsAhead,
  years,
  setYear,
}: EmployeeHeaderProps) {
  return (
    <header className="flex justify-between gap-4 flex-wrap">
      <CardHeader className="min-h-[152px] flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
        {accion === 'edit' || accion === 'view' ? (
          <div className="flex gap-3 items-center">
            <CardTitle className=" font-bold tracking-tight">
              <Avatar className="size-[100px] rounded-full border-2 border-black/30">
                <AvatarImage
                  className="object-cover rounded-full"
                  src={
                    user?.picture || 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80'
                  }
                  alt="Imagen del empleado"
                />
                <AvatarFallback>
                  <Loader className="animate-spin" />
                </AvatarFallback>
              </Avatar>
            </CardTitle>
            <CardDescription className="text-muted-foreground text-3xl flex items-center gap-4">
              {`${user?.lastname || 'cargando...'}
                ${user?.firstname || ''}`}{' '}
              {!user?.is_active && <Badge variant={'destructive'}>Dado de baja</Badge>}
            </CardDescription>
          </div>
        ) : (
          <h2 className="text-4xl">{accion === 'edit' ? 'Editar empleado' : 'Agregar empleado'}</h2>
        )}
        {role !== 'Invitado' && readOnly && accion === 'view' ? (
          <div className="flex flex-grap gap-2">
            <Button
              variant="default"
              onClick={() => {
                setReadOnly(false);
              }}
            >
              Habilitar edición
            </Button>
            <BackButton />
          </div>
        ) : (
          !readOnly &&
          accion !== 'new' &&
          role !== 'Invitado' && (
            <div className="flex flex-grap gap-2">
              <EmployeeTerminationDialog
                showModal={showModal}
                setShowModal={setShowModal}
                form2={form2}
                onDelete={onDelete}
                today={today}
                month={month}
                setMonth={setMonth}
                yearsAhead={yearsAhead}
                years={years}
                setYear={setYear}
              />
            </div>
          )
        )}
      </CardHeader>
    </header>
  );
}
