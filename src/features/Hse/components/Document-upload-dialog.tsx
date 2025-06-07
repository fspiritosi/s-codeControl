'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createDocument } from '@/features/Hse/actions/documents';
import { Plus, Upload } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';




// Esquema de validación
export const documentFormSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  version: z.string().min(1, 'La versión es requerida'),
  expiry_date: z.string().min(1, 'La fecha de vencimiento es requerida'),
  description: z.string().optional(),
  typeOfEmployee: z.array(z.string()).optional(), // Actualizar definición del esquema
  file: z.any()
    .refine(
      (file) => file instanceof File,
      { message: 'Por favor, sube un archivo' }
    )
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, 
      { message: 'El archivo no puede pesar más de 10MB' }
    )
    .refine(
      (file) => ['.pdf', '.doc', '.docx'].some(ext => file.name.toLowerCase().endsWith(ext)),
      { message: 'Solo se permiten archivos PDF, DOC o DOCX' }
    )
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

export function DocumentUploadDialog() {
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: '',
      version: '',
      expiry_date: '',
      description: '',
      typeOfEmployee: [],
    },
  });
  const cookies = Cookies.get();
  
  const router = useRouter();
  const fileRef = form.register('file');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [selectAll, setSelectAll] = useState(false);
  const positions = ['Gerente', 'Supervisor', 'Operario', 'Administrativo']; // Reemplazar con datos reales

  const companyId = cookies['actualComp'];

  // Función para manejar la selección de "Todos"
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    form.setValue('typeOfEmployee', checked ? positions : []);
  };

  // Función para manejar cambios en posiciones individuales
  const handlePositionChange = (position: string, checked: boolean) => {
    const currentSelections = form.getValues('typeOfEmployee') || [];
    let newSelections: string[] = [];
    
    if (checked) {
      newSelections = [...currentSelections, position];
    } else {
      newSelections = currentSelections.filter(p => p !== position);
    }
    
    form.setValue('typeOfEmployee', newSelections);
    setSelectAll(newSelections.length === positions.length);
  };

  const onSubmit = async (data: DocumentFormValues) => {
    if (!companyId) {
      console.error('No se pudo obtener el ID de la compañía');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('version', data.version);
      formData.append('expiry_date', data.expiry_date);
      if (data.description) {
        formData.append('description', data.description);
      }
      
      // Ensure we're getting the file from the file input
      const fileInput = fileInputRef.current;
      if (fileInput?.files?.[0]) {
        formData.append('file', fileInput.files[0]);
      } else if (data.file) {
        // Fallback to the file from form data if available
        formData.append('file', data.file);
      } else {
        throw new Error('No se ha seleccionado ningún archivo');
      }

      console.log('Enviando formulario con datos:', {
        title: data.title,
        version: data.version,
        expiry_date: data.expiry_date,
        hasFile: !!data.file,
        fileType: data.file?.type,
        fileSize: data.file?.size,
        fileName: data.file?.name
      });

      await createDocument(formData, companyId);
      // Cerrar el diálogo y limpiar el formulario
      document.getElementById('close-dialog')?.click();
      form.reset();
      toast({
        title: 'Documento subido con éxito',
        description: 'El documento se ha subido correctamente',
        variant: 'default',
        duration: 3000,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error al subir el documento',
        description: 'Hubo un problema al subir el documento',
        variant: 'destructive',
        duration: 3000,
      });
      console.error('Error al crear el documento:', error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          {' '}
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Documento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subir Nuevo Documento</DialogTitle>
          <DialogDescription>Agrega un nuevo documento HSE al sistema</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título del Documento</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Manual de Seguridad Vial"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versión</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 1.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Vencimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción del documento..."
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="typeOfEmployee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destinatarios</FormLabel>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="selectAll"
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label htmlFor="selectAll" className="font-medium">Todos los empleados</Label>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      {positions.map((position) => (
                        <div key={position} className="flex items-center space-x-2">
                          <Checkbox
                            id={`position-${position}`}
                            checked={field.value?.includes(position) || false}
                            onCheckedChange={(checked) => 
                              handlePositionChange(position, checked as boolean)
                            }
                          />
                          <Label htmlFor={`position-${position}`}>{position}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange } }) => (
                <FormItem>
                  <FormLabel>Archivo</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        {...fileRef}
                        ref={(e) => {
                          fileRef.ref(e);
                          if (e) {
                            (fileInputRef as any).current = e;
                          }
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFileName(file.name);
                            onChange(file);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full justify-between"
                      >
                        <span>{fileName || 'Seleccionar archivo'}</span>
                        <Upload className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Formatos permitidos: PDF, DOC, DOCX (máx. 10MB)</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" id="close-dialog">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Subiendo...' : 'Subir Documento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
