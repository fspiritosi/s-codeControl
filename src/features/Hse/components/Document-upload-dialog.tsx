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
import { createDocumentWithAssignments, getAllHierarchicalPositions } from "@/features/Hse/actions/documents"
import { Plus, Upload } from "lucide-react"
import Cookies from "js-cookie"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox"

// Esquema de validación
export const documentFormSchema = z.object({
  title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
  version: z.string().min(1, "La versión es requerida"),
  expiry_date: z.string().optional(),
  description: z.string().optional(),
  typeOfEmployee: z.array(z.string()).optional(), // Actualizar definición del esquema
  file: z
    .any()
    .refine((file) => file instanceof File, { message: "Por favor, sube un archivo" })
    .refine((file) => file.size <= 10 * 1024 * 1024, { message: "El archivo no puede pesar más de 10MB" })
    .refine((file) => [".pdf", ".doc", ".docx"].some((ext) => file.name.toLowerCase().endsWith(ext)), {
      message: "Solo se permiten archivos PDF, DOC o DOCX",
    }),
})

type DocumentFormValues = z.infer<typeof documentFormSchema>

export function DocumentUploadDialog() {
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: "",
      version: "",
      expiry_date: "",
      description: "",
      typeOfEmployee: [],
    },
  })
  const cookies = Cookies.get()

  const router = useRouter()
  const fileRef = form.register("file")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string>("")
  const [selectAll, setSelectAll] = useState(false)
  const [positions, setPositions] = useState<any[]>([])
  useEffect(() => {
    const fetchPositions = async () => {
      const { data } = await getAllHierarchicalPositions()
     
      const formattedPositions = (data || []).map((position: any) => ({
        label: position.name,
        value: position.id
      }))
      setPositions(formattedPositions)
    }
    fetchPositions()
  }, [])
  
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

  const onSubmit = async (data: DocumentFormValues) => {
    if (!companyId) {
      console.error("No se pudo obtener el ID de la compañía")
      return
    }

    try {
      const formData = new FormData()
      formData.append("title", data.title)
      formData.append("version", data.version)
      formData.append("expiry_date", data.expiry_date || "")
      if (data.description) {
        formData.append("description", data.description)
      }
      // Si no hay cargos seleccionados, usamos todos los cargos disponibles
const selectedPositions = data.typeOfEmployee && data.typeOfEmployee.length > 0
? data.typeOfEmployee
: positions.map((p) => p.value)

      // ✅ CAMBIO PRINCIPAL: Agregar typeOfEmployee al FormData
      formData.append("typeOfEmployee", JSON.stringify(selectedPositions))

      // Ensure we're getting the file from the file input
      const fileInput = fileInputRef.current
      if (fileInput?.files?.[0]) {
        formData.append("file", fileInput.files[0])
      } else if (data.file) {
        formData.append("file", data.file)
      } else {
        throw new Error("No se ha seleccionado ningún archivo")
      }

      const result = await createDocumentWithAssignments(formData, companyId)

      if (!result?.success) {
        throw new Error("No se pudo crear el documento")
      }

      // Cerrar el diálogo y limpiar el formulario
      document.getElementById("close-dialog")?.click()
      form.reset()
      setFileName("") // ✅ Limpiar nombre del archivo

      // ✅ MEJORA: Mensaje más informativo sobre las asignaciones
      const assignmentMessage =
        data.typeOfEmployee && data.typeOfEmployee.length > 0
          ? `Documento asignado a empleados con cargos: ${data.typeOfEmployee.map((id) => positions.find((p) => p.value === id)?.label).join(", ")}`
          : "Documento asignado a todos los empleados activos"

      toast({
        title: "Documento subido con éxito",
        description: `${result.document.title} - ${assignmentMessage}`,
        variant: "default",
        duration: 5000, // ✅ Más tiempo para leer el mensaje
      })

      router.refresh()
    } catch (error) {
      if (error instanceof Error && error.message === "El documento ya existe") {
        toast({
          title: "El documento ya existe",
          description: "Por favor, ve al detalle del documento para agregar una nueva versión.",
          variant: "destructive",
          duration: 5000,
        })
      } else {
        toast({
          title: "Error al subir el documento",
          description: error instanceof Error ? error.message : "Hubo un problema al subir el documento",
          variant: "destructive",
          duration: 5000,
        })
        console.error("Error al crear el documento:", error)
      }
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
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
                    <Input placeholder="Ej: Manual de Seguridad Vial" {...field} />
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
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Destinatarios</FormLabel>
                  <FormControl>
                    <MultiSelectCombobox
                      options={positions}
                      placeholder="Seleccionar cargos (vacío = todos)"
                      emptyMessage="No se encontraron cargos"
                      selectedValues={field.value || []}
                      onChange={field.onChange}
                      showSelectAll
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Si no seleccionas ningún cargo, el documento se asignará a todos los empleados activos
                  </p>
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
                          fileRef.ref(e)
                          if (e) {
                            ;(fileInputRef as any).current = e
                          }
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setFileName(file.name)
                            onChange(file)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full justify-between"
                      >
                        <span>{fileName || "Seleccionar archivo"}</span>
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
                {form.formState.isSubmitting ? "Subiendo..." : "Subir Documento"}
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
//             <Button type="submit" loading={loading}>
//               {initialData.title ? "Guardar Cambios" : "Crear Borrador"}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default DocumentUploadDialog;