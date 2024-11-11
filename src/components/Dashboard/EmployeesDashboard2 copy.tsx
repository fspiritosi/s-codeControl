'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

export function ComponentContract({ employees }: { employees: any[] }) {
  // Contar las posiciones en la empresa de los empleados
  const companyPositionData = React.useMemo(() => {
    const positionCount: Record<string, number> = {};
    employees.forEach((employee) => {
      const position = employee.company_position || 'Sin posición';
      positionCount[position] = (positionCount[position] || 0) + 1;
    });
    return Object.entries(positionCount).map(([position, count]) => ({
      position,
      count,
      fill: `hsl(${Math.random() * 360}, 70%, 50%)`, // Colores generados aleatoriamente
    }));
  }, [employees]);

  // Configuración del gráfico
  const chartConfig: ChartConfig = companyPositionData.reduce(
    (config, { position }, index) => {
      config[position] = {
        label: position,
        color: `hsl(${index * 60}, 70%, 50%)`,
      };
      return config;
    },
    {} as ChartConfig
  );

  const totalEmployees = companyPositionData.reduce((acc, { count }) => acc + count, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart - Posiciones en la Empresa</CardTitle>
        <CardDescription>Distribución de las posiciones de los empleados</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[350px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={companyPositionData}
              dataKey="count"
              nameKey="position"
              innerRadius={90}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalEmployees}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Empleados
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Mostrando distribución de posiciones en la empresa
        </div>
      </CardFooter>
    </Card>
  );
}
