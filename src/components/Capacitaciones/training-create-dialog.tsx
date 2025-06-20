'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { addTrainingMaterials, createTraining } from './actions/actions';
import { uploadMaterialFile } from './utils/utils';

interface TrainingCreateDialogProps {
  // No se necesitan props por ahora
}

export function TrainingCreateDialog() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    materials: [] as Array<{ type: string; file: File | null; name: string }>,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const addMaterial = () => {
    setFormData({
      ...formData,
      materials: [...formData.materials, { type: 'pdf', file: null, name: '' }],
    });
  };

  const removeMaterial = (index: number) => {
    const newMaterials = formData.materials.filter((_, i) => i !== index);
    setFormData({ ...formData, materials: newMaterials });
  };



  const handleSubmit = async () => {
    toast.promise(
      async () => {
        try {
          setIsLoading(true);

          // Validación básica
          if (!formData.title.trim()) {
            // toast({
            //   title: 'Error',
            //   description: 'El título de la capacitación es obligatorio',
            //   variant: 'destructive',
            // });
            setIsLoading(false);
            // return;
            throw new Error('El título de la capacitación es obligatorio');
          }

          // 1. Crear la capacitación principal
          const trainingResult = await createTraining({
            title: formData.title,
            description: formData.description,
            // No se envía passing_score ya que es opcional y se manejará en la evaluación si es necesario
          });

          if (!trainingResult.success) {
            setIsLoading(false);
            // return;
            throw new Error(trainingResult.error);
          }

          // Verificar que trainingResult.data existe y tiene un id
          if (!trainingResult.data || !trainingResult.data.id) {
            // toast({
            //   title: 'Error',
            //   description: 'No se pudo obtener el ID de la capacitación creada',
            //   variant: 'destructive',
            setIsLoading(false);
            throw new Error('No se pudo obtener el ID de la capacitación creada');
          }

          const trainingId = trainingResult.data.id;

          // 2. Subir los materiales si existen
          if (formData.materials.length > 0) {
            // Subir archivos a Supabase Storage
            const materialUploads = formData.materials
              .filter((m) => m.file) // Solo los que tienen archivo
              .map(async (material) => {
                if (material.file) {
                  return await uploadMaterialFile(material.file, trainingId);
                }
                return null;
              });

            const uploadResults = await Promise.all(materialUploads);
            // Filtra resultados exitosos que tienen url definida
            const validUploads = uploadResults
              .filter((result): result is { success: true, url: string, path: string } => 
                !!result && result.success === true && typeof result.url === 'string');

            // Crear registros de materiales en la base de datos
            if (validUploads.length > 0) {
              const materialsData = validUploads.map((upload, index) => {
                const material = formData.materials[index];
                return {
                  name: material.name || material.file?.name || `Material ${index + 1}`,
                  type: material.type,
                  file_url: upload.url, // Ya filtramos para garantizar que url existe
                  file_size: material.file?.size || 0,
                  order_index: index,
                  is_required: true
                };
              });
              
              await addTrainingMaterials(trainingId, materialsData);
            }
          }

          // 3. Limpiar formulario y cerrar diálogo

          // Reset form
          setFormData({
            title: '',
            description: '',
            materials: [],
          });

          setIsDialogOpen(false);
          router.refresh(); // Para actualizar la lista de capacitaciones
        } catch (error: any) {
          console.error('Error al crear capacitación:', error);
          // toast({
          //   title: 'Error inesperado',
          //   description: error.message || 'Ocurrió un error al crear la capacitación',
          //   variant: 'destructive',
          // });
          throw error;
        } finally {
          setIsLoading(false);
        }
      },
      {
        loading: 'Creando capacitación...',
        success: 'Capacitación creada exitosamente',
        error: 'Error al crear la capacitación',
      }
    );
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Capacitación
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Nueva Capacitación</DialogTitle>
          <DialogDescription>Rellena la información para crear una nueva capacitación.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Información</TabsTrigger>
            <TabsTrigger value="materials">Materiales</TabsTrigger>
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
              <Button onClick={addMaterial} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Agregar Material
              </Button>
            </div>

            <div className="space-y-3">
              {formData.materials.map((material, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
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
                        <Label>Archivo</Label>
                        <Input
                          type="file"
                          accept={
                            material.type === 'pdf'
                              ? '.pdf'
                              : material.type === 'video'
                                ? '.mp4,.avi,.mov'
                                : '.ppt,.pptx'
                          }
                          onChange={(e) => {
                            const newMaterials = [...formData.materials];
                            newMaterials[index].file = e.target.files?.[0] || null;
                            setFormData({ ...formData, materials: newMaterials });
                          }}
                        />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => removeMaterial(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>


        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>Crear Capacitación</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
