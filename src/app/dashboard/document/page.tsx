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
import { useLoggedUserStore } from '@/store/loggedUser'
import { ExpiredColums } from '../colums'
import { ExpiredDataTable } from '../data-table'

export default function page() {
  const { allDocumentsToShow } = useLoggedUserStore()
  return (
    <section className={'flex flex-col md:mx-7'}>
      <div className="flex justify-between flex-wrap flex-col">
        <div className="">
          <Card className=" dark:bg-slate-950 w-full grid grid-cols-1">
            <section>
              <CardHeader className=" mb-4 flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    Documentos cargados
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Aquí encontrarás todos los documentos cargados
                  </CardDescription>
                </div>
                <div className="flex gap-4 flex-wrap pl-6">
                  <DocumentNav />
                </div>
              </CardHeader>
              <Tabs defaultValue="Empleados">
                <CardContent>
                  <TabsList>
                    <TabsTrigger value="Empleados">Empleados</TabsTrigger>
                    <TabsTrigger value="Vehiculos">Vehiculos</TabsTrigger>
                  </TabsList>
                </CardContent>
                <TabsContent value="Empleados" className="">
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
