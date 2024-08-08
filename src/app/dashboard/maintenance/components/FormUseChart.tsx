'use client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Pie, PieChart, Sector } from 'recharts';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';

export function FormUseChart({
  chartConfig,
  chartData,
  formName,
  activeIndex, // Añadido para manejar el índice activo
}: {
  chartConfig: ChartConfig;
  chartData: any;
  formName: string;
  activeIndex: number; // Añadido para manejar el índice activo
}) {
  return (
    <Card className="flex flex-col bg-muted justify-between ">
      <CardHeader className="items-center pb-0">
        <CardTitle className='text-center text-balance'>{formName}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0 h-full">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex} // Configura el índice activo
              activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                <Sector {...props} outerRadius={outerRadius + 10} />
              )}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="leading-none text-muted-foreground text-center">
          Mostrando el total de respuestas en comparación con los demás formularios
        </div>
      </CardFooter>
    </Card>
  );
}
