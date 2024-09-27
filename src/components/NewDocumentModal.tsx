'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dispatch, SetStateAction } from 'react';
import MultiResourceDocument from './MultiResourceDocument';
import SimpleDocument from './SimpleDocument';
import { AlertDialog, AlertDialogContent } from './ui/alert-dialog';
import { Separator } from './ui/separator';

export default function NewDocumentModal({
  setIsOpen,
  isOpen,
  multiresource,
  empleados,
  equipment,
  documentNumber,
}: {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  isOpen: boolean;
  multiresource: boolean | undefined;
  empleados?: boolean;
  equipment?: boolean;
  documentNumber?: string;
}) {
  const handleOpen = () => {
    setIsOpen(!isOpen);
    return;
  };

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={handleOpen}>
        <AlertDialogContent className="max-h-[90dvh] overflow-y-auto dark:bg-slate-950">
          <Tabs defaultValue={empleados ? 'Empleados' : 'Equipos'} className="p-2">
            <TabsList className="">
              {empleados && <TabsTrigger value="Empleados">Empleados</TabsTrigger>}
              {equipment && <TabsTrigger value="Equipos">Equipos</TabsTrigger>}
            </TabsList>
            <TabsContent value="Empleados" className="space-y-2 dark:bg-slate-950">
              {!multiresource && (
                <>
                  {' '}
                  <h2 className="text-lg font-semibold">Documento No multirecurso</h2>
                  <Separator className="my-1" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Verifica que los documentos sean correctos y no hayan entradas duplicadas, en tal caso se subira la
                    primera entrada encontrada y se marcaran las demas como duplicadas
                  </p>
                </>
              )}
              <div className="space-y-3">
                {multiresource ? (
                  <MultiResourceDocument
                    resource="empleado" //empleado o equipo
                    handleOpen={handleOpen} //funcion para abrir/cerrar
                  />
                ) : (
                  <SimpleDocument numberDocument={documentNumber} resource="empleado" handleOpen={handleOpen} />
                )}
              </div>
            </TabsContent>
            <TabsContent value="Equipos">
              <div className="space-y-2">
                {!multiresource && (
                  <>
                    {' '}
                    <h2 className="text-lg font-semibold">Documento No multirecurso</h2>
                    <Separator className="my-1" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Verifica que los documentos sean correctos y no hayan entradas duplicadas, en tal caso se subira
                      la primera entrada encontrada y se marcaran las demas como duplicadas
                    </p>
                  </>
                )}
                {multiresource ? (
                  <MultiResourceDocument
                    resource="equipo" //empleado o equipo
                    handleOpen={handleOpen} //funcion para abrir/cerrar
                  />
                ) : (
                  <SimpleDocument numberDocument={documentNumber} resource="equipo" handleOpen={handleOpen} />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
