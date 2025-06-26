'use client';

import { TrainingEditDialog } from '@/components/Capacitaciones/training-edit-dialog';
import { TrainingEvaluation } from '@/components/Capacitaciones/training-evaluation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Loader2, Save, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { toast } from 'sonner';
import { fetchAllTags, fetchTrainingById, updateTrainingEvaluation } from './actions/actions';
import EmployeesTab from './components/EmployeesTab';
import MaterialsTab from './components/MaterialsTab';
import OverviewTab from './components/OverviewTab';

export default function TrainingDetail({
  training,
  allTags,
}: {
  training: Awaited<ReturnType<typeof fetchTrainingById>>;
  allTags: Awaited<ReturnType<typeof fetchAllTags>>;
}) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState('basic');

  // Estado para la evaluación
  const [evaluationQuestions, setEvaluationQuestions] = useState(training?.evaluation?.questions || []);
  const [passingScore, setPassingScore] = useState(training?.evaluation?.passingScore || 0);

  // Estados para manejar cambios y guardado
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalQuestions, setOriginalQuestions] = useState(JSON.stringify(training?.evaluation?.questions || []));
  const [originalScore, setOriginalScore] = useState(training?.evaluation?.passingScore || 0);

  // Función para manejar actualizaciones de la evaluación
  const handleEvaluationUpdate = (questions: any[], score: number) => {
    setEvaluationQuestions(questions);
    setPassingScore(score);

    // Verificar si hay cambios comparando con el estado original
    const currentQuestionsString = JSON.stringify(questions);
    const hasQuestionsChanges = currentQuestionsString !== originalQuestions;
    const hasScoreChanges = score !== originalScore;

    setHasChanges(hasQuestionsChanges || hasScoreChanges);
  };

  // Función para descartar cambios
  const discardEvaluationChanges = () => {
    // Restaurar al estado original
    const originalQuestionsArray = JSON.parse(originalQuestions);
    setEvaluationQuestions(originalQuestionsArray);
    setPassingScore(originalScore);
    setHasChanges(false);

    toast.info('Cambios descartados');
  };

  // Función para guardar los cambios en la base de datos
  const saveEvaluationChanges = async () => {
    if (isSaving || !training || !hasChanges) return;

    setIsSaving(true);

    try {
      // Preparar los datos para la actualización
      const evaluationData = {
        passingScore: passingScore,
        questions: evaluationQuestions.map((q) => ({
          id: q.id, // ID para preguntas existentes
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
      };

      // Llamar a la API para actualizar
      const result = await updateTrainingEvaluation(training.id, evaluationData);

      if (result.success) {
        // La API puede devolver diferentes formatos de respuesta exitosa
        toast.success('Evaluación guardada correctamente');
        // Actualizar estado original
        setOriginalQuestions(JSON.stringify(evaluationQuestions));
        setOriginalScore(passingScore);
        setHasChanges(false);
        // Recargar los datos para mostrar la versión actualizada
      } else {
        // Manejar caso de error
        const errorMessage = 'error' in result ? result.error : 'Error desconocido';
        throw new Error(errorMessage);
      }
      router.refresh();
    } catch (error: any) {
      console.error('Error al guardar la evaluación:', error);
      toast.error(`Error al guardar la evaluación: ${error.message || 'Intente nuevamente'}`);
    } finally {
      setIsSaving(false);
    }
  };
  if (!training) {
    return;
  }

  // Combinar empleados completados y pendientes para filtrado

  // console.log(formData);

  return (
    <Card className="mx-7">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Detalle de Capacitación</h1>
            <p className="text-sm text-muted-foreground">{training.title}</p>
          </div>
        </div>
      </header>

      <div className="px-7 py-6 space-y-8">
        {/* Training Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{training.title}</h1>
              {training.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-muted-foreground">{training.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Capacitación
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="materials">Materiales</TabsTrigger>
            <TabsTrigger value="employees">Empleados</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluación</TabsTrigger>
            <TabsTrigger value="statistics">Estadísticas</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab training={training} />
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            <MaterialsTab training={training} />
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            <EmployeesTab training={training} />
          </TabsContent>

          {/* Evaluation Tab */}
          <TabsContent value="evaluation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Gestión de Evaluación</span>
                  <Badge variant={training?.evaluation?.questions?.length ? 'default' : 'outline'} className="ml-2">
                    {training?.evaluation?.questions?.length
                      ? `${training.evaluation.questions.length} preguntas`
                      : 'Sin evaluación'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {training?.evaluation?.questions?.length
                    ? `Visualización y edición de preguntas de evaluación. Puntaje mínimo actual: ${training.evaluation.passingScore || 0}`
                    : 'Crea preguntas de evaluación para esta capacitación y define un puntaje mínimo de aprobación.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4 space-x-2">
                  <Button
                    onClick={discardEvaluationChanges}
                    disabled={isSaving || !hasChanges}
                    variant="outline"
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Descartar Cambios
                  </Button>
                  <Button onClick={saveEvaluationChanges} disabled={isSaving || !hasChanges} className="gap-2">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Edición</h3>
                    <div className="border rounded-lg p-4">
                      {/* Creamos un objeto temporal que simula la estructura esperada por TrainingEvaluation */}
                      <TrainingEvaluation
                        training={{
                          ...training,
                          evaluation: {
                            questions: evaluationQuestions,
                            passingScore: passingScore,
                          },
                        }}
                        mode="edit"
                        onUpdate={handleEvaluationUpdate}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Vista Previa</h3>
                    <div className="border rounded-lg p-4">
                      <TrainingEvaluation
                        training={{
                          ...training,
                          evaluation: {
                            questions: evaluationQuestions,
                            passingScore: passingScore,
                          },
                        }}
                        mode="preview"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
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
                      <Tooltip
                        formatter={(value, name) => [value, name === 'completados' ? 'Completados' : 'Pendientes']}
                      />
                      <Area type="monotone" dataKey="completados" stackId="1" stroke="#22c55e" fill="#22c55e" />
                      <Area type="monotone" dataKey="pendientes" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                      <Legend formatter={(value) => (value === 'completados' ? 'Completados' : 'Pendientes')} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <TrainingEditDialog
        training={training}
        selectedTab={selectedTab}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        allTags={allTags}
      />
    </Card>
  );
}
