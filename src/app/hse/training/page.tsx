'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, FileText, Filter, GraduationCap, Play, Presentation, Tag, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Training {
  id: string;
  title: string;
  description: string;
  createdDate: string;
  tags: string[];
  materials: Array<{
    type: 'pdf' | 'video' | 'ppt';
    name: string;
    url: string;
  }>;
  evaluation: {
    questions: any[];
    passingScore: number;
  };
  completedCount: number;
  totalEmployees: number;
  status: 'active' | 'draft';
  userProgress?: {
    materialsCompleted: number;
    totalMaterials: number;
    evaluationCompleted: boolean;
    evaluationPassed: boolean;
    lastAccessed?: string;
  };
}

const mockTrainings: Training[] = [
  {
    id: '1',
    title: 'Seguridad en Carretera',
    description: 'Capacitación sobre normas de seguridad vial y conducción defensiva',
    createdDate: '2024-01-10',
    tags: ['Seguridad', 'Conducción', 'Obligatorio'],
    materials: [
      { type: 'pdf', name: 'Manual de Seguridad Vial.pdf', url: '/materials/manual.pdf' },
      { type: 'video', name: 'Video Instructivo.mp4', url: '/materials/video.mp4' },
      { type: 'ppt', name: 'Presentación Seguridad.pptx', url: '/materials/presentation.pptx' },
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
      ],
      passingScore: 1,
    },
    completedCount: 35,
    totalEmployees: 60,
    status: 'active',
    userProgress: {
      materialsCompleted: 2,
      totalMaterials: 3,
      evaluationCompleted: false,
      evaluationPassed: false,
      lastAccessed: '2024-01-20',
    },
  },
  {
    id: '2',
    title: 'Primeros Auxilios',
    description: 'Capacitación básica en primeros auxilios para emergencias',
    createdDate: '2024-02-01',
    tags: ['Salud', 'Emergencias', 'Obligatorio'],
    materials: [
      { type: 'pdf', name: 'Guía Primeros Auxilios.pdf', url: '/materials/primeros-auxilios.pdf' },
      { type: 'video', name: 'Técnicas RCP.mp4', url: '/materials/rcp.mp4' },
    ],
    evaluation: {
      questions: [
        {
          id: 'q3',
          question: '¿Cuál es el primer paso ante una emergencia?',
          options: ['Llamar a emergencias', 'Evaluar la situación', 'Aplicar RCP', 'Evacuar el área'],
          correctAnswer: 1,
        },
      ],
      passingScore: 1,
    },
    completedCount: 28,
    totalEmployees: 60,
    status: 'active',
    userProgress: {
      materialsCompleted: 2,
      totalMaterials: 2,
      evaluationCompleted: true,
      evaluationPassed: true,
      lastAccessed: '2024-02-05',
    },
  },
  {
    id: '3',
    title: 'Manejo de Sustancias Peligrosas',
    description: 'Capacitación sobre el manejo seguro de sustancias químicas y peligrosas',
    createdDate: '2024-03-05',
    tags: ['Seguridad', 'Químicos', 'Obligatorio'],
    materials: [
      { type: 'pdf', name: 'Manual de Sustancias Peligrosas.pdf', url: '/materials/sustancias.pdf' },
      { type: 'video', name: 'Procedimientos de Seguridad.mp4', url: '/materials/procedimientos.mp4' },
    ],
    evaluation: {
      questions: [
        {
          id: 'q4',
          question: '¿Qué equipo de protección es obligatorio para manipular ácidos?',
          options: [
            'Guantes de látex',
            'Guantes de nitrilo y protección ocular',
            'Solo mascarilla',
            'No se requiere equipo',
          ],
          correctAnswer: 1,
        },
      ],
      passingScore: 1,
    },
    completedCount: 15,
    totalEmployees: 60,
    status: 'active',
    userProgress: {
      materialsCompleted: 0,
      totalMaterials: 2,
      evaluationCompleted: false,
      evaluationPassed: false,
    },
  },
  {
    id: '4',
    title: 'Ergonomía en el Trabajo',
    description: 'Capacitación sobre posturas correctas y prevención de lesiones laborales',
    createdDate: '2024-03-15',
    tags: ['Salud', 'Prevención', 'Opcional'],
    materials: [
      { type: 'pdf', name: 'Guía de Ergonomía.pdf', url: '/materials/ergonomia.pdf' },
      { type: 'video', name: 'Ejercicios de Estiramiento.mp4', url: '/materials/ejercicios.mp4' },
    ],
    evaluation: {
      questions: [
        {
          id: 'q5',
          question: '¿Cuál es la altura correcta del monitor de computadora?',
          options: ['A nivel de los ojos', 'Por encima de los ojos', 'Por debajo de los ojos', 'No importa'],
          correctAnswer: 0,
        },
      ],
      passingScore: 1,
    },
    completedCount: 8,
    totalEmployees: 60,
    status: 'active',
    userProgress: {
      materialsCompleted: 1,
      totalMaterials: 2,
      evaluationCompleted: false,
      evaluationPassed: false,
      lastAccessed: '2024-03-18',
    },
  },
];

// Extract all unique tags
const allTags = Array.from(new Set(mockTrainings.flatMap((t) => t.tags)));

