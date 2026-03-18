import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Users, Truck } from 'lucide-react';
import Link from 'next/link';
import CardButton from '@/modules/dashboard/features/overview/components/CardButton';
import CardNumber from '@/modules/dashboard/features/overview/components/CardNumber';

function CardsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Empleados totales</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <CardNumber nameData="Empleados totales" variant="default" />
          <Link href="/dashboard/employee">
            <CardButton functionName="setActivesEmployees" />
          </Link>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Empleados Avalados</CardTitle>
            <Users className="size-4 text-emerald-500" />
          </div>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <CardNumber nameData="Empleados Avalados" variant="success" />
          <Link href="/dashboard/employee">
            <CardButton functionName="setEndorsedEmployees" />
          </Link>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Empleados No Avalados</CardTitle>
            <Users className="size-4 text-red-500" />
          </div>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <CardNumber nameData="Empleados No Avalados" variant="destructive" />
          <Link href="/dashboard/employee">
            <CardButton functionName="noEndorsedEmployees" />
          </Link>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Equipos Totales</CardTitle>
            <Truck className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <CardNumber nameData="Vehículos totales" variant="default" />
          <Link href="/dashboard/equipment">
            <CardButton functionName="setActivesVehicles" />
          </Link>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Equipos Avalados</CardTitle>
            <Truck className="size-4 text-emerald-500" />
          </div>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <CardNumber nameData="Vehículos Avalados" variant="success" />
          <Link href="/dashboard/equipment">
            <CardButton functionName="endorsedVehicles" />
          </Link>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Equipos No Avalados</CardTitle>
            <Truck className="size-4 text-red-500" />
          </div>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <CardNumber nameData="Vehículos No Avalados" variant="destructive" />
          <Link href="/dashboard/equipment">
            <CardButton functionName="noEndorsedVehicles" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default CardsGrid;
