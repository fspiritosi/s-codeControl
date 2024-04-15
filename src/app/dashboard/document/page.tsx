'use client'
import DocumentNav from '@/components/DocumentNav'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useLoggedUserStore } from '@/store/loggedUser'
import { useSidebarOpen } from '@/store/sidebar'
import { ExpiredColums } from '../colums'
import { ExpiredDataTable } from '../data-table'

export default function page() {
  const { allDocumentsToShow } = useLoggedUserStore()
  const { expanded } = useSidebarOpen()
  return (
    <section
      className={cn(
        'flex flex-col md:mx-7',
        expanded ? 'md:max-w-[calc(100vw-198px)]' : 'md:max-w-[calc(100vw)]',
      )}
    >
      <div className="flex justify-between flex-wrap flex-col">
        <div className="">
          <Card className=" dark:bg-slate-950 w-full grid grid-cols-1">
            <section className="px-4">
              <div className="flex justify-between mb-3 items-center w-full flex-wrap">
                <div>
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      Documentos cargados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Aquí encontrarás todos los documentos cargados
                    </CardDescription>
                  </CardContent>
                </div>
                <div className="flex gap-4 flex-wrap pl-6">
                  <DocumentNav />
                </div>
              </div>
              <Tabs defaultValue="Empleados">
                <CardContent>
                  <TabsList>
                    <TabsTrigger value="Empleados">Empleados</TabsTrigger>
                    <TabsTrigger value="Vehiculos">Vehiculos</TabsTrigger>
                  </TabsList>
                </CardContent>
                <TabsContent value="Empleados" className=''>
                  <ExpiredDataTable
                    data={allDocumentsToShow?.employees || []}
                    // setShowLastMonthDocuments={setShowLastMonthDocuments}
                    columns={ExpiredColums}
                    pending={true}
                    defaultVisibleColumnsCustom={[
                      'date',
                      'resource',
                      'documentName',
                      'validity',
                      'id',
                      'mandatory',
                      'state',
                    ]}
                  />
                </TabsContent>
                <TabsContent value="Vehiculos">
                  <ExpiredDataTable
                    data={allDocumentsToShow?.vehicles || []}
                    columns={ExpiredColums}
                    vehicles={true}
                    pending={true}
                    defaultVisibleColumnsCustom={[
                      'date',
                      'resource',
                      'documentName',
                      'validity',
                      'id',
                      'mandatory',
                      'state',
                    ]}
                  />
                </TabsContent>
              </Tabs>
            </section>
          </Card>
        </div>
      </div>
    </section>
  )
}
