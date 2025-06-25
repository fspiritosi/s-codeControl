'use client';

import { MaterialViewer } from '@/components/Capacitaciones/material-viewer';
import { TrainingEditDialog } from '@/components/Capacitaciones/training-edit-dialog';
import { TrainingEvaluation } from '@/components/Capacitaciones/training-evaluation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRightLeft, ArrowLeft, BadgePlus, CheckCircle, Clock, Download, Edit, Eye, FileText, Filter, Loader2, Plus, Presentation, Save, Tag, Terminal, TestTube2, Upload, Video, X } from 'lucide-react';
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
import { fetchTrainingById, updateTrainingEvaluation } from './actions/actions';

export default function TrainingDetail({ training }: { training: Awaited<ReturnType<typeof fetchTrainingById>> }) {
  const router = useRouter();
  const [showMaterialViewer, setShowMaterialViewer] = useState(false);
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState('basic');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

  // Sort materials by order
  const sortedMaterials = [...training?.materials].sort((a, b) => a.order - b.order);

  // Combinar empleados completados y pendientes para filtrado
  const allEmployees: {
    id: string;
    name: string;
    cuil: string;
    department: string | null;
    status: string;
    lastAttempt?: {
      date: string;
      score: string;
      result: string;
    } | null;
  }[] = [...training?.employees.completed, ...training?.employees.pending];

  // Calcular métricas importantes
  const completedCount = training.employees.completed.length;
  const totalEmployees = allEmployees.length;

  // Filter employees by status and search term
  const filteredEmployees = allEmployees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.cuil.includes(searchTerm) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const completedEmployees = filteredEmployees.filter((e: { status: string }) => e.status === 'completed');
  const pendingEmployees = filteredEmployees.filter(
    (e: { status: string }) => e.status === 'pending' || e.status === 'failed'
  );

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'video':
        return <Video className="h-4 w-4 text-blue-600" />;
      case 'ppt':
        return <Presentation className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Desaprobado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Desaprobado</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const handleMoveUp = (materialId: string) => {
    // Implementación real: actualizar el orden en la base de datos
    console.log(`Mover material ${materialId} hacia arriba`);
  };

  const handleMoveDown = (materialId: string) => {
    // Implementación real: actualizar el orden en la base de datos
    console.log(`Mover material ${materialId} hacia abajo`);
  };

  const exportToCSV = (data: any[], filename: string) => {
    // Implementación básica de exportación a CSV
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((item) => Object.values(item).join(','));
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de creación:</span>
                    <span>{new Date(training.createdDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant={training.status === 'Publicado' ? 'default' : 'secondary'}>{training.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Materiales:</span>
                    <span>{training.materials.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preguntas:</span>
                    <span>{training.evaluation.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Puntaje mínimo:</span>
                    <span>
                      {training.evaluation.passingScore}/{training.evaluation.questions.length} (
                      {Math.round((training.evaluation.passingScore / training.evaluation.questions.length) * 100)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Etiquetas:</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {training.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progreso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {completedCount}/{totalEmployees}
                    </div>
                    <p className="text-muted-foreground">Empleados completaron</p>
                  </div>
                  <Progress value={(completedCount / totalEmployees) * 100 || 0} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span>{Math.round((completedCount / totalEmployees) * 100) || 0}% completado</span>
                    <span>{totalEmployees - completedCount} pendientes</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      const dataToExport = completedEmployees.map((emp) => ({
                        Nombre: emp.name,
                        CUIL: emp.cuil,
                        Departamento: emp.department,
                        Fecha: emp.lastAttempt?.date || '',
                        Resultado: emp.lastAttempt?.result || '',
                        Puntaje: emp.lastAttempt?.score || '',
                      }));
                      exportToCSV(dataToExport, `capacitacion-${training.id}-completados.csv`);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Resultados
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Ver Historial
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Completada
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Materiales de Capacitación</CardTitle>
                  <CardDescription>Gestiona y ordena los materiales disponibles para esta capacitación</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTab('materials');
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Materiales
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedMaterials.map((material: any, index: number) => (
                    <div
                      key={material.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2 sm:mb-0">
                        <div className="p-2 bg-gray-100 rounded flex items-center justify-center w-8 h-8">
                          {material.order}
                        </div>
                        <div className="p-2 bg-gray-100 rounded">{getMaterialIcon(material.type)}</div>
                        <div>
                          <p className="font-medium">{material.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{material.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => {
                            setSelectedMaterialIndex(index);
                            setShowMaterialViewer(true);
                          }}
                        >
                          Ver Material
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <CardTitle>Empleados</CardTitle>
                    <CardDescription>Seguimiento de empleados que completaron y están pendientes</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const dataToExport = filteredEmployees.map((emp) => ({
                          Nombre: emp.name,
                          CUIL: emp.cuil,
                          Departamento: emp.department,
                          Estado: emp.status,
                          Fecha: emp.lastAttempt?.date || '',
                          Resultado: emp.lastAttempt?.result || '',
                          Puntaje: emp.lastAttempt?.score || '',
                        }));
                        exportToCSV(dataToExport, `capacitacion-${training.id}-empleados.csv`);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                      <Input
                        id="search"
                        placeholder="Buscar por nombre, CUIL o departamento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Filter className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="w-full md:w-[180px]">
                    <Label htmlFor="department">Departamento</Label>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Logística">Logística</SelectItem>
                        <SelectItem value="Administración">Administración</SelectItem>
                        <SelectItem value="Operaciones">Operaciones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-[180px]">
                    <Label htmlFor="status">Estado</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="failed">Desaprobado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Tabs defaultValue="completed">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="completed">Completados ({completedEmployees.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pendientes ({pendingEmployees.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="completed" className="pt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>CUIL</TableHead>
                            <TableHead>Departamento</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Resultado</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {completedEmployees.length > 0 ? (
                            completedEmployees.map((employee) => (
                              <TableRow key={employee.id}>
                                <TableCell className="font-medium">{employee.name}</TableCell>
                                <TableCell>{employee.cuil}</TableCell>
                                <TableCell>{employee.department}</TableCell>
                                <TableCell>{employee.lastAttempt?.date}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span>{employee.lastAttempt?.score}</span>
                                    {employee.lastAttempt && getResultBadge(employee.lastAttempt.result)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      window.open(`/training/${training.id}/review/${employee.id}`, '_blank');
                                    }}
                                  >
                                    Ver Detalle
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                No se encontraron empleados que coincidan con los filtros
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="pending" className="pt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>CUIL</TableHead>
                            <TableHead>Departamento</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingEmployees.length > 0 ? (
                            pendingEmployees.map((employee) => (
                              <TableRow key={employee.id}>
                                <TableCell className="font-medium">{employee.name}</TableCell>
                                <TableCell>{employee.cuil}</TableCell>
                                <TableCell>{employee.department}</TableCell>
                                <TableCell>{getStatusBadge(employee.status)}</TableCell>
                                <TableCell>
                                  <Button variant="outline" size="sm">
                                    Enviar Recordatorio
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                No se encontraron empleados que coincidan con los filtros
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
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
                  <CardTitle>Distribución por Departamento</CardTitle>
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

      <MaterialViewer
        materials={training.materials as any}
        open={showMaterialViewer}
        onOpenChange={setShowMaterialViewer}
      />
      <TrainingEditDialog
        training={training}
        selectedTab={selectedTab}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </Card>
  );
}
