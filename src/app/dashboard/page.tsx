'use client'
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { useLoggedUserStore } from "@/store/loggedUser"
import Link from "next/link"

export default function Home() {
  
  const user = useLoggedUserStore()  
  const employees = user.employees
  const equipment = user.vehicles
  const eNoAvalados = employees?.length >  0 ? employees.filter((employee: any) => employee.status === 'No avalado') : []
  const eAvalados = employees?.length > 0 ? employees.filter((employee: any) => employee.status === 'Avalado') : []
  const equiNoAvalados = equipment?.length > 0 ? equipment.filter((vehicle: any) => vehicle.status === 'No avalado') : []
  const equiAvalados = equipment?.length > 0 ? equipment.filter((vehicle: any) => vehicle.status === 'Avalado') : []
  

  return (
    <div >

      <section className="flex justify-center gap-10">
        <div className="flex gap-4">
        <Card className="md:min-w-[250px] text-center">
        <CardHeader>
          <CardTitle>Empleados totales</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-around items-center">
        <Badge variant='default' className="rounded-full text-lg">{employees?.length || 0}</Badge>
          <Link href="/dashboard/employee">
          <Button variant='primary'>ver todos</Button>
          </Link>
        </CardContent>
      </Card>
      <Card className="bg-lime-200 dark:bg-lime-800 md:min-w-[250px] text-center">
        <CardHeader>
          <CardTitle>Empleados Avalados</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-around items-center">
        <Badge variant='success' className="rounded-full text-lg ">{eAvalados.length}</Badge>
          <Button variant='success'>ver mas</Button>
        </CardContent>
      </Card>
      <Card className="bg-rose-200 dark:bg-rose-800 md:min-w-[250px] text-center">
        <CardHeader>
          <CardTitle>Empleados No Avalados</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-around items-center">
        <Badge variant='destructive' className="rounded-full text-lg">{eNoAvalados.length}</Badge>
          <Button variant='destructive'>ver mas</Button>
        </CardContent>
      </Card>
        </div>
      <div className="flex gap-4">
      <Card className="md:min-w-[250px] text-center">
        <CardHeader>
          <CardTitle>Equipos Totales</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-around items-center">
        <Badge variant='default' className="rounded-full text-lg">
          {equipment?.length || 0} 
        </Badge>
        <Link href="/dashboard/equipment">
          <Button variant='primary'>ver todos</Button>
        </Link>
        </CardContent>
        
      </Card>
      <Card className="bg-lime-200 dark:bg-lime-800 md:min-w-[250px] text-center">
        <CardHeader>
          <CardTitle>Equipos Avalados</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-around items-center">
          <Badge variant='success' className="rounded-full text-lg">
            {equiAvalados.length}
          </Badge>
          <Button variant='success'>ver mas</Button>
          
        </CardContent>
        
      </Card>
      <Card className="bg-rose-200 dark:bg-rose-800 md:min-w-[250px] text-center">
        <CardHeader>
          <CardTitle>Equipos No Avalados</CardTitle>
          
        </CardHeader>
        <CardContent className="flex justify-around items-center">
        <Badge variant='destructive' className="rounded-full text-lg">
          {equiNoAvalados.length} 
         
        </Badge>
          <Button variant='destructive'>ver todos</Button>
        </CardContent>
      </Card>
      </div>
      </section>
      
    </div>
  )
}
