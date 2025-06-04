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
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle,
  Clock,
  Download,
  Edit,
  FileText,
  Filter,
  Presentation,
  Tag,
  Video,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Mock data
const mockTrainings = [
  {
    id: '1',
    title: 'Seguridad en Carretera',
    description: 'Capacitación sobre normas de seguridad vial y conducción defensiva',
    createdDate: '2024-01-10',
    tags: ['Seguridad', 'Conducción', 'Obligatorio'],
    materials: [
      {
        id: 'm1',
        type: 'pdf',
        name: 'Manual de Seguridad Vial.pdf',
        url: '/materials/manual.pdf',
        order: 1,
      },
      {
        id: 'm2',
        type: 'video',
        name: 'Video Instructivo.mp4',
        url: '/materials/video.mp4',
        order: 2,
      },
      {
        id: 'm3',
        type: 'ppt',
        name: 'Presentación Seguridad.pptx',
        url: '/materials/presentation.pptx',
        order: 3,
      },
    ],
    evaluation: {
      questions: [
        {
          id: 'q1',
          question: '¿Cuál es la velocidad máxima permitida en zona urbana?',
          options: ['40 km/h', '50 km/h', '60 km/h', '70 km/h'],
          correctAnswer: 1,
        },
        {
          id: 'q2',
          question: '¿Qué debe hacer al ver una señal de PARE?',
          options: ['Reducir la velocidad', 'Detenerse completamente', 'Tocar bocina', 'Acelerar para pasar rápido'],
          correctAnswer: 1,
        },
        {
          id: 'q3',
          question: '¿Cuándo debe usar las luces altas?',
          options: ['Siempre de noche', 'Solo en autopistas', 'Cuando no hay tráfico en sentido contrario', 'Nunca'],
          correctAnswer: 2,
        },
      ],
      passingScore: 2,
    },
    completedCount: 35,
    totalEmployees: 60,
    status: 'active',
  },
  {
    id: '2',
    title: 'Primeros Auxilios',
    description: 'Capacitación básica en primeros auxilios para emergencias',
    createdDate: '2024-02-01',
    tags: ['Salud', 'Emergencias', 'Obligatorio'],
    materials: [
      {
        id: 'm4',
        type: 'pdf',
        name: 'Guía Primeros Auxilios.pdf',
        url: '/materials/primeros-auxilios.pdf',
        order: 1,
      },
      {
        id: 'm5',
        type: 'video',
        name: 'Técnicas RCP.mp4',
        url: '/materials/rcp.mp4',
        order: 2,
      },
    ],
    evaluation: {
      questions: [
        {
          id: 'q4',
          question: '¿Cuál es el primer paso ante una emergencia?',
          options: ['Llamar a emergencias', 'Evaluar la situación', 'Aplicar RCP', 'Evacuar el área'],
          correctAnswer: 1,
        },
        {
          id: 'q5',
          question: '¿Cuál es la relación correcta de compresiones/ventilaciones en RCP para adultos?',
          options: ['15:2', '30:2', '5:1', '10:1'],
          correctAnswer: 1,
        },
      ],
      passingScore: 1,
    },
    completedCount: 28,
    totalEmployees: 60,
    status: 'active',
  },
];

const mockEmployees = [
  {
    id: '1',
    name: 'Juan Pérez',
    cuil: '20-12345678-9',
    department: 'Logística',
    status: 'completed',
    lastAttempt: {
      date: '2024-01-22',
      score: '9/10',
      result: 'approved',
    },
  },
  {
    id: '2',
    name: 'María García',
    cuil: '27-87654321-0',
    department: 'Administración',
    status: 'completed',
    lastAttempt: {
      date: '2024-01-25',
      score: '10/10',
      result: 'approved',
    },
  },
  {
    id: '3',
    name: 'Carlos López',
    cuil: '20-11111111-1',
    department: 'Operaciones',
    status: 'pending',
    lastAttempt: null,
  },
  {
    id: '4',
    name: 'Ana Martínez',
    cuil: '27-22222222-2',
    department: 'Logística',
    status: 'completed',
    lastAttempt: {
      date: '2024-01-18',
      score: '8/10',
      result: 'approved',
    },
  },
  {
    id: '5',
    name: 'Roberto Silva',
    cuil: '20-33333333-3',
    department: 'Operaciones',
    status: 'pending',
    lastAttempt: null,
  },
  {
    id: '6',
    name: 'Laura Fernández',
    cuil: '27-44444444-4',
    department: 'Administración',
    status: 'failed',
    lastAttempt: {
      date: '2024-01-20',
      score: '6/10',
      result: 'failed',
    },
  },
  {
    id: '7',
    name: 'Miguel Torres',
    cuil: '20-55555555-5',
    department: 'Logística',
    status: 'pending',
    lastAttempt: null,
  },
  {
    id: '8',
    name: 'Sofía Ramírez',
    cuil: '27-66666666-6',
    department: 'Operaciones',
    status: 'completed',
    lastAttempt: {
      date: '2024-01-19',
      score: '9/10',
      result: 'approved',
    },
  },
];

export default function TrainingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [showMaterialViewer, setShowMaterialViewer] = useState(false);
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Find the training by ID
  const training = mockTrainings.find((t) => t.id === params.id) || mockTrainings[0];

  // Sort materials by order
  const sortedMaterials = [...training.materials].sort((a, b) => a.order - b.order);

  // Filter employees by status and search term
  const filteredEmployees = mockEmployees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.cuil.includes(searchTerm) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const completedEmployees = filteredEmployees.filter((e) => e.status === 'completed');
  const pendingEmployees = filteredEmployees.filter((e) => e.status === 'pending' || e.status === 'failed');

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

      <div className="container mx-auto py-6 space-y-8">
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
            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
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
                    <Badge variant={training.status === 'active' ? 'default' : 'secondary'}>
                      {training.status === 'active' ? 'Activa' : 'Borrador'}
                    </Badge>
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
                      {training.completedCount}/{training.totalEmployees}
                    </div>
                    <p className="text-muted-foreground">Empleados completaron</p>
                  </div>
                  <Progress value={(training.completedCount / training.totalEmployees) * 100} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span>{Math.round((training.completedCount / training.totalEmployees) * 100)}% completado</span>
                    <span>{training.totalEmployees - training.completedCount} pendientes</span>
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
                <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
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
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={index === 0}
                            onClick={() => handleMoveUp(material.id)}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={index === sortedMaterials.length - 1}
                            onClick={() => handleMoveDown(material.id)}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Vista Previa de Evaluación</CardTitle>
                  <CardDescription>
                    Previsualización del formulario de evaluación que verán los empleados
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Evaluación
                </Button>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4">
                  <TrainingEvaluation training={training} mode="preview" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Departamento</CardTitle>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Gráfico de distribución por departamento</p>
                    <p className="text-sm">(Visualización de gráfico)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tasa de Aprobación</CardTitle>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Gráfico de tasa de aprobación</p>
                    <p className="text-sm">(Visualización de gráfico)</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Historial de Intentos</CardTitle>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Gráfico de historial de intentos</p>
                    <p className="text-sm">(Visualización de gráfico)</p>
                  </div>
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
      <TrainingEditDialog training={training} open={showEditDialog} onOpenChange={setShowEditDialog} />
    </Card>
  );
}
