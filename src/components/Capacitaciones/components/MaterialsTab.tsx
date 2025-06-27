'use client';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, Edit, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateTrainingMaterials, type fetchTrainingById } from '../actions/actions';
import { MaterialViewer } from '../material-viewer';
import { uploadMaterialFile } from '../utils/utils';

// Define the Material interface to include localFile
interface Material {
  id?: string;
  name: string;
  type: 'pdf' | 'video' | 'ppt' | 'image';
  url: string;
  order: number;
  is_required?: boolean;
  file_size?: number;
  localFile?: File | null; // New property for local file object
  isNew?: boolean; // To identify newly added materials not yet saved to DB
}

function MaterialsTab({ training }: { training: Awaited<ReturnType<typeof fetchTrainingById>> }) {
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);
  const [showMaterialViewer, setShowMaterialViewer] = useState(false);
  const [isEditingEnabled, setIsEditingEnabled] = useState(false); // New state for enabling/disabling editing

  // State for the new material form
  const [newMaterialForm, setNewMaterialForm] = useState<{
    type: Material['type'];
    name: string;
    localFile: File | null;
  }>({
    type: 'pdf',
    name: '',
    localFile: null,
  });

  // Initialize formData with existing materials, ensuring 'localFile' is null by default
  const [formData, setFormData] = useState<{ materials: Material[] }>({
    materials:
      training?.materials?.map((m: any) => ({
        ...m,
        localFile: null, // Initialize localFile for existing materials
        isNew: false, // Existing materials are not new
      })) || [],
  });

  const handleAddNewMaterial = () => {
    if (!newMaterialForm.name || !newMaterialForm.localFile) {
      toast.error('Por favor, completa el nombre y selecciona un archivo para el nuevo material.');
      return;
    }

    const newMaterial: Material = {
      id: `m${Date.now()}`, // Temporary ID for new materials
      type: newMaterialForm.type,
      name: newMaterialForm.name,
      url: '', // No URL initially, will be set after upload
      order: formData.materials.length + 1,
      is_required: true, // Default to true, can be changed
      file_size: newMaterialForm.localFile.size,
      localFile: newMaterialForm.localFile,
      isNew: true, // Mark as new
    };
    setFormData({
      ...formData,
      materials: [...formData.materials, newMaterial],
    });
    // Reset new material form
    setNewMaterialForm({ type: 'pdf', name: '', localFile: null });
    // Clear file input manually
    const fileInput = document.getElementById('new-material-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    setIsEditingEnabled(true); // Enable editing when a new material is added
  };

  const handleRemoveMaterial = (id: string) => {
    const newMaterials = formData.materials.filter((m) => m.id !== id);
    // Reorder remaining materials
    const reorderedMaterials = newMaterials.map((m, index: number) => ({
      ...m,
      order: index + 1,
    }));
    setFormData({ ...formData, materials: reorderedMaterials });
  };

  const handleMoveMaterial = (id: string, direction: 'up' | 'down') => {
    const index = formData.materials.findIndex((m) => m.id === id);
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

  const handleExistingFileChange = (file: File | null, materialId: string, index: number) => {
    const newMaterials = [...formData.materials];
    if (file) {
      newMaterials[index].localFile = file;
      newMaterials[index].name = file.name; // Update name to file name
      newMaterials[index].file_size = file.size;
      // Do NOT clear material.url here. It will be used by updateTrainingMaterials to delete old file.
      // The new URL will be set after successful upload in handleSubmitMaterials.
    } else {
      newMaterials[index].localFile = null;
      newMaterials[index].file_size = 0;
      newMaterials[index].url = ''; // Clear URL if file is removed
    }
    setFormData({ ...formData, materials: newMaterials });
  };

  const handleSubmitMaterials = async () => {
    setIsSubmitting(true);
    let hasUploadErrors = false;
    const materialsToSave: Material[] = [];

    // Step 1: Upload new/updated files
    for (let i = 0; i < formData.materials.length; i++) {
      const material = { ...formData.materials[i] }; // Create a copy to modify
      if (material.localFile) {
        setUploadingFiles((prev) => ({ ...prev, [material.id!]: true }));
        toast.loading(`Subiendo ${material.localFile.name}...`, { id: `upload-${material.id}` });

        try {
          const result = await uploadMaterialFile(material.localFile, training?.id!, training?.title);

          if (result.success && result.url) {
            material.url = result.url; // Update URL with the new public URL
            material.localFile = null; // Clear localFile after successful upload
            material.isNew = false; // Mark as no longer new
            toast.success(`Archivo ${material.name} subido correctamente`, { id: `upload-${material.id}` });
          } else {
            hasUploadErrors = true;
            toast.error(`Error al subir archivo ${material.name}: ${result.error}`, {
              id: `upload-${material.id}`,
            });
          }
        } catch (error) {
          hasUploadErrors = true;
          toast.error(`Error inesperado al subir archivo ${material.name}`, { id: `upload-${material.id}` });
          console.error('Error during file upload:', error);
        } finally {
          setUploadingFiles((prev) => ({ ...prev, [material.id!]: false }));
        }
      }
      materialsToSave.push(material); // Add the (potentially updated) material to the list for DB save
    }

    if (hasUploadErrors) {
      setIsSubmitting(false);
      return; // Stop if any file upload failed
    }

    // Step 2: Update materials in the database
    try {
      await toast.promise(
        updateTrainingMaterials(
          training?.id || '',
          materialsToSave.map((material) => ({
            id: material.id,
            name: material.name,
            type: material.type,
            url: material.url,
            order: material.order,
            is_required: material.is_required !== undefined ? material.is_required : true,
            file_size: material.file_size || 0,
          }))
        ),
        {
          loading: 'Guardando cambios en la capacitación...',
          success: 'Capacitación actualizada correctamente',
          error: 'Error al actualizar la capacitación',
        }
      );
      // Update local state with the saved materials (without localFile)
      setFormData({
        materials: materialsToSave.map((m) => ({ ...m, localFile: null, isNew: false })),
      });
      setIsEditingEnabled(false); // Disable editing after saving
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAnyFileUploading = Object.values(uploadingFiles).some((isUploading) => isUploading);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna izquierda: Formulario para agregar nuevo material */}
        <Card>
          <CardHeader>
            <CardTitle>Agregar Nuevo Material</CardTitle>
            <CardDescription>Sube un nuevo archivo para esta capacitación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-material-name">Nombre del Material</Label>
              <Input
                id="new-material-name"
                value={newMaterialForm.name}
                onChange={(e) => setNewMaterialForm({ ...newMaterialForm, name: e.target.value })}
                placeholder="Ej: Presentación de Inducción"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-material-type">Tipo de Material</Label>
              <Select
                value={newMaterialForm.type}
                onValueChange={(value) => setNewMaterialForm({ ...newMaterialForm, type: value as Material['type'] })}
              >
                <SelectTrigger id="new-material-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="ppt">PowerPoint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-material-file-input">Archivo</Label>
              <Input
                id="new-material-file-input"
                type="file"
                accept={
                  newMaterialForm.type === 'pdf'
                    ? '.pdf'
                    : newMaterialForm.type === 'video'
                      ? '.mp4,.avi,.mov'
                      : newMaterialForm.type === 'ppt'
                        ? '.ppt,.pptx'
                        : '.jpg,.jpeg,.png,.gif'
                }
                onChange={(e) => setNewMaterialForm({ ...newMaterialForm, localFile: e.target.files?.[0] || null })}
              />
              {newMaterialForm.localFile && (
                <p className="text-xs text-muted-foreground">
                  Archivo seleccionado: {newMaterialForm.localFile.name} (
                  {(newMaterialForm.localFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <Button onClick={handleAddNewMaterial} className="w-full" disabled={isSubmitting || isAnyFileUploading}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar a la Lista
            </Button>
          </CardContent>
        </Card>

        {/* Columna derecha: Lista de materiales existentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Materiales de Capacitación</CardTitle>
              <CardDescription>Gestiona y ordena los materiales disponibles para esta capacitación</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isEditingEnabled ? (
                <Button onClick={() => setIsEditingEnabled(true)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Habilitar Edición
                </Button>
              ) : (
                <Button size="sm" onClick={handleSubmitMaterials} disabled={isSubmitting || isAnyFileUploading}>
                  <Save className="h-4 w-4 mr-1" />
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : isAnyFileUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo archivos...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {formData.materials.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay materiales agregados aún.</p>
                <p>Usa el formulario de la izquierda para añadir nuevos materiales.</p>
              </div>
            ) : (
              formData.materials.map((material, index: number) => {
                // Disable inputs if editing is not enabled AND it's an existing material (not new)
                const isDisabled = !isEditingEnabled && !material.isNew;

                return (
                  <Card key={material.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <span className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            {material.order}
                          </span>
                          {material.name || `Material ${index + 1}`}
                          {material.isNew && <Badge variant="outline">Nuevo</Badge>}
                        </CardTitle>
                        <div className="flex gap-1">
                          {material.url ? (
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
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={isDisabled || index === 0}
                            onClick={() => handleMoveMaterial(material.id!, 'up')}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={isDisabled || index === formData.materials.length - 1}
                            onClick={() => handleMoveMaterial(material.id!, 'down')}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleRemoveMaterial(material.id!)}
                            disabled={isDisabled}
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
                              newMaterials[index].type = value as Material['type'];
                              setFormData({ ...formData, materials: newMaterials });
                            }}
                            disabled={isDisabled}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="ppt">PowerPoint</SelectItem>
                              <SelectItem value="image">Imagen</SelectItem>
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
                            disabled={isDisabled}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Archivo</Label>
                        <div className="flex flex-col gap-2">
                          <Input
                            type="file"
                            accept={
                              material.type === 'pdf'
                                ? '.pdf'
                                : material.type === 'video'
                                  ? '.mp4,.avi,.mov'
                                  : material.type === 'ppt'
                                    ? '.ppt,.pptx'
                                    : '.jpg,.jpeg,.png,.gif'
                            }
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleExistingFileChange(file || null, material.id!, index);
                            }}
                            disabled={isDisabled || uploadingFiles[material.id!]} // Disable if this specific file is uploading
                          />
                          {uploadingFiles[material.id!] && (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-xs text-muted-foreground">Subiendo archivo...</span>
                            </div>
                          )}
                          {material.url && !material.localFile && (
                            <p className="text-xs text-muted-foreground truncate">
                              Archivo actual: {material.url.split('/').pop()}
                            </p>
                          )}
                          {material.localFile && (
                            <p className="text-xs text-muted-foreground truncate">
                              Nuevo archivo seleccionado: {material.localFile.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
      {/* Pass formData.materials to MaterialViewer to show current local state */}
      <MaterialViewer
        materials={formData.materials.filter((m) => m.url)} // Only show materials with a URL
        open={showMaterialViewer}
        onOpenChange={setShowMaterialViewer}
        initialMaterialIndex={selectedMaterialIndex} // Pass initial index
      />
    </>
  );
}

export default MaterialsTab;
