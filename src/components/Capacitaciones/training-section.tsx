'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, FileText, Filter, GraduationCap, Presentation, Tag, Users, Video } from 'lucide-react';
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
  },
];

// Extract all unique tags
const allTags = Array.from(new Set(mockTrainings.flatMap((t) => t.tags)));

export function TrainingSection() {
  const [trainings, setTrainings] = useState<Training[]>(mockTrainings);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const router = useRouter();

  // Filter trainings based on search term and tag
  const filteredTrainings = trainings.filter((training) => {
    const matchesSearch =
      training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = tagFilter === 'all' || training.tags.includes(tagFilter);

    return matchesSearch && matchesTag;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* <div>
          <h2 className="text-2xl font-bold">Capacitaciones HSE</h2>
          <p className="text-muted-foreground">Gestiona las capacitaciones y evaluaciones de empleados</p>
        </div> */}
        {/* <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Capacitación
        </Button> */}
      </div>

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
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {filteredTrainings.length > 0 ? (
          filteredTrainings.map((training) => (
            <Card key={training.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <GraduationCap className="h-8 w-8 text-purple-600" />
                  <Badge variant={training.status === 'active' ? 'default' : 'secondary'}>
                    {training.status === 'active' ? 'Activa' : 'Borrador'}
                  </Badge>
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
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  {training.completedCount}/{training.totalEmployees} completaron
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(training.completedCount / training.totalEmployees) * 100}%` }}
                  ></div>
                </div>

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

                <div className="text-sm text-muted-foreground">
                  Evaluación: {training.evaluation.questions.length} preguntas (mín. {training.evaluation.passingScore}{' '}
                  correctas)
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      router.push(`/dashboard/hse/detail/${training.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Administrar
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      window.open(`/hse/training`, '_blank');
                    }}
                  >
                    <GraduationCap className="h-4 w-4 mr-1" />
                    Vista Empleado
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron capacitaciones que coincidan con los filtros</p>
          </div>
        )}
      </div>
    </div>
  );
}
