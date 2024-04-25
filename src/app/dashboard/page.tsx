import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import CardButton from './componentDashboard/CardButton'
import CardNumber from './componentDashboard/CardNumber'
import DocumentsTable from './componentDashboard/DocumentsTable'
import EPendingDocumentTable from './componentDashboard/EPendingDocumentTable'
import EmployeesTable from './componentDashboard/EmployeesTable'
import VPendingDocumentTable from './componentDashboard/VPendingDocumentTable'

export default function Home() {
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
      <Card className="md:mx-7  grid grid-cols-1 mt-6 xl:grid-cols-2 dark:bg-slate-950">
        <section>
          <CardHeader>
            <CardTitle>Proximos vencimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Documentos que vencen en los proximos 30 dias
            </CardDescription>
          </CardContent>
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
        </section>
        <section className="">
          <CardHeader>
            <CardTitle>Documentos pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Documentos que aun no han sido aprobados
            </CardDescription>
          </CardContent>
          <Tabs defaultValue="Empleados">
            <CardContent>
              <TabsList>
                <TabsTrigger value="Empleados">Empleados</TabsTrigger>
                <TabsTrigger value="Vehiculos">Vehiculos</TabsTrigger>
              </TabsList>
            </CardContent>
            <TabsContent value="Empleados">
              <EPendingDocumentTable />
            </TabsContent>
            <TabsContent value="Vehiculos">
              <VPendingDocumentTable />
            </TabsContent>
          </Tabs>
        </section>
      </Card>
    </div>
  )
}
