'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from 'recharts';

export function FormUseChart({
  chartConfig,
  chartData,
  formName,
}: {
  chartConfig: ChartConfig;
  chartData: any;
  formName: string;
}) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  const getMonthLabel = (month: number) => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return monthNames[month - 1];
  };

  const porcentajeCambio = chartData[5].respuestas - chartData[4].respuestas;
  let porcentajeTexto;

  if (chartData[4].respuestas === 0) {
    if (chartData[5].respuestas > 0) {
      porcentajeTexto = 'Incremento significativo este mes';
    } else {
      porcentajeTexto = 'sin cambios este mes';
    }
  } else {
    const porcentaje = (porcentajeCambio / chartData[4].respuestas) * 100;
    porcentajeTexto = `Tendencia al alza por ${porcentaje.toFixed(1)}% este mes`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafico de barras</CardTitle>
        <CardDescription>{`${getMonthLabel(currentMonth - 5)} -  ${getMonthLabel(currentMonth)} ${currentYear}`}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              className="fill-white"
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent className="fill-black bg-muted" hideLabel />} />
            <Bar dataKey="respuestas" className="fill-muted-foreground" radius={8}>
              <LabelList position="top" offset={10} className=" dark:fill-white" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none items-center">
          {porcentajeTexto} <TrendingUp className="size-5" />
        </div>
        <div className="leading-none text-muted-foreground">Comparacion de respuestas de los ultimos 6 meses</div>
      </CardFooter>
    </Card>
  );
}
