"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createDocumentWithAssignments, getAllHierarchicalPositions, updateDocument } from "@/features/Hse/actions/documents"
import { Plus, Upload } from "lucide-react"
import Cookies from "js-cookie"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox"
import { getTypeOfEmployeeForDocument } from '../actions/documents';
// Esquema de validación
const documentFormSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  version: z.string().min(1, "La versión es obligatoria"),
  expiry_date: z.string().optional(),
  description: z.string().optional(),
  typeOfEmployee: z.array(z.string()).optional(),
  file: z
    .any()
    .optional()
    .refine((file) => {
      if (!file) return true; // Archivo opcional
      if (file instanceof File) {
        return [".pdf", ".doc", ".docx"].some((ext) => 
          file.name.toLowerCase().endsWith(ext)
        );
      }
      return false; // No es un archivo válido
    }, {
      message: "Solo se permiten archivos PDF, DOC o DOCX",
    })
    .refine((file) => {
      if (!file) return true; // Archivo opcional
      return file.size <= 10 * 1024 * 1024; // 10MB
    }, {
      message: "El archivo no puede pesar más de 10MB",
    }),
});
interface DocumentUploadDialogProps {
  open?: boolean; // Opcional, solo si quieres controlar el modal desde afuera
  onOpenChange?: (open: boolean) => void;
  initialData?: DocumentFormValues & { id?: string };
  documentId?: string;
  mode?: "create" | "edit";
}
type DocumentFormValues = z.infer<typeof documentFormSchema> & {
  id?: string;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  typeOfEmployee?: string[];
}

export function DocumentUploadDialog({ open, onOpenChange, initialData, documentId, mode }: DocumentUploadDialogProps) {
  const [positions, setPositions] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [selectAll, setSelectAll] = useState(false);
  
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: "",
      version: "",
      expiry_date: "",
      description: "",
      typeOfEmployee: [],
      ...(mode === "edit" && initialData ? {
        ...initialData,
        id: initialData.id, // Incluir el id en modo edición
      } : {})
    },
  });

  const cookies = Cookies.get();
  const router = useRouter();
  const fileRef = form.register("file");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  console.log('Initial data:', initialData);
  
  // Efecto para manejar la conversión de valores iniciales cuando se cargan las posiciones
  useEffect(() => {
    if (mode === "edit" && initialData?.typeOfEmployee && positions.length > 0) {
      console.log('Converting initial data:', initialData.typeOfEmployee);
      // Convertir nombres de cargos a sus respectivos IDs
      const convertedValues = initialData.typeOfEmployee
        .map(name => {
          const position = positions.find(p => p.label === name);
          console.log(`Converting ${name}:`, position);
          return position?.value || null;
        })
        .filter(Boolean);
      
      console.log('Converted values:', convertedValues);
      
      if (convertedValues.length > 0) {
        form.setValue('typeOfEmployee', convertedValues, { shouldValidate: true });
      }
    }
  }, [positions, mode, initialData, form]);
  // Cargar las posiciones jerárquicas disponibles
  useEffect(() => {
    const loadPositions = async () => {
      try {
        const { data: positionsData, error } = await getAllHierarchicalPositions();
        
        if (error) {
          console.error('Error al cargar las posiciones jerárquicas:', error);
          return;
        }
        
        const formattedPositions = (positionsData || []).map((position: any) => ({
          label: position.name,
          value: position.id.toString()
        }));
        
        setPositions(formattedPositions);
      } catch (error) {
        console.error('Error al cargar posiciones:', error);
      }
    };
    
    loadPositions();
  }, []);
  
  // Inicializar el formulario con los datos iniciales
  useEffect(() => {
    // Solo hacer algo si estamos en modo edición y hay datos iniciales
    if (mode === "edit" && initialData) {
      // Configurar el archivo si existe
      if (initialData.file_path) {
        setFileName(initialData.file_name || "Archivo actual");
        const file = new File([], initialData.file_name || "", { 
          type: initialData.file_type || "application/octet-stream" 
        });
        Object.defineProperty(file, 'size', { value: initialData.file_size || 0 });
        form.setValue("file", file);
      }
    }
    // No hacemos nada en modo creación ya que el formulario ya está vacío por defecto
  }, [mode, initialData]);
  
  // Resetear el formulario cuando se abre el diálogo en modo creación
  useEffect(() => {
    if (mode === "create") {
      form.reset({
        title: "",
        version: "",
        description: "",
        expiry_date: "",
        typeOfEmployee: [],
        file: undefined
      });
      setFileName("");
    }
  }, [mode, form]);
  console.log(initialData)
  // const positions = [
  //   { label: "Gerente", value: "Gerente" },
  //   { label: "Supervisor", value: "Supervisor" },
  //   { label: "Operativo", value: "operativo" },
  //   { label: "Administrativo", value: "administrativo" },
  // ]
  const companyId = cookies["actualComp"]

  // Función para manejar la selección de "Todos"
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    form.setValue("typeOfEmployee", checked ? [] : [])
  }

  // Función para manejar cambios en posiciones individuales
  const handlePositionChange = (position: string, checked: boolean) => {
    const currentSelections = form.getValues("typeOfEmployee") || []
    let newSelections: string[] = []

    if (checked) {
      newSelections = [...currentSelections, position]
    } else {
      newSelections = currentSelections.filter((p) => p !== position)
    }

    form.setValue("typeOfEmployee", newSelections)
    setSelectAll(newSelections.length === positions.length)
  }