// Mock user data
const mockUser = {
  id: 'u1',
  name: 'Juan Pérez',
  cuil: '20-12345678-9',
  department: 'Logística',
};

export default function EmployeeTrainingPage() {
  const [trainings] = useState<Training[]>(mockTrainings);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const router = useRouter();

  // Filter trainings based on search term, tag, and status
  const filteredTrainings = trainings.filter((training) => {
    const matchesSearch =
      training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = tagFilter === 'all' || training.tags.includes(tagFilter);

    let matchesStatus = true;
    if (statusFilter === 'completed') {
      matchesStatus = training.userProgress?.evaluationCompleted === true;
    } else if (statusFilter === 'in-progress') {
      matchesStatus =
        (training.userProgress?.materialsCompleted || 0) > 0 && !training.userProgress?.evaluationCompleted;
    } else if (statusFilter === 'not-started') {
      matchesStatus = (training.userProgress?.materialsCompleted || 0) === 0;
    }

    return matchesSearch && matchesTag && matchesStatus;
  });

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

  const getTrainingStatus = (training: Training) => {
    const progress = training.userProgress;
    if (!progress) return { status: 'not-started', text: 'No iniciado', color: 'bg-gray-100 text-gray-800' };

    if (progress.evaluationCompleted && progress.evaluationPassed) {
      return { status: 'completed', text: 'Completado', color: 'bg-green-100 text-green-800' };
    }

    if (progress.evaluationCompleted && !progress.evaluationPassed) {
      return { status: 'failed', text: 'Desaprobado', color: 'bg-red-100 text-red-800' };
    }

    if (progress.materialsCompleted > 0) {
      return { status: 'in-progress', text: 'En progreso', color: 'bg-blue-100 text-blue-800' };
    }

    return { status: 'not-started', text: 'No iniciado', color: 'bg-gray-100 text-gray-800' };
  };

  const getActionButton = (training: Training) => {
    const progress = training.userProgress;
    const status = getTrainingStatus(training);

    if (status.status === 'completed') {
      return (
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => router.push(`/training/${training.id}/user`)}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Ver Certificado
        </Button>
      );
    }

    if (status.status === 'in-progress' || status.status === 'failed') {
      return (
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => router.push(`/training/${training.id}/user`)}
        >
          <Play className="h-4 w-4 mr-1" />
          Continuar
        </Button>
      );
    }

    return (
      <Button
        variant="default"
        size="sm"
        className="flex-1"
        onClick={() => router.push(`/training/${training.id}/user`)}
      >
        <GraduationCap className="h-4 w-4 mr-1" />
        Iniciar Capacitación
      </Button>
    );
  };

  // Calculate statistics
  const completedTrainings = trainings.filter(
    (t) => t.userProgress?.evaluationCompleted && t.userProgress?.evaluationPassed
  ).length;
  const inProgressTrainings = trainings.filter(
    (t) => (t.userProgress?.materialsCompleted || 0) > 0 && !t.userProgress?.evaluationCompleted
  ).length;
  const totalTrainings = trainings.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Mis Capacitaciones</h1>
              <p className="text-muted-foreground">Completa tus capacitaciones HSE obligatorias y opcionales</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{mockUser.name}</p>
              <p className="text-sm text-muted-foreground">{mockUser.department}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedTrainings}</div>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{inProgressTrainings}</div>
                <p className="text-sm text-muted-foreground">En Progreso</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{totalTrainings}</div>
                <p className="text-sm text-muted-foreground">Total Disponibles</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Input
                placeholder="Buscar capacitaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Filter className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="w-full md:w-[200px]">
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etiquetas</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="not-started">No iniciadas</SelectItem>
                <SelectItem value="in-progress">En progreso</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Training Cards */}
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {filteredTrainings.length > 0 ? (
            filteredTrainings.map((training) => {
              const status = getTrainingStatus(training);
              const progress = training.userProgress;
              const progressPercentage = progress ? (progress.materialsCompleted / progress.totalMaterials) * 100 : 0;

              return (
                <Card key={training.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <GraduationCap className="h-8 w-8 text-purple-600" />
                      <Badge className={status.color}>{status.text}</Badge>
                    </div>
                    <CardTitle className="text-lg">{training.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{training.description}</CardDescription>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {training.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1 text-xs">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Progress */}
                    {progress && progress.materialsCompleted > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progreso de materiales</span>
                          <span>
                            {progress.materialsCompleted}/{progress.totalMaterials}
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                    )}

                    {/* Materials */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Materiales:</p>
                      <div className="flex gap-1 flex-wrap">
                        {training.materials.map((material, index) => (
                          <div key={index} className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1">
                            {getMaterialIcon(material.type)}
                            <span>{material.type.toUpperCase()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Evaluation info */}
                    <div className="text-sm text-muted-foreground">
                      Evaluación: {training.evaluation.questions.length} preguntas (mín.{' '}
                      {training.evaluation.passingScore} correctas)
                    </div>

                    {/* Last accessed */}
                    {progress?.lastAccessed && (
                      <div className="text-xs text-muted-foreground">
                        Último acceso: {new Date(progress.lastAccessed).toLocaleDateString()}
                      </div>
                    )}

                    {/* Action button */}
                    <div className="pt-2">{getActionButton(training)}</div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron capacitaciones que coincidan con los filtros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
