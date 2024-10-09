"use client"

import { useState, useEffect } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { Button } from "@/components/ui/button"
import { LockIcon, UnlockIcon } from 'lucide-react'
import { ResoursesChart } from '@/components/Graficos/ResousrsesChart'
import { MissingDocumentList } from '@/components/MissingDocumentList'
import DocumentsTable from '@/app/dashboard/componentDashboard/DocumentsTable'
import EmployeesTable from '@/app/dashboard/componentDashboard/EmployeesTable'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface LayoutItem extends Layout {
  i: string
  x: number
  y: number
  w: number
  h: number
}

const initialLayout: LayoutItem[] = [
  { i: 'resources', x: 0, y: 0, w: 3, h: 10 },
  { i: 'missingDocuments', x: 0, y: 8, w: 3, h: 10 },
  { i: 'expiringDocuments', x: 3, y: 0, w: 9, h: 20 },
]

const LAYOUT_STORAGE_KEY = 'dashboardLayout'

export default function DashboardComponentt() {
  const [layout, setLayout] = useState<LayoutItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY)
      return savedLayout ? JSON.parse(savedLayout) : initialLayout
    }
    return initialLayout
  })
  const [isEditable, setIsEditable] = useState(false)

  useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout))
  }, [layout])

  const onLayoutChange = (newLayout: Layout[]) => {
    if (isEditable) {
      setLayout(newLayout as LayoutItem[])
    }
  }

  const toggleEditable = () => {
    setIsEditable(!isEditable)
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Button onClick={toggleEditable} variant="outline">
          {isEditable ? (
            <>
              <LockIcon className="mr-2 h-4 w-4" /> Bloquear Layout
            </>
          ) : (
            <>
              <UnlockIcon className="mr-2 h-4 w-4" /> Desbloquear Layout
            </>
          )}
        </Button>
      </div>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        onLayoutChange={onLayoutChange}
        isDraggable={isEditable}
        isResizable={false}
        useCSSTransforms={false}
      >
        <div key="resources">
          {/* <ResoursesChart /> */}
        </div>
        <div key="missingDocuments">
          <MissingDocumentList />
        </div>
        <div key="expiringDocuments">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-start bg-muted dark:bg-muted/50 border-b-2">
              <div className="grid gap-1">
                <CardTitle className="flex items-center text-lg">Proximos vencimientos</CardTitle>
                <CardDescription className="capitalize">Documentos que vencen en los proximos 30 dias</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              <Tabs defaultValue="Empleados">
                <TabsList>
                  <TabsTrigger value="Empleados">Empleados</TabsTrigger>
                  <TabsTrigger value="Vehiculos">Vehiculos</TabsTrigger>
                </TabsList>
                <TabsContent value="Empleados">
                  <EmployeesTable />
                </TabsContent>
                <TabsContent value="Vehiculos">
                  <DocumentsTable />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
          </Card>
        </div>
      </ResponsiveGridLayout>
    </div>
  )
}