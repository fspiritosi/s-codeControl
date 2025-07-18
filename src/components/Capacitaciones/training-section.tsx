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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { FileText, FileX, Filter, Grid, List, Presentation, RefreshCcw, SortAsc, SortDesc, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteTraining, type fetchAllTags, type fetchTrainings } from './actions/actions';
import { TrainingGrid } from './components/TrainingGrid';
import { TrainingList } from './components/TrainingList';

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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('createdDate'); // 'createdDate', 'title', 'status'
  const [sortOrder, setSortOrder] = useState<string>('desc'); // 'asc', 'desc'
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [trainingToDelete, setTrainingToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  // Filtrar capacitaciones por estado para cada tab
  const publishedTrainings = trainings.filter((training) => training.status === 'Publicado');
  const draftTrainings = trainings.filter((training) => training.status === 'Borrador');
  const archivedTrainings = trainings.filter((training) => training.status === 'Archivado');
  
  // Determinar el conjunto de capacitaciones actualmente seleccionado por tab
  const [tab, setTab] = useState<'published' | 'draft' | 'archived'>('published');
  const currentTabTrainings = 
    tab === 'published' ? publishedTrainings : 
    tab === 'draft' ? draftTrainings : 
    archivedTrainings;

  // Filtrar capacitaciones por búsqueda y etiquetas
  const filteredTrainings = currentTabTrainings.filter((training) => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase());

    // Si no hay etiquetas seleccionadas, mostrar todas las capacitaciones que coincidan con la búsqueda
    if (selectedTags.length === 0) {
      return matchesSearch;
    }

    // Verificar si la capacitación tiene al menos una de las etiquetas seleccionadas
    const hasMatchingTag = training.tags && training.tags.some((tag: any) => selectedTags.includes(tag.id));

    return matchesSearch && hasMatchingTag;
  });

  // Ordenar capacitaciones
  const filteredAndSortedTrainings = [...filteredTrainings].sort((a, b) => {
    let compareValue = 0;

    if (sortBy === 'createdDate') {
      const dateA = new Date(a.createdDate).getTime();
      const dateB = new Date(b.createdDate).getTime();
      compareValue = dateA - dateB;
    } else if (sortBy === 'title') {
      compareValue = a.title.localeCompare(b.title);
    } else if (sortBy === 'status') {
      // Define un orden personalizado para los estados: 'Publicado' antes que 'Borrador'
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
      <Tabs 
        defaultValue="published"
        value={tab}
        onValueChange={(value: string) => {
          if (value === 'published' || value === 'draft' || value === 'archived') {
            setTab(value as 'published' | 'draft' | 'archived');
          }
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="published" className="text-xs sm:text-sm">
            Publicado ({publishedTrainings.length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="text-xs sm:text-sm">
            Borrador ({draftTrainings.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="text-xs sm:text-sm">
            Archivado ({archivedTrainings.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="flex flex-col gap-2 w-[180]">
                <div>
                  <Input
                    placeholder="Buscar capacitaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Filter className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="w-full md:w-[180px]">
              <MultiSelectCombobox
                options={
                  allTags?.map((tag) => ({
                    label: tag.name,
                    value: tag.id,
                  })) || []
                }
                selectedValues={selectedTags}
                placeholder="Filtrar por etiquetas"
                emptyMessage="No hay etiquetas disponibles"
                onChange={setSelectedTags}
                showSelectAll
              />
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
            <div className="w-full md:w-[180px]">
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
            <div className="relative group">
              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="relative"
              >
                {viewMode === 'grid' ? (
                  <List className="h-4 w-4 mr-1 hover:text-primary-foreground" />
                ) : (
                  <Grid className="h-4 w-4 mr-1 hover:text-primary-foreground" />
                )}
              </Button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Vista de {viewMode === 'grid' ? 'lista' : 'cuadrícula'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800"></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredAndSortedTrainings.length > 0 ? (
              viewMode === 'grid' ? (
                <TrainingGrid
                  trainings={filteredAndSortedTrainings}
                  onDeleteClick={(id) => {
                    setTrainingToDelete(id);
                    setConfirmDialogOpen(true);
                  }}
                  getMaterialIcon={getMaterialIcon}
                  isDeleting={isDeleting}
                  trainingToDelete={trainingToDelete}
                  onViewEmployee={() => window.open('/hse/training', '_blank')}
                  onManage={(id) => router.push(`/dashboard/hse/detail/${id}`)}
                />
              ) : (
                <TrainingList
                  trainings={filteredAndSortedTrainings}
                  onDeleteClick={(id) => {
                    setTrainingToDelete(id);
                    setConfirmDialogOpen(true);
                  }}
                  getMaterialIcon={getMaterialIcon}
                  isDeleting={isDeleting}
                  trainingToDelete={trainingToDelete}
                  onViewEmployee={() => window.open('/hse/training', '_blank')}
                  onManage={(id) => router.push(`/dashboard/hse/detail/${id}`)}
                />
              )
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileX className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron capacitaciones</h3>
                <p className="text-gray-500 text-center max-w-md mb-4">
                  {searchTerm || selectedTags.length > 0 
                    ? 'No hay capacitaciones que coincidan con los criterios de búsqueda.'
                    : tab === 'published' 
                      ? 'No hay capacitaciones publicadas.'
                      : tab === 'draft'
                        ? 'No hay capacitaciones en borrador.'
                        : 'No hay capacitaciones archivadas.'}
                </p>
                {(searchTerm || selectedTags.length > 0) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedTags([]);
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
        {/* <TabsContent value="tags">
          <TagTab tags={allTags} />
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
