'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  Eye,
  FileText,
  FileX,
  Filter,
  GraduationCap,
  Presentation,
  RefreshCcw,
  SortAsc,
  SortDesc,
  Tag,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteTraining, type fetchAllTags, type fetchTrainings } from './actions/actions';
import TagTab from './components/tags/TagTab';

interface TrainingMaterial {
  type: string;
  name: string;
  url: string;
  file_url?: string;
  file_size?: number;
  order?: number;
  is_required?: boolean;
}

// Tipo para las props del componente
interface TrainingSectionProps {
  trainings: Awaited<ReturnType<typeof fetchTrainings>>;
  allTags: Awaited<ReturnType<typeof fetchAllTags>>;
}

export default function TrainingSection({ trainings, allTags }: TrainingSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdDate'); // 'createdDate', 'title', 'status'
  const [sortOrder, setSortOrder] = useState<string>('desc'); // 'asc', 'desc'
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [trainingToDelete, setTrainingToDelete] = useState<string | null>(null);
  const router = useRouter();

  // Función para manejar la eliminación de una capacitación
  const handleDeleteTraining = async () => {
    if (!trainingToDelete) return;

    try {
      setIsDeleting(true);
      const result = await deleteTraining(trainingToDelete);

      if (result.success) {
        toast({
          title: 'Capacitación eliminada',
          description: 'La capacitación ha sido eliminada exitosamente',
          variant: 'default',
        });
        // Actualizar la UI (Next.js ya revalida la ruta automáticamente)
        router.refresh();
      } else {
        // Mostrar mensaje de error específico basado en la respuesta
        const errorMessage = result.error || 'No se pudo eliminar la capacitación';
        let specificError = errorMessage;

        // Añadir mensajes más descriptivos para errores comunes
        if (errorMessage.includes('estado borrador')) {
          specificError = 'Solo se pueden eliminar capacitaciones en estado borrador.';
        } else if (errorMessage.includes('no encontrada')) {
          specificError = 'La capacitación que intentas eliminar ya no existe.';
        }

        toast({
          title: 'Error al eliminar capacitación',
          description: specificError,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error al eliminar capacitación:', error);
      toast({
        title: 'Error inesperado',
        description: `Ocurrió un error inesperado: ${error?.message || 'Error desconocido'}`,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setConfirmDialogOpen(false);
      setTrainingToDelete(null);
    }
  };

  // Filter and sort trainings
  const filteredAndSortedTrainings = [...trainings]
    .filter((training) => {
      const matchesSearch =
        training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTag = tagFilter === 'all' || (training.tags || []).some((tag) => tag?.id === tagFilter);

      const matchesStatus = statusFilter === 'all' || training.status === statusFilter;

      return matchesSearch && matchesTag && matchesStatus;
    })
    .sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'createdDate') {
        const dateA = new Date(a.createdDate).getTime();
        const dateB = new Date(b.createdDate).getTime();
        compareValue = dateA - dateB;
      } else if (sortBy === 'title') {
        compareValue = a.title.localeCompare(b.title);
      } else if (sortBy === 'status') {
        // Define a custom order for status if needed, e.g., 'Publicado' before 'Borrador'
        const statusOrder: { [key: string]: number } = { Publicado: 1, Borrador: 2 };
        compareValue = statusOrder[a.status] - statusOrder[b.status];
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
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
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="tags">Etiquetas</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
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
                    <SelectItem key={tag.id} value={tag.id}>
                      {' '}
                      {/* Changed value to tag.id */}
                      {tag.name}
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
                  <SelectItem value="Publicado">Publicado</SelectItem>
                  <SelectItem value="Borrador">Borrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdDate">Fecha de Creación</SelectItem>
                  <SelectItem value="title">Título</SelectItem>
                  <SelectItem value="status">Estado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-[100px]">
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-4 w-4" /> Ascendente
                    </div>
                  </SelectItem>
                  <SelectItem value="desc">
                    <div className="flex items-center gap-2">
                      <SortDesc className="h-4 w-4" /> Descendente
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedTrainings.length > 0 ? (
              filteredAndSortedTrainings.map((training) => (
                <Card key={training.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <GraduationCap className="h-8 w-8 text-purple-600" />
                      <Badge variant={training.status === 'Publicado' ? 'default' : 'secondary'}>
                        {training.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{training.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{training.description}</CardDescription>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {training.tags.map((tag, index: number) => {
                        return (
                          <Badge
                            key={index}
                            variant="outline"
                            className="flex items-center gap-1 text-xs"
                            style={{ backgroundColor: tag?.color || '#ccc' }}
                          >
                            <Tag className="h-3 w-3" />
                            {tag?.name}
                          </Badge>
                        );
                      })}
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
                        {training.materials.map((material: TrainingMaterial, index: number) => (
                          <div key={index} className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1">
                            {getMaterialIcon(material.type)}
                            <span>{material.type.toUpperCase()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {training.evaluation && training.evaluation.questions.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Evaluación: {training.evaluation.questions.length} preguntas
                        {training.evaluation.passingScore > 0 && (
                          <> (mín. {training.evaluation.passingScore} correctas)</>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row gap-2">
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

                      {/* Botón eliminar solo para capacitaciones en estado Borrador */}
                      {training.status === 'Borrador' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setTrainingToDelete(training.id);
                            setConfirmDialogOpen(true);
                          }}
                          disabled={isDeleting && trainingToDelete === training.id}
                        >
                          {isDeleting && trainingToDelete === training.id ? (
                            <>Eliminando...</>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileX className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron capacitaciones</h3>
                <p className="text-gray-500 text-center max-w-md mb-4">
                  {searchTerm || tagFilter !== 'all' || statusFilter !== 'all'
                    ? 'No hay capacitaciones que coincidan con los criterios de búsqueda.'
                    : 'Aún no hay capacitaciones registradas en el sistema.'}
                </p>
                {(searchTerm || tagFilter !== 'all' || statusFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setTagFilter('all');
                      setStatusFilter('all');
                      setSortBy('createdDate');
                      setSortOrder('desc');
                    }}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}
          </div>
          {/* Diálogo de confirmación para eliminar */}
          <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600">
                  ¿Estás seguro de eliminar esta capacitación?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Esta acción es <strong>permanente</strong> y no podrá revertirse.
                  </p>
                  <p>Se eliminarán todos los elementos asociados:</p>
                  <ul className="list-disc pl-5">
                    <li>Preguntas de evaluación</li>
                    <li>Materiales de estudio</li>
                    <li>Etiquetas asociadas</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteTraining();
                  }}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
        <TabsContent value="tags">
          <TagTab tags={allTags} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
