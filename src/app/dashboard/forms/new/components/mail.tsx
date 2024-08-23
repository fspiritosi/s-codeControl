'use client';
import { CardDescription, CardHeader } from '@/components/ui/card';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useLoggedUserStore } from '@/store/loggedUser';
import * as React from 'react';
import { FormDisplay, FormularioPersonalizado } from './mail-list';
interface MailProps {
  defaultLayout?: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

enum types {
  Texto = 'Texto',
  AreaTexto = 'Área de texto',
  Separador = 'Separador',
  NombreFormulario = 'Nombre del formulario',
  Radio = 'Radio',
  SeleccionMultiple = 'Seleccion multiple',
  Date = 'Fecha',
  Seleccion = 'Seleccion',
  SeleccionPredefinida = 'Seleccion Predefinida',
  Subtitulo = 'Subtitulo',
}

interface Campo {
  tipo: types;
  placeholder?: string;
  opciones?: string[];
  value?: string;
  id: string;
  title?: string;
}
export function Mail() {
  const [campos, setCampos] = React.useState<Campo[]>([
    {
      tipo: types.NombreFormulario,
      placeholder: 'Ingresa el nombre del formulario',
      id: '1',
    },
  ]);

  const actualCompany = useLoggedUserStore((state) => state.actualCompany);

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`;
        }}
        className="h-full max-h-[800px] items-stretch p-0 m-0"
      >
        <ResizablePanel minSize={30}>
          <CardHeader>
            <div>
              <h2 className="text-2xl font-bold">Crear formulario</h2>
              <CardDescription>Crear un nuevo formulario para el mantenimiento de los equipos.</CardDescription>
            </div>
          </CardHeader>
          <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Tabs defaultValue="new">
              <TabsList className="ml-6">
                <TabsTrigger disabled value="created">
                  Creados
                </TabsTrigger>
                <TabsTrigger value="new">Nuevo</TabsTrigger>
              </TabsList>
              <Separator className="mt-3 mb-3" />
              <TabsContent value="created">
                <FormularioPersonalizado setCampos={setCampos} campos={campos} />
              </TabsContent>
              <TabsContent value="new">
                {/* <MailList items={mails} /> */}
                <FormularioPersonalizado setCampos={setCampos} campos={campos} />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          className="relative"
          // defaultSize={defaultLayout[1]}
          minSize={30}
        >
          <div className="absolute inset-0 h-full w-full bg-white dark:bg-slate-950/70 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:16px_16px] rounded-e-xl rounded "></div>
          <FormDisplay campos={campos} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
