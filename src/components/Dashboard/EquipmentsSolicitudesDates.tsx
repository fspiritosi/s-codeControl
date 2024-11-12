'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/es'; // Asegúrate de importar el locale en español
import { Area, AreaChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';

const chartConfig = {
  admission: {
    label: 'Fecha de Ingreso',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function EquipmentSolicitudesDates({ solicitudes }: { solicitudes: RepairRequest[] }) {
  // Procesar los datos para obtener las fechas de ingreso
  const admissionData = solicitudes.reduce(
    (acc, employee) => {
      const month = moment(employee.created_at).locale('es').format('MMMM'); // Asegurando que el mes esté en español
      if (!acc[month]) {
        acc[month] = { mes: month, cantidad: 0 };
      }
      acc[month].cantidad += 1;
      return acc;
    },
    {} as Record<string, { mes: string; cantidad: number }>
  );

  const admissionDataArray = Object.values(admissionData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gráfico de Área - Solicidudes por mes</CardTitle>
        <CardDescription>Mostrando las solicitudes segun los ultimos meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            width={500}
            height={300}
            data={admissionDataArray}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="cantidad"
              stackId="1"
              stroke={chartConfig.admission.color}
              fill={chartConfig.admission.color}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Tendencia al alza del 5.2% este mes <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">Enero - Junio 2024</div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