//   const onSubmit = async (data: DocumentFormValues) => {
//     if (!companyId) {
//       console.error("No se pudo obtener el ID de la compañía")
//       return
//     }

//     try {
//       const formData = new FormData()
//       formData.append("title", data.title)
//       formData.append("version", data.version)
//       formData.append("expiry_date", data.expiry_date || "")
//       if (data.description) {
//         formData.append("description", data.description)
//       }
//       // Si no hay cargos seleccionados, usamos todos los cargos disponibles
// const selectedPositions = data.typeOfEmployee && data.typeOfEmployee.length > 0
// ? data.typeOfEmployee
// : positions.map((p) => p.value)

//       // ✅ CAMBIO PRINCIPAL: Agregar typeOfEmployee al FormData
//       formData.append("typeOfEmployee", JSON.stringify(selectedPositions))

//       // Ensure we're getting the file from the file input
//       const fileInput = fileInputRef.current
//       if (fileInput?.files?.[0]) {
//         formData.append("file", fileInput.files[0])
//       } else if (data.file) {
//         formData.append("file", data.file)
//       } else {
//         throw new Error("No se ha seleccionado ningún archivo")
//       }

//       const result = await createDocumentWithAssignments(formData, companyId)

//       if (!result?.success) {
//         throw new Error("No se pudo crear el documento")
//       }

//       // Cerrar el diálogo y limpiar el formulario
//       document.getElementById("close-dialog")?.click()
//       form.reset()
//       setFileName("") // ✅ Limpiar nombre del archivo

//       // ✅ MEJORA: Mensaje más informativo sobre las asignaciones
//       const assignmentMessage =
//         data.typeOfEmployee && data.typeOfEmployee.length > 0
//           ? `Documento asignado a empleados con cargos: ${data.typeOfEmployee.map((id) => positions.find((p) => p.value === id)?.label).join(", ")}`
//           : "Documento asignado a todos los empleados activos"

//       toast({
//         title: "Documento subido con éxito",
//         description: `${result.document.title} - ${assignmentMessage}`,
//         variant: "default",
//         duration: 5000, // ✅ Más tiempo para leer el mensaje
//       })

