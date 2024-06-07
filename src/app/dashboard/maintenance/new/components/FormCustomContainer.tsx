'use client'
import { CardDescription, CardHeader } from '@/components/ui/card'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Campo, types } from '@/types/types'
import * as React from 'react'
import DisplayCreatedForms from './DisplayCreatedForms'
import { FormularioPersonalizado } from './FormCustom'
import { FormDisplay } from './FormDisplay'

export function FormCustomContainer({
  createdForms,
}: {
  createdForms: any[] | null
}) {
  const [campos, setCampos] = React.useState<Campo[]>([
    {
      tipo: types.NombreFormulario,
      placeholder: 'Ingresa el nombre del formulario',
      id: '1',
      title: 'Nombre del formulario',
      opciones: [],
    },
  ])

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full max-h-[800px] items-stretch p-0 m-0"
      >
        <ResizablePanel minSize={30}>
          <CardHeader className="bg-muted/50">
            <div>
              <h2 className="text-2xl font-bold">Crear CheckList</h2>
              <CardDescription>
                Crear un nuevo CheckList para el mantenimiento de los equipos.
              </CardDescription>
            </div>
          </CardHeader>
          <div className="backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-muted/50">
            <Tabs defaultValue="created">
              <div className="bg-muted/50 pb-3">
                <TabsList className="ml-6">
                  <TabsTrigger value="created">Creados</TabsTrigger>
                  <TabsTrigger value="new">Nuevo</TabsTrigger>
                </TabsList>
              </div>
              <Separator className="mb-3 mt-0" />
              <TabsContent value="created">
                <DisplayCreatedForms createdForms={createdForms} />
              </TabsContent>
              <TabsContent value="new">
                <FormularioPersonalizado
                  setCampos={setCampos}
                  campos={campos}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="relative" minSize={30}>
          <div className="absolute inset-0 h-full w-full bg-white dark:bg-slate-950/70 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:16px_16px] rounded-e-xl rounded "></div>
          <FormDisplay campos={campos} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}
