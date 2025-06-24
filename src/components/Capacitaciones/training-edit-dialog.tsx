'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArchiveIcon, ArrowDown, ArrowUp, GlobeIcon, Loader2, PencilIcon, Plus, TagIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { fetchTrainingById, updateTraining } from './actions/actions';
import { uploadMaterialFile } from './utils/utils';

interface TrainingEditDialogProps {
  training: Awaited<ReturnType<typeof fetchTrainingById>>
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTab: string;
}

export function TrainingEditDialog({ training, open, onOpenChange, selectedTab }: TrainingEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    title: training?.title || '',
    description: training?.description || '',
    materials: training?.materials || [],
    questions: training?.evaluation?.questions || [],
    passingScore: training?.evaluation?.passingScore || 0,
    tags: training?.tags || [],
    newTag: '',
    status: training?.status || 'Borrador',
  });

  const handleAddMaterial = () => {
    const newMaterial = {
      id: `m${Date.now()}`,
      type: 'pdf',
      name: '',
      url: '',
      order: formData.materials.length + 1,
      is_required: false,
      file_size: 0,
    };
    setFormData({
      ...formData,
      materials: [...formData.materials, newMaterial],
    });
  };

  const handleRemoveMaterial = (id: string) => {
    const newMaterials = formData.materials.filter((m: any) => m.id !== id);
    // Reorder remaining materials
    const reorderedMaterials = newMaterials.map((m: any, index: number) => ({
      ...m,
      order: index + 1,
    }));
    setFormData({ ...formData, materials: reorderedMaterials });
  };

  const handleMoveMaterial = (id: string, direction: 'up' | 'down') => {
    const index = formData.materials.findIndex((m: any) => m.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === formData.materials.length - 1)) {
      return;
    }

    const newMaterials = [...formData.materials];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap order values
    const tempOrder = newMaterials[index].order;
    newMaterials[index].order = newMaterials[swapIndex].order;
    newMaterials[swapIndex].order = tempOrder;

    // Sort by order
    newMaterials.sort((a, b) => a.order - b.order);

    setFormData({ ...formData, materials: newMaterials });
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: `q${Date.now()}`,
      question: '',
      options: ['', ''],
      correctAnswer: 0,
      points: 0,
      order_index: formData.questions.length, // Añadir order_index para ordenar correctamente
    };
    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion],
    });
  };

  const handleRemoveQuestion = (id: string) => {
    const newQuestions = formData.questions.filter((q: any) => q.id !== id);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    const newQuestions = formData.questions.map((q: any) => {
      if (q.id === id) {
        if (field === 'options') {
          return { ...q, options: value };
        } else {
          return { ...q, [field]: value };
        }
      }
      return q;
    });
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleAddTag = () => {
    if (formData.newTag && !formData.tags.includes(formData.newTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.newTag],
        newTag: '',
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t: string) => t !== tag),
    });
  };

  const handleSubmit = async () => {
    // Verificar si hay archivos en proceso de subida
    if (Object.values(uploadingFiles).some(isUploading => isUploading)) {
      toast.error('Espera a que todos los archivos terminen de subirse');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await toast.promise(
        updateTraining(training?.id || '', {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          passingScore: parseInt(formData.passingScore.toString()),
          materials: formData.materials.map((material: any) => ({
            id: material.id,
            name: material.name,
            type: material.type,
            url: material.url,
            order: material.order,
            is_required: material.is_required,
            file_size: material.file_size,
          })),
          questions: formData.questions.map((question: any) => ({
            id: question.id,
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            points: question.points,
          })),
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
  
  const handleFileUpload = async (file: File, materialId: string, index: number) => {
    if (!file || !training?.id) return;
    
    // Actualizar estado para indicar que se está subiendo un archivo para este material
    setUploadingFiles(prev => ({ ...prev, [materialId]: true }));
    
    try {
      // Mostrar toast de carga
      toast.loading(`Subiendo ${file.name}...`, { id: `upload-${materialId}` });
      
      // Llamar a la función de carga de archivos
      const result = await uploadMaterialFile(file, training.id, training.title);
      
      if (result.success) {
        // Actualizar la URL del material en el formulario
        const newMaterials = [...formData.materials];
        if (result.url) { // Asegurar que la URL existe antes de asignarla
          newMaterials[index].url = result.url;
          newMaterials[index].file_size = file.size;
          setFormData({ ...formData, materials: newMaterials });
        }
        
        toast.success(`Archivo ${file.name} subido correctamente`, { id: `upload-${materialId}` });
      } else {
        toast.error(`Error al subir archivo: ${result.error}`, { id: `upload-${materialId}` });
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
      toast.error('Error inesperado al subir archivo', { id: `upload-${materialId}` });
    } finally {
      // Marcar como completada la subida para este material
      setUploadingFiles(prev => ({ ...prev, [materialId]: false }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <div className='flex justify-between items-center pt-2'>

        <DialogHeader>
          <DialogTitle>Editar Capacitación</DialogTitle>
          <DialogDescription>Modifica los detalles de la capacitación</DialogDescription>
        </DialogHeader>
      
              <Select
                onValueChange={(value : "Borrador" | "Archivado" | "Publicado") => setFormData({ ...formData, status: value })}
                defaultValue={formData.status}
              >
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                  {/* Si está en borrador, puede cambiar a cualquier estado */}
                  {formData.status === "Borrador" && (
                    <>
                      <SelectItem value="Borrador">
                        <div className='flex items-center gap-2'>
                          <PencilIcon className="h-4 w-4" />Borrador
                        </div>
                      </SelectItem>
                      <SelectItem value="Publicado">
                        <div className='flex items-center gap-2'>
                          <GlobeIcon className="h-4 w-4" />Publicado
                        </div>
                      </SelectItem>
                      <SelectItem value="Archivado">
                        <div className='flex items-center gap-2'>
                          <ArchiveIcon className="h-4 w-4" />Archivado
                        </div>
                      </SelectItem>
                    </>
                  )}
                  
                  {/* Si está publicado, solo puede archivarse */}
                  {formData.status === "Publicado" && (
                    <>
                      <SelectItem value="Publicado">
                        <div className='flex items-center gap-2'>
                          <GlobeIcon className="h-4 w-4" />Publicado
                        </div>
                      </SelectItem>
                      <SelectItem value="Archivado">
                        <div className='flex items-center gap-2'>
                          <ArchiveIcon className="h-4 w-4" />Archivado
                        </div>
                      </SelectItem>
                    </>
                  )}
                  
                  {/* Si está archivado, solo puede publicarse */}
                  {formData.status === "Archivado" && (
                    <>
                      <SelectItem value="Publicado">
                        <div className='flex items-center gap-2'>
                          <GlobeIcon className="h-4 w-4" />Publicado
                        </div>
                      </SelectItem>
                      <SelectItem value="Archivado">
                        <div className='flex items-center gap-2'>
                          <ArchiveIcon className="h-4 w-4" />Archivado
                        </div>
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
        </div>

        <Tabs defaultValue={selectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Información</TabsTrigger>
            <TabsTrigger value="materials">Materiales</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluación</TabsTrigger>
            <TabsTrigger value="tags">Etiquetas</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Materiales de Capacitación</h3>
              <Button onClick={handleAddMaterial} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Agregar Material
              </Button>
            </div>

            <div className="space-y-3">
              {formData.materials.map((material: any, index: number) => (
                <Card key={material.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          {material.order}
                        </span>
                        Material {index + 1}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={index === 0}
                          onClick={() => handleMoveMaterial(material.id, 'up')}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={index === formData.materials.length - 1}
                          onClick={() => handleMoveMaterial(material.id, 'down')}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleRemoveMaterial(material.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label>Tipo de Material</Label>
                        <Select
                          value={material.type}
                          onValueChange={(value) => {
                            const newMaterials = [...formData.materials];
                            newMaterials[index].type = value;
                            setFormData({ ...formData, materials: newMaterials });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="ppt">PowerPoint</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-2">
                        <Label>Nombre</Label>
                        <Input
                          value={material.name}
                          onChange={(e) => {
                            const newMaterials = [...formData.materials];
                            newMaterials[index].name = e.target.value;
                            setFormData({ ...formData, materials: newMaterials });
                          }}
                          placeholder="Nombre del material"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Archivo</Label>
                      <div className="flex flex-col gap-2">
                        <Input
                          type="file"
                          accept={
                            material.type === 'pdf' ? '.pdf' : material.type === 'video' ? '.mp4,.avi,.mov' : '.ppt,.pptx'
                          }
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, material.id, index);
                            }
                          }}
                          disabled={uploadingFiles[material.id]}
                        />
                        {uploadingFiles[material.id] && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs text-muted-foreground">Subiendo archivo...</span>
                          </div>
                        )}
                        {material.url && (
                          <p className="text-xs text-muted-foreground truncate">
                            Archivo actual: {material.url.split('/').pop()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="evaluation" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Evaluación</h3>
              <Button onClick={handleAddQuestion} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Agregar Pregunta
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingScore">Puntaje Mínimo para Aprobar</Label>
              <Input
                id="passingScore"
                type="number"
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: Number.parseInt(e.target.value) || 0 })}
                placeholder="Ej: 8"
                max={formData.questions.length}
              />
              <p className="text-sm text-muted-foreground">De {formData.questions.length} preguntas totales</p>
            </div>

            <div className="space-y-4">
              {formData.questions.map((question: any, index: number) => (
                <Card key={question.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">Pregunta {index + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleRemoveQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Pregunta</Label>
                      <Textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                        placeholder="Escribe la pregunta..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Opciones de Respuesta</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (question.options.length < 6) {
                                const newOptions = [...question.options, ''];
                                updateQuestion(question.id, 'options', newOptions);
                              }
                            }}
                            disabled={question.options.length >= 6}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (question.options.length > 2) {
                                const newOptions = question.options.slice(0, -1);
                                updateQuestion(question.id, 'options', newOptions);
                                // Ajustar respuesta correcta si es necesario
                                if (question.correctAnswer >= newOptions.length) {
                                  updateQuestion(question.id, 'correctAnswer', 0);
                                }
                              }
                            }}
                            disabled={question.options.length <= 2}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {question.options.map((option: string, optionIndex: number) => (
                        <div key={optionIndex} className="flex gap-2 items-center">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...question.options];
                              newOptions[optionIndex] = e.target.value;
                              updateQuestion(question.id, 'options', newOptions);
                            }}
                            placeholder={`Opción ${optionIndex + 1}`}
                            className="flex-1"
                          />
                          <div className="flex items-center gap-2 min-w-fit">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === optionIndex}
                              onChange={() => updateQuestion(question.id, 'correctAnswer', optionIndex)}
                            />
                            <Label className="text-xs sm:text-sm whitespace-nowrap">Correcta</Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tags" className="space-y-4">
            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                    <TagIcon className="h-3 w-3" />
                    {tag}
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
                <Input
                  placeholder="Nueva etiqueta..."
                  value={formData.newTag}
                  onChange={(e) => setFormData({ ...formData, newTag: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag}>
                  Agregar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Las etiquetas ayudan a categorizar y filtrar las capacitaciones
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || Object.values(uploadingFiles).some(isUploading => isUploading)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : Object.values(uploadingFiles).some(isUploading => isUploading) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo archivos...
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
