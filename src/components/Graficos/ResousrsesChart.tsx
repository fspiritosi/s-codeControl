'use client';
import { Label, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import cookie from 'js-cookie';
import { useEffect, useState } from 'react';

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

type ChartData = {
  totalResourses: any;
  employees: any;
  vehicles: any;
};

export function ResoursesChart() {
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const [data, setData] = useState<ChartData>();
  console.log(data);

  const company_id = cookie.get('actualComp');
  console.log(company_id);

  const dataChart = [
    {
      browser: 'empleados',
      visitors: data?.employees,
      fill: '#8DB9D7',
    },
    {
      browser: 'equipos',
      visitors: data?.vehicles,
      fill: '#1F4A67',
    },
  ];

  const today = new Date().toLocaleDateString();

  useEffect(() => {
    async function getResources() {
      const { employees } = await fetch(`${URL}/api/employees?actual=${company_id}`).then((e) => e.json());
      const { equipments } = await fetch(`${URL}/api/equipment?actual=${company_id}`).then((e) => e.json());

      setData({
        totalResourses: employees?.length + equipments?.length,
        employees: employees?.length,
        vehicles: equipments?.length,
      });
    }
    getResources();
  }, [company_id]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Recursos totales de la empresa</CardTitle>
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
                          {data?.totalResourses}
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
    </Card>
  );
}
