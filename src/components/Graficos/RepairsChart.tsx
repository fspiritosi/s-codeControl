// 'use client';
// import { Label, Pie, PieChart } from 'recharts';

// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
// import cookie from 'js-cookie';
// import { useEffect, useState } from 'react';

// const chartData = [
//   { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
//   { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
//   { browser: 'firefox', visitors: 287, fill: 'var(--color-firefox)' },
//   { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
//   { browser: 'other', visitors: 190, fill: 'var(--color-other)' },
// ];

// const chartConfig = {
//   totalRepairs: {
//     label: 'Totales',
//   },
//   pendingRepairs: {
//     label: 'Pendientes',
//     color: '#00FFFF',
//   },
//   finishRepais: {
//     label: 'Finalizadas',
//     color: '#00FFFF',
//   },
//   esperandoRepuestos: {
//     label: 'Finalizadas',
//     color: '#0000AA',
//   },
// } satisfies ChartConfig;

// type ChartData = {
//   totalRepairs: any;
//   pendingRepairs: any;
//   finishRepais: any;
//   esperandoRepuestos: any;
// };

// export function RepairsChart() {
//   const URL = process.env.NEXT_PUBLIC_BASE_URL;
//   const [data, setData] = useState<ChartData>();

//   const company_id = cookie.get('actualComp');

//   const dataChart = [
//     {
//       browser: 'pendientes',
//       visitors: data?.pendingRepairs,
//       fill: '#FF0000',
//     },
//     {
//       browser: 'finalizadas',
//       visitors: data?.finishRepais,
//       fill: '#00AA00',
//     },
//     {
//       browser: 'esperando repuestos',
//       visitors: data?.esperandoRepuestos,
//       fill: '#0000AA',
//     },
//   ];

//   const today = new Date().toLocaleDateString();

//   const states = ['Pendiente', 'Esperando repuestos', 'En reparación', 'Finalizado', 'Rechazado', 'Cancelado'];

//   useEffect(() => {
//     async function getResources() {
//       const { repair_solicitudes } = await fetch(`${URL}/api/repair_solicitud?actual=${company_id}`).then((e) =>
//         e.json()
//       );
//       console.log('solicitudes', repair_solicitudes);

//       let pending = repair_solicitudes?.filter((e: any) => e.state === 'Pendiente');
//       console.log('pending', pending);
//       let finished = repair_solicitudes?.filter((e: any) => e.state === 'Finalizado');
//       console.log('pending', pending);
//       let esperandoRepuestos = repair_solicitudes?.filter((e: any) => e.state === 'Esperando repuestos');

//       setData({
//         totalRepairs: repair_solicitudes?.length,
//         pendingRepairs: pending?.length,
//         finishRepais: finished?.length,
//         esperandoRepuestos: esperandoRepuestos?.length,
//       });
//     }
//     getResources();
//   }, [company_id]);

//   return (
//     <Card className="flex flex-col">
//       <CardHeader className="items-center pb-0">
//         <CardTitle>Solicitudes de reparación</CardTitle>
//         <CardDescription>{today}</CardDescription>
//       </CardHeader>
//       <CardContent className="flex-1 pb-0">
//         <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
//           <PieChart>
//             <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
//             <Pie data={dataChart} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={5}>
//               <Label
//                 content={({ viewBox }) => {
//                   if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
//                     return (
//                       <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
//                         <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
//                           {data?.totalRepairs}
//                         </tspan>
//                         <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
//                           Solcitudes totales
//                         </tspan>
//                       </text>
//                     );
//                   }
//                 }}
//               />
//             </Pie>
//           </PieChart>
//         </ChartContainer>
//       </CardContent>
//     </Card>
//   );
// }

'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
export const description = 'A mixed bar chart';
const chartData = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 187, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 90, fill: 'var(--color-other)' },
];
const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  chrome: {
    label: 'Chrome',
    color: 'hsl(var(--chart-1))',
  },
  safari: {
    label: 'Safari',
    color: 'hsl(var(--chart-2))',
  },
  firefox: {
    label: 'Firefox',
    color: 'hsl(var(--chart-3))',
  },
  edge: {
    label: 'Edge',
    color: 'hsl(var(--chart-4))',
  },
  other: {
    label: 'Other',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;
export function RepairsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Mixed</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="browser"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label}
            />
            <XAxis dataKey="visitors" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="visitors" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">Showing total visitors for the last 6 months</div>
      </CardFooter>
    </Card>
  );
}

//TODO : El grafico tiene que mostrar Q de equipos fuera de servicio y Q de equipos en servicio (Operativos / Operativos Condicionado / No operativos)
//TODO : Grafica de Equipos en reparación y equipos pendientes de reparación (cantidad de reparaciones abiertas que no estan "En Reparación")
//TODO : Q de reparaciones con Criticidad de los pedidos de reparación (cuantas reparaciones tengo abiertas y que criticidad tienen)
