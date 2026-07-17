'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * Tab de estadísticas de capacitación. Aislado en su propio módulo para poder
 * cargar `recharts` (~100KB) de forma diferida (next/dynamic) desde el wrapper:
 * la librería de gráficos solo se descarga cuando el usuario abre esta pestaña.
 */
export default function TrainingStatisticsTab() {
  return (
    <>
      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold text-green-600">87%</p>
              <p className="text-muted-foreground">Tasa de Aprobación</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold text-blue-600">24.5</p>
              <p className="text-muted-foreground">Tiempo Promedio (min)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold text-amber-600">78%</p>
              <p className="text-muted-foreground">Participación</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold text-violet-600">82%</p>
              <p className="text-muted-foreground">Satisfacción</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Distribución por Departamento (Pie Chart) */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Posición</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Operaciones', value: 35 },
                    { name: 'Administración', value: 20 },
                    { name: 'Ventas', value: 15 },
                    { name: 'RRHH', value: 10 },
                    { name: 'Seguridad', value: 20 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#0ea5e9" />
                  <Cell fill="#22c55e" />
                  <Cell fill="#eab308" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#8b5cf6" />
                </Pie>
                <Tooltip formatter={(value) => [`${value} personas`, 'Cantidad']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Tasa de Aprobación (Bar Chart) */}
        <Card>
          <CardHeader>
            <CardTitle>Tasa de Aprobación por Departamento</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Operaciones', aprobados: 85 },
                  { name: 'Administración', aprobados: 65 },
                  { name: 'Ventas', aprobados: 78 },
                  { name: 'RRHH', aprobados: 92 },
                  { name: 'Seguridad', aprobados: 88 },
                ]}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value) => [`${value}%`, 'Aprobados']} />
                <Bar dataKey="aprobados" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Puntuación por Pregunta (Radar Chart) */}
        <Card>
          <CardHeader>
            <CardTitle>Desempeño por Pregunta</CardTitle>
            <CardDescription>Porcentaje de respuestas correctas</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                outerRadius={90}
                data={[
                  { pregunta: 'P1', correctas: 82 },
                  { pregunta: 'P2', correctas: 65 },
                  { pregunta: 'P3', correctas: 78 },
                  { pregunta: 'P4', correctas: 91 },
                  { pregunta: 'P5', correctas: 73 },
                ]}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="pregunta" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Correctas" dataKey="correctas" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                <Tooltip formatter={(value) => [`${value}%`, 'Respuestas correctas']} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Tiempo de Finalización (Line Chart) */}
        <Card>
          <CardHeader>
            <CardTitle>Tiempo Promedio de Finalización</CardTitle>
            <CardDescription>Por departamento en minutos</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { departamento: 'Operaciones', tiempo: 28 },
                  { departamento: 'Administración', tiempo: 22 },
                  { departamento: 'Ventas', tiempo: 34 },
                  { departamento: 'RRHH', tiempo: 19 },
                  { departamento: 'Seguridad', tiempo: 25 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="departamento" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} min`, 'Tiempo promedio']} />
                <Bar dataKey="tiempo" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Evolución de Participación (Area Chart) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Evolución de Participación</CardTitle>
            <CardDescription>Personas que completaron la capacitación en el tiempo</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { fecha: 'Semana 1', completados: 10, pendientes: 90 },
                  { fecha: 'Semana 2', completados: 25, pendientes: 75 },
                  { fecha: 'Semana 3', completados: 37, pendientes: 63 },
                  { fecha: 'Semana 4', completados: 48, pendientes: 52 },
                  { fecha: 'Semana 5', completados: 62, pendientes: 38 },
                  { fecha: 'Semana 6', completados: 75, pendientes: 25 },
                ]}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, name === 'completados' ? 'Completados' : 'Pendientes']} />
                <Area type="monotone" dataKey="completados" stackId="1" stroke="#22c55e" fill="#22c55e" />
                <Area type="monotone" dataKey="pendientes" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                <Legend formatter={(value) => (value === 'completados' ? 'Completados' : 'Pendientes')} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
