'use client';

import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export function EquipemtTypesChart({ equipments }: { equipments: VehicleWithBrand[] }) {
  // Agregar conteo de empleados por nivel de educación (dinámicamente)
  const educationData = equipments.reduce((acc: any, employee: any) => {
    if (employee.type.name) {
      acc[employee.type.name] = (acc[employee.type.name] || 0) + 1;
    }
    return acc;
  }, {});

  const chartData = Object.keys(educationData).map((educationLevel) => ({
    categoria: educationLevel,
    cantidad: educationData[educationLevel],
  }));

  // Generar colores dinámicos (opcional, puedes ajustar esto si prefieres colores fijos)
  const chartConfig = chartData.reduce(
    (acc, item, index) => {
      acc[item.categoria] = {
        label: item.categoria,
        color: `hsl(${(index * 60) % 160}, 20%, 50%)`, // Colores dinámicos basados en el índice
      };
      return acc;
    },
    {} as Record<string, { label: string; color: string }>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución tipos de equipos</CardTitle>
        <CardDescription>Equipos segun el tipo</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="categoria" tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="cantidad" fill={chartConfig[chartData[0].categoria].color} radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Tendencia al alza del 5.2% este mes <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Mostrando un total de {equipments.length} equipos
        </div>
      </CardFooter>
    </Card>
  );
}
