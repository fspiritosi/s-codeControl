'use client';

import { Label, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const chartData = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 287, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 190, fill: 'var(--color-other)' },
];

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  empleados: {
    label: 'Empleados',
    color: '#8DB9D7',
  },
  equipos: {
    label: 'Equipos',
    color: '#1F4A67',
  },
} satisfies ChartConfig;

export function CompanieChart(data: any) {

  const dataChart = [
    {
      browser: 'activas',
      visitors: data.data.is_active,
      fill: '#8DB9D7',
    },
    {
      browser: 'inactivas',
      visitors: data.data.is_active === false,
      fill: '#1F4A67',
    },
  ];

  const today = new Date().toLocaleDateString();

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Empresas dadas de alta</CardTitle>
        <CardDescription>{today}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={dataChart} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {data.length}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          Recursos Totales
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
      {/* <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">Showing total visitors for the last 6 months</div>
      </CardFooter> */}
    </Card>
  );
}
