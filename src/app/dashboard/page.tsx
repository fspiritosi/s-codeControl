'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useLoggedUserStore } from '@/store/loggedUser'
import { VehiclesActualCompany } from '@/store/vehicles'
import Link from 'next/link'
import { ExpiredColums } from './colums'
import { ExpiredDataTable } from './data-table'

export default function Home() {
  const user = useLoggedUserStore()
  const employees = user.employees
  const equipment = user.vehicles
  const eNoAvalados =
    employees?.length > 0
      ? employees.filter((employee: any) => employee.status === 'No avalado')
      : []
  const eAvalados =
    employees?.length > 0
      ? employees.filter((employee: any) => employee.status === 'Avalado')
      : []
  const equiNoAvalados =
    equipment?.length > 0
      ? equipment.filter((vehicle: any) => vehicle.status === 'No avalado')
      : []
  const equiAvalados =
    equipment?.length > 0
      ? equipment.filter((vehicle: any) => vehicle.status === 'Avalado')
      : []
  const setEndorsedEmployees = useLoggedUserStore(
    state => state.endorsedEmployees,
  )
  const setActivesEmployees = useLoggedUserStore(
    state => state.setActivesEmployees,
  )
  const noEndorsedEmployees = useLoggedUserStore(
    state => state.noEndorsedEmployees,
  )
  const setActivesVehicles = VehiclesActualCompany(
    state => state.setActivesVehicles,
  )
  const endorsedVehicles = VehiclesActualCompany(
    state => state.endorsedVehicles,
  )
  const noEndorsedVehicles = VehiclesActualCompany(
    state => state.noEndorsedVehicles,
  )
  const documentsToShow = useLoggedUserStore(state => state.documentsToShow)


  const setShowLastMonthDocuments = useLoggedUserStore(
    state => state.setShowLastMonthDocuments,
  )

  const pendingDocuments = useLoggedUserStore(state => state.pendingDocuments)

  return (
    <div>
      <section className="flex justify-center gap-5 flex-wrap">
        <div className="flex gap-3 flex-wrap">
          <Card className="md:min-w-[250px] text-center">
            <CardHeader>
              <CardTitle>Empleados totales</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center">
              <Badge variant="default" className="rounded-full text-lg">
                {employees?.length || 0}
              </Badge>
              <Link href="/dashboard/employee">
                <Button variant="primary" onClick={() => setActivesEmployees()}>
                  ver todos
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-lime-200 dark:bg-lime-800 md:min-w-[250px] text-center">
            <CardHeader>
              <CardTitle>Empleados Avalados</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center">
              <Badge variant="success" className="rounded-full text-lg ">
                {eAvalados.length}
              </Badge>
              <Link href="/dashboard/employee">
                <Button
                  variant="primary"
                  onClick={() => setEndorsedEmployees()}
                >
                  ver mas
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-rose-200 dark:bg-rose-800 md:min-w-[250px] text-center">
            <CardHeader>
              <CardTitle>Empleados No Avalados</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center">
              <Badge variant="destructive" className="rounded-full text-lg">
                {eNoAvalados.length}
              </Badge>
              <Link href="/dashboard/employee">
                <Button variant="primary" onClick={() => noEndorsedEmployees()}>
                  ver mas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <div className="flex gap-4 flex-wrap">
          <Card className="md:min-w-[250px] text-center">
            <CardHeader>
              <CardTitle>Equipos Totales</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center">
              <Badge variant="default" className="rounded-full text-lg">
                {equipment?.length || 0}
              </Badge>
              <Link href="/dashboard/equipment">
                <Button variant="primary" onClick={() => setActivesVehicles()}>
                  ver todos
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-lime-200 dark:bg-lime-800 md:min-w-[250px] text-center">
            <CardHeader>
              <CardTitle>Equipos Avalados</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center">
              <Badge variant="success" className="rounded-full text-lg">
                {equiAvalados.length}
              </Badge>
              <Link href="/dashboard/equipment">
                <Button variant="primary" onClick={() => endorsedVehicles()}>
                  ver mas
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-rose-200 dark:bg-rose-800 md:min-w-[250px] text-center">
            <CardHeader>
              <CardTitle>Equipos No Avalados</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center">
              <Badge variant="destructive" className="rounded-full text-lg">
                {equiNoAvalados.length}
              </Badge>
              <Link href="/dashboard/equipment">
                <Button variant="primary" onClick={() => noEndorsedVehicles()}>
                  ver todos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
      <Card className="flex justify-center xl:justify-between mt-6 xl:flex-nowrap flex-wrap dark:bg-slate-950">
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
              <ExpiredDataTable
                data={documentsToShow?.employees || []}
                setShowLastMonthDocuments={setShowLastMonthDocuments}
                columns={ExpiredColums}
              />
            </TabsContent>
            <TabsContent value="Vehiculos">
              <ExpiredDataTable
                data={documentsToShow?.vehicles || []}
                setShowLastMonthDocuments={setShowLastMonthDocuments}
                columns={ExpiredColums}
                vehicles={true}
              />
            </TabsContent>
          </Tabs>
        </section>
        <section>
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
              <ExpiredDataTable
                data={pendingDocuments?.employees || []}
                columns={ExpiredColums}
                pending={true}
              />
            </TabsContent>
            <TabsContent value="Vehiculos">
              <ExpiredDataTable
                data={pendingDocuments?.vehicles || []}
                columns={ExpiredColums}
                pending={true}
                vehicles={true}
              />
            </TabsContent>
          </Tabs>
        </section>
      </Card>
    </div>
  )
}
