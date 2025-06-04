'use client';

import { MaterialViewer } from '@/components/Capacitaciones/material-viewer';
import { TrainingEvaluation } from '@/components/Capacitaciones/training-evaluation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, FileText, GraduationCap, Presentation, Video } from 'lucide-react';
import { useEffect, useState } from 'react';

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
        completed: false,
      },
      {
        id: 'm2',
        type: 'video',
        name: 'Video Instructivo.mp4',
        url: '/materials/video.mp4',
        order: 2,
        completed: false,
      },
      {
        id: 'm3',
        type: 'ppt',
        name: 'Presentación Seguridad.pptx',
        url: '/materials/presentation.pptx',
        order: 3,
        completed: false,
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
        completed: false,
      },
      {
        id: 'm5',
        type: 'video',
        name: 'Técnicas RCP.mp4',
        url: '/materials/rcp.mp4',
        order: 2,
        completed: false,
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

// Mock user data
const mockUser = {
  id: 'u1',
  name: 'Juan Pérez',
  cuil: '20-12345678-9',
  department: 'Logística',
};

export default function TrainingUserPage({ params }: { params: { id: string } }) {
  const [training, setTraining] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [showMaterialViewer, setShowMaterialViewer] = useState(false);
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simular carga de datos
    const foundTraining = mockTrainings.find((t) => t.id === params.id);
    if (foundTraining) {
      setTraining(foundTraining);
      // Ordenar materiales por orden
      const sortedMaterials = [...foundTraining.materials].sort((a, b) => a.order - b.order);
      setMaterials(sortedMaterials);

      // Calcular progreso
      const completedMaterials = sortedMaterials.filter((m) => m.completed).length;
      const totalProgress = (completedMaterials / sortedMaterials.length) * 100;
      setProgress(totalProgress);
    }
  }, [params.id]);

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

  const handleMarkAsCompleted = (materialId: string) => {
    const updatedMaterials = materials.map((m) => {
      if (m.id === materialId) {
        return { ...m, completed: true };
      }
      return m;
    });
    setMaterials(updatedMaterials);

    // Actualizar progreso
    const completedMaterials = updatedMaterials.filter((m) => m.completed).length;
    const totalProgress = (completedMaterials / updatedMaterials.length) * 100;
    setProgress(totalProgress);
  };

  const isMaterialEnabled = (index: number) => {
    if (index === 0) return true;
    return materials[index - 1]?.completed === true;
  };

  const allMaterialsCompleted = materials.every((m) => m.completed);

  if (!training) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Cargando capacitación...</p>
      </div>
    );
  }

  if (showEvaluation) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => setShowEvaluation(false)} className="mb-4">
            Volver a la capacitación
          </Button>
          <TrainingEvaluation training={training} mode="take" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">{training.title}</h1>
              <p className="text-muted-foreground">{training.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {training.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-6 px-4 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Progreso de la Capacitación</CardTitle>
            <CardDescription>Completa todos los materiales para poder realizar la evaluación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{Math.round(progress)}% completado</span>
                <span className="text-muted-foreground">
                  ({materials.filter((m) => m.completed).length} de {materials.length} materiales)
                </span>
              </div>
              <Button disabled={!allMaterialsCompleted} onClick={() => setShowEvaluation(true)}>
                <GraduationCap className="h-4 w-4 mr-2" />
                {allMaterialsCompleted ? 'Realizar Evaluación' : 'Complete todos los materiales'}
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="materials">Materiales</TabsTrigger>
            <TabsTrigger value="info">Información</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-6">
            <div className="space-y-4">
              {materials.map((material, index) => {
                const isEnabled = isMaterialEnabled(index);
                return (
                  <Card key={material.id} className={!isEnabled ? 'opacity-70' : ''}>
                    <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4">
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
                        {material.completed ? (
                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Completado
                          </Badge>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              disabled={!isEnabled}
                              onClick={() => {
                                setSelectedMaterialIndex(index);
                                setShowMaterialViewer(true);
                              }}
                            >
                              Ver Material
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              disabled={!isEnabled}
                              onClick={() => handleMarkAsCompleted(material.id)}
                            >
                              Marcar como Completado
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Capacitación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Descripción</h3>
                  <p>{training.description}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">Información de la Evaluación</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Número de preguntas: {training.evaluation.questions.length}</li>
                    <li>Puntaje mínimo para aprobar: {training.evaluation.passingScore} respuestas correctas</li>
                    <li>
                      Porcentaje requerido:{' '}
                      {Math.round((training.evaluation.passingScore / training.evaluation.questions.length) * 100)}%
                    </li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">Información del Usuario</h3>
                  <div className="space-y-1">
                    <p>
                      <span className="font-medium">Nombre:</span> {mockUser.name}
                    </p>
                    <p>
                      <span className="font-medium">CUIL:</span> {mockUser.cuil}
                    </p>
                    <p>
                      <span className="font-medium">Departamento:</span> {mockUser.department}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <MaterialViewer
        materials={[materials[selectedMaterialIndex]]}
        open={showMaterialViewer}
        onOpenChange={setShowMaterialViewer}
      />
    </div>
  );
}