//       router.refresh()
//     } catch (error) {
//       if (error instanceof Error && error.message === "El documento ya existe") {
//         toast({
//           title: "El documento ya existe",
//           description: "Por favor, ve al detalle del documento para agregar una nueva versión.",
//           variant: "destructive",
//           duration: 5000,
//         })
//       } else {
//         toast({
//           title: "Error al subir el documento",
//           description: error instanceof Error ? error.message : "Hubo un problema al subir el documento",
//           variant: "destructive",
//           duration: 5000,
//         })
//         console.error("Error al crear el documento:", error)
//       }
//     }
//   }
const onSubmit = async (data: DocumentFormValues) => {
  try {
    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("version", data.version);

    const selectedPositions: string[] = Array.isArray(data.typeOfEmployee) && data.typeOfEmployee.length > 0
  ? data.typeOfEmployee
  : positions.map((p) => p.value);


    formData.append("typeOfEmployee", JSON.stringify(selectedPositions));

    if (data.expiry_date) formData.append("expiry_date", data.expiry_date);
    if (data.description) formData.append("description", data.description);

    if (mode === "edit" && documentId) {
      formData.append("documentId", documentId);

      if (data.file instanceof File) {
        formData.append("file", data.file);
      }

      const result = await updateDocument(formData, companyId); // ✅ companyId solo como argumento

      if (!result?.success) {
        throw new Error("No se pudo actualizar el documento");
      }

      toast({
        title: "Documento actualizado con éxito",
        description: result.document.title,
        variant: "default",
        duration: 5000,
      });
    } else {
      if (!data.file || !(data.file instanceof File)) {
        throw new Error("Por favor, selecciona un archivo válido");
      }

      formData.append("file", data.file);

      const result = await createDocumentWithAssignments(formData, companyId);

      if (!result?.success) {
        throw new Error("No se pudo crear el documento");
      }

      const assignmentMessage =
        selectedPositions.length > 0
          ? `Documento asignado a cargos: ${selectedPositions
              .map((id) => positions.find((p) => p.value === id)?.label)
              .filter(Boolean)
              .join(", ")}`
          : "Documento asignado a todos los empleados activos";

      toast({
        title: "Documento subido con éxito",
        description: `${result.document.title} - ${assignmentMessage}`,
        variant: "default",
        duration: 5000,
      });
    }

    onOpenChange?.(false);
    form.reset();
    setFileName?.("");
    router.refresh?.();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Hubo un problema al guardar el documento";

    toast({
      title: message.includes("ya existe")
        ? "El documento ya existe"
        : "Error al guardar el documento",
      description: message,
      variant: "destructive",
      duration: 5000,
    });
  }
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    {/* Botón de "Nuevo Documento" solo en modo creación */}
    {(!open && (!mode || mode === "create")) && (
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Documento
        </Button>
      </DialogTrigger>
    )}
    
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {mode === "edit" ? "Editar Documento" : "Subir Nuevo Documento"}
        </DialogTitle>
        <DialogDescription>
          {mode === "edit" 
            ? "Modifica los datos del documento" 
            : "Agrega un nuevo documento al sistema"}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Campos del formulario */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input placeholder="Título del documento" {...field} />
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
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="typeOfEmployee"
              render={({ field }) => {
                // Convertir los IDs seleccionados a objetos {label, value} para el MultiSelect
                // Obtener los valores seleccionados actuales
                const selectedValues = Array.isArray(field.value) ? field.value : [];
                console.log('selectedValues:', selectedValues);
                console.log('positions:', positions);
                
                // Obtener los labels de las opciones seleccionadas
                const getSelectedLabels = () => {
                  return selectedValues
                    .map(value => {
                      const option = positions.find(pos => pos.value === value);
                      return option?.label;
                    })
                    .filter(Boolean);
                };
                
                // Texto a mostrar en el botón del selector
                const getButtonText = () => {
                  const labels = getSelectedLabels();
                  if (labels.length === 0) return "Seleccionar cargos (vacío = todos)";
                  if (labels.length <= 2) return labels.join(', ');
                  return `${labels[0]}, ${labels[1]} +${labels.length - 2} más`;
                };
                
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Destinatarios</FormLabel>
                    <FormControl>
                      <div>
                        <MultiSelectCombobox
                          key="positions-selector"
                          options={positions}
                          selectedValues={selectedValues}
                          placeholder="Seleccionar cargos (vacío = todos)"
                          emptyMessage="No se encontraron cargos"
                          onChange={(values) => {
                            console.log('onChange values:', values);
                            const newValues = Array.isArray(values) ? values : [];
                            console.log('Setting field value to:', newValues);
                            field.onChange(newValues);
                          }}
                          showSelectAll
                        />
                        {/* {selectedValues.length > 0 && (
                          <div className="mt-1">
                            <span className="text-xs text-muted-foreground">
                              {selectedValues.length} {selectedValues.length === 1 ? 'cargo seleccionado' : 'cargos seleccionados'}
                            </span>
                          </div>
                        )} */}
                      </div>
                    </FormControl>
                    {selectedValues.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Si no seleccionas ningún cargo, el documento se asignará a todos los empleados activos
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange } }) => (
                <FormItem>
                  <FormLabel>Archivo</FormLabel>
                  {mode === "edit" && form.getValues("file_path") && (
                    <div className="mb-2 p-2 bg-gray-50 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Archivo actual: <span className="font-medium">{form.getValues("file_name")}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tamaño: {form.getValues("file_size") ? `${Math.round(Number(form.getValues("file_size")) / 1024)} KB` : 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Si subes un nuevo archivo, reemplazará al actual.
                      </p>
                    </div>
                  )}
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        ref={(e) => {
                          fileRef.ref(e);
                          if (e) {
                            (fileInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                          }
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFileName(file.name);
                            onChange(file);
                            // Actualizamos los datos del archivo en el formulario
                            form.setValue("file_name", file.name);
                            form.setValue("file_type", file.type);
                            form.setValue("file_size", file.size);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full justify-between"
                      >
                        <span>{fileName || (mode === "edit" ? "Cambiar archivo" : "Seleccionar archivo")}</span>
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
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full"
              >
                {form.formState.isSubmitting ? "Subiendo..." : mode === "edit" ? "Guardar Cambios" : "Subir Documento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}


// import React, { useRef, useState } from "react";
// import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { toast } from "sonner";
// import { supabaseBrowser } from "@/lib/supabase/browser";

// interface DocumentFormValues {
//   title: string;
//   version: string;
//   expiry_date?: string;
//   description?: string;
//   typeOfEmployee?: string[];
//   file?: File;
// }

// interface DocumentUploadDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onSubmit: (data: DocumentFormValues) => Promise<void>;
//   initialData?: Partial<DocumentFormValues>;
//   positions: { value: string; label: string }[];
//   companyId: string;
// }

// const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
//   open,
//   onOpenChange,
//   onSubmit,
//   initialData = {},
//   positions,
//   companyId,
// }) => {
//   const [form, setForm] = useState<DocumentFormValues>({
//     title: initialData.title || "",
//     version: initialData.version || "",
//     expiry_date: initialData.expiry_date || "",
//     description: initialData.description || "",
//     typeOfEmployee: initialData.typeOfEmployee || [],
//     file: undefined,
//   });
//   const [loading, setLoading] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       setForm((prev) => ({ ...prev, file: e.target.files![0] }));
//     }
//   };

//   const handlePositionsChange = (selected: string[]) => {
//     setForm((prev) => ({ ...prev, typeOfEmployee: selected }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const formData = new FormData();
//       formData.append("title", form.title);
//       formData.append("version", form.version);
//       formData.append("expiry_date", form.expiry_date || "");
//       if (form.description) formData.append("description", form.description);

//       // Si no hay cargos seleccionados, usamos todos los cargos disponibles
//       const selectedPositions =
//         form.typeOfEmployee && form.typeOfEmployee.length > 0
//           ? form.typeOfEmployee
//           : positions.map((p) => p.value);
//       formData.append("typeOfEmployee", JSON.stringify(selectedPositions));

//       // Archivo
//       if (fileInputRef.current?.files?.[0]) {
//         formData.append("file", fileInputRef.current.files[0]);
//       } else if (form.file) {
//         formData.append("file", form.file);
//       }

//       // CAMBIO CLAVE: status "borrador"
//       formData.append("status", "borrador");
//       formData.append("company_id", companyId);

//       // Aquí puedes llamar a tu API o función de subida
//       await onSubmit(form);

//       toast.success("Documento guardado como borrador");
//       onOpenChange(false);
//     } catch (err) {
//       toast.error("Error al guardar el documento");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent>
//         <DialogTitle>{initialData.title ? "Editar Documento" : "Nuevo Documento"}</DialogTitle>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <Input
//             name="title"
//             placeholder="Título"
//             value={form.title}
//             onChange={handleChange}
//             required
//           />
//           <Input
//             name="version"
//             placeholder="Versión"
//             value={form.version}
//             onChange={handleChange}
//             required
//           />
//           <Input
//             name="expiry_date"
//             type="date"
//             placeholder="Fecha de vencimiento"
//             value={form.expiry_date}
//             onChange={handleChange}
//           />
//           <Textarea
//             name="description"
//             placeholder="Descripción"
//             value={form.description}
//             onChange={handleChange}
//           />
//           {/* Selector de cargos */}
//           <div>
//             <label className="block text-sm font-medium mb-1">Cargos</label>
//             <select
//               multiple
//               value={form.typeOfEmployee}
//               onChange={(e) =>
//                 handlePositionsChange(Array.from(e.target.selectedOptions, (opt) => opt.value))
//               }
//               className="w-full border rounded p-2"
//             >
//               {positions.map((p) => (
//                 <option key={p.value} value={p.value}>
//                   {p.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//           {/* Archivo */}
//           <Input
//             type="file"
//             ref={fileInputRef}
//             onChange={handleFileChange}
//             accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
//             required={!initialData.title}
//           />
//           <DialogFooter>
//             <Button type="submit" disabled={loading}>
//               {initialData.title ? "Guardar Cambios" : "Crear Borrador"}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default DocumentUploadDialog;