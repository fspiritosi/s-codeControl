import { MissingDocumentList } from '@/components/MissingDocumentList'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import CardButton from './componentDashboard/CardButton'
import CardNumber from './componentDashboard/CardNumber'
import DocumentsTable from './componentDashboard/DocumentsTable'
import EmployeesTable from './componentDashboard/EmployeesTable'

export default async function Home() {
  return (
    <div>
      <section className="grid sm:grid-cols-2 grid-cols-1 gap-6 mx-7">
        <div className="flex gap-3 flex-wrap justify-center ">
          <Card className="min-w-[250px]">
            <CardHeader>
              <CardTitle>Empleados totales</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center">
              <CardNumber nameData="Empleados totales" variant="default" />
              <Link href="/dashboard/employee">
                <CardButton functionName="setActivesEmployees" />
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-lime-200 dark:bg-lime-800 min-w-[250px] text-center">
            <CardHeader>
              <CardTitle>Empleados Avalados</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center">
              <CardNumber nameData="Empleados Avalados" variant="success" />
              <Link href="/dashboard/employee">
                <CardButton functionName="setEndorsedEmployees" />
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-rose-200 dark:bg-rose-800 min-w-[250px] text-center">
            <CardHeader>
              <CardTitle>Empleados No Avalados</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center">
              <CardNumber
                nameData="Empleados No Avalados"
                variant="destructive"
              />
              <Link href="/dashboard/employee">
                <CardButton functionName="noEndorsedEmployees" />
              </Link>
            </CardContent>
          </Card>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Card className="min-w-[250px] text-center">
            <CardHeader>
              <CardTitle>Equipos Totales</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center">
              <CardNumber nameData="Vehículos totales" variant="default" />
              <Link href="/dashboard/equipment">
                <CardButton functionName="setActivesVehicles" />
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-lime-200 dark:bg-lime-800 min-w-[250px] text-center">
            <CardHeader>
              <CardTitle>Equipos Avalados</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center">
              <CardNumber nameData="Vehículos Avalados" variant="success" />
              <Link href="/dashboard/equipment">
                <CardButton functionName="endorsedVehicles" />
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-rose-200 dark:bg-rose-800 min-w-[250px] text-center">
            <CardHeader>
              <CardTitle>Equipos No Avalados</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center">
              <CardNumber
                nameData="Vehículos No Avalados"
                variant="destructive"
              />
              <Link href="/dashboard/equipment">
                <CardButton functionName="noEndorsedVehicles" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="md:mx-7 grid grid-cols-1 mt-6 xl:grid-cols-3 gap-3 mb-4">
        <Card className="col-span-2 flex flex-col justify-between overflow-hidden">
          <div>
            <CardHeader className="flex flex-row items-start bg-muted dark:bg-muted/50 border-b-2">
              <div className="grid gap-1">
                <CardTitle className="flex items-center text-lg ">
                  Proximos vencimientos
                </CardTitle>
                <CardDescription className="capitalize">
                  Documentos que vencen en los proximos 30 dias
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent></CardContent>
            <div>
              <Tabs defaultValue="Empleados">
                <CardContent>
                  <TabsList>
                    <TabsTrigger value="Empleados">Empleados</TabsTrigger>
                    <TabsTrigger value="Vehiculos">Vehiculos</TabsTrigger>
                  </TabsList>
                </CardContent>
                <TabsContent value="Empleados">
                  <EmployeesTable />
                </TabsContent>
                <TabsContent value="Vehiculos">
                  <DocumentsTable />
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
        </Card>
        <section>
          <MissingDocumentList />
        </section>
      </section>
    </div>
  )
}
