'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';
import React from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';

export function ComponentStatusEquipment({ equipments }: { equipments: VehicleWithBrand[] }) {
  // Contar los estados de los empleados
  const statusData = React.useMemo(() => {
    const statusCount: Record<string, number> = {};
    equipments.forEach((employee) => {
      const status = employee.condition || 'Sin estado';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([status, count]) => ({
      status,
      cantidad: count,
      fill: `hsl(${Math.random() * 360}, 70%, 50%)`, // Colores generados aleatoriamente
    }));
  }, [equipments]);

  // Configuración del gráfico
  const chartConfig: ChartConfig = statusData.reduce((config, { status }, index) => {
    config[status] = {
      label: status,
      color: `hsl(${index * 60}, 70%, 50%)`,
    };
    return config;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Condicion de Equipos</CardTitle>
        <CardDescription>Distribución de los condicion de los Equipos</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            data={statusData}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="status"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={110} // Ancho aumentado para acomodar nombres largos
              tick={{ fontSize: 12, width: 140, overflow: 'visible' }} // Tamaño de fuente reducido
            />
            <XAxis type="number" />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar dataKey="cantidad" layout="vertical" radius={4} fill="var(--color-desktop)">
              <LabelList dataKey="cantidad" position="right" offset={8} className="fill-foreground" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Tendencia de la condicion de los Equipos
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">Mostrando la condicion de los Equipos</div>
      </CardFooter>
    </Card>
  );
}
