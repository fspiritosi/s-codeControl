'use client'

import * as React from 'react'

import { CardDescription, CardHeader } from '@/components/ui/card'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { type Mail } from '../data'
import { FormDisplay, FormularioPersonalizado } from './mail-list'
// import { MailList } from './mail-list'
interface MailProps {
  accounts: {
    label: string
    email: string
    icon: React.ReactNode
  }[]
  mails: Mail[]
  defaultLayout?: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
}

interface Campo {
  tipo: string
  placeholder?: string
  opciones?: string[]
}

export function Mail({ defaultLayout = [265, 440, 655] }: MailProps) {
  const [campos, setCampos] = React.useState<Campo[]>([
    {
      tipo: 'Nombre del formulario',
      placeholder: 'Ingresa el nombre del formulario',
    }, // Campo por defecto
  ])

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(
            sizes,
          )}`
        }}
        className="h-full max-h-[800px] items-stretch p-0 m-0"
      >
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <div>
            <CardHeader>
              <h2 className="text-xl font-bold">Crear CheckList</h2>
              <CardDescription>
                Crear un nuevo CheckList para el mantenimiento de los equipos.
              </CardDescription>
            </CardHeader>
          </div>
          <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Tabs defaultValue="new">
              <TabsList className="ml-6">
                <TabsTrigger value="created">Creados</TabsTrigger>
                <TabsTrigger value="new">Nuevo</TabsTrigger>
              </TabsList>
              <Separator className="mt-3 mb-3" />
              <TabsContent value="created">
                <FormularioPersonalizado
                  setCampos={setCampos}
                  campos={campos}
                />
              </TabsContent>
              <TabsContent value="new">
                {/* <MailList items={mails} /> */}
                <FormularioPersonalizado
                  setCampos={setCampos}
                  campos={campos}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          {/* <MailDisplay
            mail={mails.find(item => item.id === mail.selected) || null}
          /> */}
          <FormDisplay campos={campos} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}
