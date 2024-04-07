'use client'
import DocumentNav from '@/components/DocumentNav'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLoggedUserStore } from '@/store/loggedUser'
import { ExpiredColums } from '../colums'
import { ExpiredDataTable } from '../data-table'

export default function page() {
  const { allDocumentsToShow } = useLoggedUserStore()

  return (
    <section>
      <div className="flex justify-between flex-wrap flex-col">
        <div className="flex gap-3 flex-wrap ">
          <Card className="flex justify-center xl:justify-between mt-6 xl:flex-nowrap flex-wrap dark:bg-slate-950 w-full">
            <section className="w-full px-4">
              <div className="flex justify-between mb-3 items-center w-full">
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
                <div className="flex gap-4">
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
                <TabsContent value="Empleados">
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
                      'mandatory','state'
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
                      'state'
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
