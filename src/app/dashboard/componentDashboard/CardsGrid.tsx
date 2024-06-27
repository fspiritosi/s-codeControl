import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import CardButton from './CardButton';
import CardNumber from './CardNumber';

function CardsGrid() {
  return (
    <>
      <div className="flex gap-3 flex-wrap justify-center ">
        <Card className="min-w-[250px] bg-muted dark:bg-muted/50">
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
        <Card className="bg-lime-200 dark:bg-green-300/40 min-w-[250px] text-center">
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
            <CardNumber nameData="Empleados No Avalados" variant="destructive" />
            <Link href="/dashboard/employee">
              <CardButton functionName="noEndorsedEmployees" />
            </Link>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <Card className="min-w-[250px] text-center bg-muted dark:bg-muted/50">
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
        <Card className="bg-lime-200 dark:bg-green-300/40 min-w-[250px] text-center">
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
            <CardNumber nameData="Vehículos No Avalados" variant="destructive" />
            <Link href="/dashboard/equipment">
              <CardButton functionName="noEndorsedVehicles" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default CardsGrid;
