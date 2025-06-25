'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArchiveIcon, GlobeIcon, Loader2, PencilIcon, TagIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { MultiSelectCombobox } from '../ui/multi-select-combobox';
import { fetchAllTags, fetchTrainingById, updateTraining } from './actions/actions';

interface TrainingEditDialogProps {
  training: Awaited<ReturnType<typeof fetchTrainingById>>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTab: string;
  allTags: Awaited<ReturnType<typeof fetchAllTags>>;
}

export function TrainingEditDialog({ training, allTags, open, onOpenChange, selectedTab }: TrainingEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    title: training?.title || '',
    description: training?.description || '',
    tags: training?.tags || [],
    newTag: '',
    status: training?.status || 'Borrador',
  });

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t: string) => t !== tag),
    });
  };

  const handleSubmit = async () => {
    // Verificar si hay archivos en proceso de subida
    // if (Object.values(uploadingFiles).some((isUploading) => isUploading)) {
    //   toast.error('Espera a que todos los archivos terminen de subirse');
    //   return;
    // }

    setIsSubmitting(true);

    console.log('Form data:', formData);

    try {
      await toast.promise(
        updateTraining(training?.id || '', {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          tags: formData.tags,
        }),
        {
          loading: 'Actualizando capacitación...',
          success: 'Capacitación actualizada correctamente',
          error: 'Error al actualizar la capacitación',
        }
      );

      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center pt-2">
          <DialogHeader>
            <DialogTitle>Editar Capacitación</DialogTitle>
            <DialogDescription>Modifica los detalles de la capacitación</DialogDescription>
          </DialogHeader>

          <Select
            onValueChange={(value: 'Borrador' | 'Archivado' | 'Publicado') =>
              setFormData({ ...formData, status: value })
            }
            defaultValue={formData.status}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccione un estado" />
            </SelectTrigger>
            <SelectContent>
              {/* Si está en borrador, puede cambiar a cualquier estado */}
              {formData.status === 'Borrador' && (
                <>
                  <SelectItem value="Borrador">
                    <div className="flex items-center gap-2">
                      <PencilIcon className="h-4 w-4" />
                      Borrador
                    </div>
                  </SelectItem>
                  <SelectItem value="Publicado">
                    <div className="flex items-center gap-2">
                      <GlobeIcon className="h-4 w-4" />
                      Publicado
                    </div>
                  </SelectItem>
                  <SelectItem value="Archivado">
                    <div className="flex items-center gap-2">
                      <ArchiveIcon className="h-4 w-4" />
                      Archivado
                    </div>
                  </SelectItem>
                </>
              )}

              {/* Si está publicado, solo puede archivarse */}
              {formData.status === 'Publicado' && (
                <>
                  <SelectItem value="Publicado">
                    <div className="flex items-center gap-2">
                      <GlobeIcon className="h-4 w-4" />
                      Publicado
                    </div>
                  </SelectItem>
                  <SelectItem value="Archivado">
                    <div className="flex items-center gap-2">
                      <ArchiveIcon className="h-4 w-4" />
                      Archivado
                    </div>
                  </SelectItem>
                </>
              )}

              {/* Si está archivado, solo puede publicarse */}
              {formData.status === 'Archivado' && (
                <>
                  <SelectItem value="Publicado">
                    <div className="flex items-center gap-2">
                      <GlobeIcon className="h-4 w-4" />
                      Publicado
                    </div>
                  </SelectItem>
                  <SelectItem value="Archivado">
                    <div className="flex items-center gap-2">
                      <ArchiveIcon className="h-4 w-4" />
                      Archivado
                    </div>
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue={selectedTab} className="w-full">
          <div className="space-y-2">
            <Label htmlFor="title">Título de la Capacitación</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Seguridad en Carretera"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe el contenido de la capacitación..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                  <TagIcon className="h-3 w-3" />
                  {allTags.find((t) => t.id === tag)?.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 rounded-full"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <MultiSelectCombobox
                options={allTags.map((tag) => ({ value: tag.id, label: tag.name }))}
                placeholder="Seleccionar etiquetas"
                emptyMessage="No se encontraron etiquetas"
                selectedValues={formData.tags || []}
                onChange={(value) => {
                  setFormData({ ...formData, tags: value });
                }}
                showSelectAll
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Las etiquetas ayudan a categorizar y filtrar las capacitaciones
            </p>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
