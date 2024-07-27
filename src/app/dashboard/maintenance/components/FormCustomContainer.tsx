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
import { supabaseBrowser } from '@/lib/supabase/browser'
import { Campo, types } from '@/types/types'
import cookie from 'js-cookie'
import { useEffect, useState } from 'react'
import DisplayCreatedForms from './DisplayCreatedForms'
import { FormCustom } from './FormCustom'
import { FormDisplay } from './FormDisplay'
export function FormCustomContainer() {
  const [createdFormsState, setCreatedFormsState] = useState<any[] | undefined>(
    undefined,
  )
  const [campos, setCampos] = useState<Campo[]>([
    {
      tipo: types.NombreFormulario,
      placeholder: 'Ingresa el nombre del formulario',
      id: '1',
      title: 'Nombre del formulario',
      opciones: [],
    },
  ])
  const [selectedForm, setSelectedForm] = useState<Campo[] | undefined>([])
  const [selectedTab, setSelectedTab] = useState<'created' | 'new'>('created')
  const companyId = cookie.get('actualComp')
  const fetchForms = async () => {
    if (!companyId) return
    const supabase = supabaseBrowser()
    const { data, error } = await supabase
      .from('custom_form')
      .select('*')
      .eq('company_id', companyId)
    if (error) {
      console.log(error)
    }
    if (data) {
      setCreatedFormsState(data)
    }
  }

  useEffect(() => {
    fetchForms()
  }, [])

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
            <Tabs value={selectedTab} defaultValue="created">
              <div className="bg-muted/50 pb-3">
                <TabsList className="ml-6">
                  <TabsTrigger
                    value="created"
                    onClick={() => setSelectedTab('created')}
                  >
                    Creados
                  </TabsTrigger>
                  <TabsTrigger
                    value="new"
                    onClick={() => setSelectedTab('new')}
                  >
                    Nuevo
                  </TabsTrigger>
                </TabsList>
              </div>
              <Separator className="mb-3 mt-0" />
              <TabsContent value="created">
                <DisplayCreatedForms
                  createdForms={createdFormsState}
                  setSelectedForm={setSelectedForm}
                />
              </TabsContent>
              <TabsContent value="new">
                <FormCustom
                  setCampos={setCampos}
                  campos={campos}
                  setSelectedForm={setSelectedForm}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="relative" minSize={30}>
          <div className="absolute inset-0 h-full w-full bg-white dark:bg-slate-950/70 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:16px_16px] rounded-e-xl rounded "></div>
          <FormDisplay
            campos={selectedForm ?? campos}
            selectedForm={selectedForm}
            setSelectedTab={setSelectedTab}
            setCampos={setCampos}
            fetchForms={fetchForms}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}