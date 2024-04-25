import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCompany, getEmployees, getEquipment } from '@/lib/serverFetch'
import Link from 'next/link'
import CardButton from './componentDashboard/CardButton'
import DocumentsTable from './componentDashboard/DocumentsTable'
import EPendingDocumentTable from './componentDashboard/EPendingDocumentTable'
import EmployeesTable from './componentDashboard/EmployeesTable'
import VPendingDocumentTable from './componentDashboard/VPendingDocumentTable'
import { cookies } from 'next/headers'


export default async function Home() {
  // const actualCompany = cookies().get('actualCompanyId')?.value

  console.log('render',cookies())

  const employees = await getEmployees()
  const equipment = await getEquipment()
  // console.log('employees',employees)
  // console.log('actualCompany',actualCompany)

  const eNoAvalados =
    employees?.filter((employee: any) => employee.status === 'No avalado') || []

  const eAvalados =
    employees?.filter((employee: any) => employee.status === 'Avalado') || []

  const equiNoAvalados =
    equipment?.filter((vehicle: any) => vehicle.status === 'No avalado') || []
  const equiAvalados =
    equipment?.filter((vehicle: any) => vehicle.status === 'Avalado') || []

  return (
    <div>
      <section className="grid sm:grid-cols-2 grid-cols-1 gap-6 mx-7">
        <div className="flex gap-3 flex-wrap justify-center ">
          <Card className="min-w-[250px]">
            <CardHeader>
              <CardTitle>Empleados totales</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center">
              <Badge variant="default" className="rounded-full text-lg">
                {employees?.length || 0}
              </Badge>
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
              <Badge variant="success" className="rounded-full text-lg ">
                {eAvalados.length}
              </Badge>
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
              <Badge variant="destructive" className="rounded-full text-lg">
                {eNoAvalados.length}
              </Badge>
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
              <Badge variant="default" className="rounded-full text-lg">
                {equipment?.length || 0}
              </Badge>
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
              <Badge variant="success" className="rounded-full text-lg">
                {equiAvalados.length}
              </Badge>
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
              <Badge variant="destructive" className="rounded-full text-lg">
                {equiNoAvalados.length}
              </Badge>
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
