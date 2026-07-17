'use client';

import { TrainingEditDialog } from './training-edit-dialog';
import { TrainingEvaluation } from './training-evaluation';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { ArrowLeft, Copy, Edit, Loader2, Save, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react'; // Importa useEffect
import { toast } from 'sonner';

// Carga diferida: recharts (~100KB) solo se descarga al abrir la pestaña de estadísticas.
const TrainingStatisticsTab = dynamic(() => import('./TrainingStatisticsTab'), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-md bg-muted" />,
});
import { updateTrainingEvaluation, type fetchAllTags, type fetchTrainingById } from '../actions.server';
import EmployeesTab from './EmployeesTab';
import MaterialsTab from './MaterialsTab';
import OverviewTab from './OverviewTab';

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
  const [timeLimit, setTimeLimit] = useState<number>(training?.test_limit_time || 30);

  // Estados para manejar cambios y guardado
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalQuestions, setOriginalQuestions] = useState(JSON.stringify(training?.evaluation?.questions || []));
  const [originalScore, setOriginalScore] = useState(training?.evaluation?.passingScore || 0);
  // const [originalTimeLimit, setOriginalTimeLimit] = useState(training?.test_limit_time || 30);

  // Nuevo: useEffect para actualizar el estado original cuando la prop 'training' cambia
  useEffect(() => {
    if (training?.evaluation) {
      const currentTrainingQuestions = training.evaluation.questions || [];
      const currentTrainingPassingScore = training.evaluation.passingScore || 0;

      setEvaluationQuestions(currentTrainingQuestions);
      setPassingScore(currentTrainingPassingScore);
      setOriginalQuestions(JSON.stringify(currentTrainingQuestions));
      setOriginalScore(currentTrainingPassingScore);
      setHasChanges(false); // Reinicia hasChanges cuando la prop training se actualiza
    }
  }, [training?.evaluation?.questions, training?.evaluation]); // Depende de los datos de evaluación

  // Función para manejar actualizaciones de la evaluación
  const handleEvaluationUpdate = (questions: any[], score: number, timeLimit: number) => {
    setEvaluationQuestions(questions);
    setPassingScore(score);
    setTimeLimit(timeLimit);

    // Verificar si hay cambios comparando con el estado original
    const currentQuestionsString = JSON.stringify(questions);
    const hasQuestionsChanges = currentQuestionsString !== originalQuestions;
    const hasScoreChanges = score !== originalScore;
    const hasTimeLimitChanges = timeLimit !== training?.test_limit_time;

    setHasChanges(hasQuestionsChanges || hasScoreChanges || hasTimeLimitChanges);
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
        questions: evaluationQuestions.map((q: any) => ({
          id: q.id, // ID para preguntas existentes
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
        test_limit_time: timeLimit,
      };

      // Llamar a la API para actualizar
      const result = await updateTrainingEvaluation(training.id, evaluationData);

      if (result.success) {
        toast.success('Evaluación guardada correctamente');
        // El useEffect se encargará de actualizar originalQuestions, originalScore y hasChanges
        // después de que router.refresh() cause que la prop training se actualice.
        router.refresh(); // Esto hará que el componente se vuelva a renderizar con datos frescos
      } else {
        // Manejar caso de error
        const errorMessage = 'error' in result ? result.error : 'Error desconocido';
        throw new Error(errorMessage);
      }
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
              {training.tags.map((tag: any, index: any) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-muted-foreground">{training.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {training.attempts.length > 0 ? (
              <Button disabled>
                <Copy className="h-4 w-4 mr-2" />
                Clonar capacitación
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Capacitación
              </Button>
            )}
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
                {!training.attempts.length && (
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
                )}

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
            <TrainingStatisticsTab />
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
