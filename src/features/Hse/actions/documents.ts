'use server'

import { supabaseServer } from '@/lib/supabase/server'

// Tipos
export type DocumentInput = {
  title: string
  description: string | null
  version: string
  file: File
  expiry_date: string
}

//infer<typeof documentSchema>
export interface DocumentVersion {
  id: string
  version: string
  file_path: string
  file_name: string
  file_size: number
  file_type: string
  upload_date: string
  created_by: string
  created_at: string
  change_log?: string
  expiry_date: string | null
  description: string | null
  title: string
  status: 'active' | 'expired' | 'pending' | 'inactive' | 'borrador'
  isCurrent: boolean
  acceptedCount?: number | null
  rejectedCount?: number | null
  totalEmployees?: number | null
  pendingCount?: number | null
}

export interface Document {
  id: string
  title: string
  description: string | null
  version: string
  file_path: string
  file_name: string
  file_size: number
  file_type: string
  upload_date: string
  expiry_date: string | null
  status: 'active' | 'expired' | 'pending' | 'inactive' | 'borrador'
  created_by: string
  created_at: string
  updated_at: string
  company_id: string
  versions?: DocumentVersion[]
  tags?: string[]
}

interface DocumentAssignment {
  id: string;
  status: string;
  assigned_at: string;
  accepted_at: string | null;
  document: {
    id: string;
    title: string;
    version: string;
    expiry_date: string | null;
  };
  employee: {
    id: string;
    firstname: string;
    lastname: string;
    cuil: string;
    email: string | null;
    hierarchical_position: {
      id: string;
      name: string;
    } | null;
    company_position: string | null;
  } | null;
}

// Interface para los documentos procesados
interface ProcessedDocument {
  assignmentId: string;
  status: string;
  assignedAt: string;
  acceptedAt: string | null;
  document: {
    id: string;
    title: string;
    version: string;
    expiryDate: string | null;
  };
}

// Interface para los empleados procesados
export interface ProcessedEmployee {
  id: string
  name: string
  cuil: string
  email: string | null
  position: string | null
  company_position: string | null
  documents: ProcessedDocument[]
}

// Obtener todos los documentos con sus etiquetas
export async function getDocuments(company_id: string, filters?: {
  status?: 'active' | 'expired' | 'pending'
  search?: string
}) {
  const supabase = supabaseServer()
  
  // Primero obtenemos los documentos básicos
  let query = supabase
    .from('hse_documents' as any)
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }

  const { data: documents, error } = await query

  if (error) {
    console.error('Error al obtener documentos:', error)
    throw new Error('No se pudieron obtener los documentos')
  }

  if (!documents || documents.length === 0) {
    return [];
  }

  // Obtenemos los IDs de los documentos para buscar sus etiquetas
  const documentIds = documents.map(doc => doc.id);

  // Obtenemos las asignaciones de etiquetas para estos documentos
  const tagQuery = supabase
    .from('hse_document_tag_assignments' as any)
    .select(`
      document_id,
      training_tags (
        id,
        name
      )
    `)
    .in('document_id', documentIds);

  const { data: tagAssignments, error: tagError } = await tagQuery as unknown as {
    data: Array<{
      document_id: string;
      training_tags: { id: string; name: string } | { id: string; name: string }[] | null;
    }> | null;
    error: any;
  };

  if (tagError) {
    console.error('Error al obtener asignaciones de etiquetas:', tagError);
    // Si hay error, devolvemos los documentos sin etiquetas
    return documents.map(doc => ({
      ...doc,
      tags: []
    }));
  }

  // Creamos un mapa de document_id a array de nombres de etiquetas
  const tagsByDocument = new Map<string, string[]>();
  
  if (tagAssignments) {
    // Procesamos las asignaciones de etiquetas
    tagAssignments.forEach(assignment => {
      if (!assignment) return;
      
      const documentId = assignment.document_id;
      const trainingTags = assignment.training_tags;
      
      // Aseguramos que training_tags sea un array
      const tags = Array.isArray(trainingTags) 
        ? trainingTags 
        : trainingTags ? [trainingTags] : [];
      
      // Filtramos solo las etiquetas válidas
      const validTags = tags.filter(tag => 
        tag && typeof tag === 'object' && 'id' in tag && 'name' in tag
      ) as { id: string; name: string }[];

      if (validTags.length > 0) {
        const tagNames = validTags.map(tag => tag.name);
        
        // Si ya existe el documento en el mapa, añadimos las etiquetas
        if (tagsByDocument.has(documentId)) {
          const existingTags = tagsByDocument.get(documentId) || [];
          tagsByDocument.set(documentId, [...existingTags, ...tagNames]);
        } else {
          tagsByDocument.set(documentId, tagNames);
        }
      }
    });
  }

  // Combinamos los documentos con sus etiquetas
  return documents.map(doc => ({
    ...doc,
    tags: tagsByDocument.get(doc.id) || []
  })) as Document[];
}

// Obtener un documento por ID con sus versiones anteriores
export async function getDocumentById(id: string): Promise<(Document & { versions: DocumentVersion[] }) | null> {
  const supabase = supabaseServer()
  
  // Obtener el documento principal
  const { data: document, error: docError } = await supabase
    .from('hse_documents' as any)
    .select('*')
    .eq('id', id)
    .single()

  if (docError) {
    console.error('Error al obtener documento:', docError)
    return null
  }

  // Obtener las versiones anteriores del documento
  const { data: versions, error: versionsError } = await supabase
    .from('hse_document_versions' as any)
    .select('*')
    .eq('document_id', id)
    .order('created_at', { ascending: false })

  if (versionsError) {
    console.error('Error al obtener versiones del documento:', versionsError)
    // Si hay error, devolvemos el documento sin versiones
    return { ...document, versions: [] }
  }

  return { ...document, versions: versions || [] }
}

// export async function createDocument(formData: FormData, company_id: string) {
//   console.log('Iniciando creación de documento...');
//   const supabase = supabaseServer()
//   let filePath: string | null = null;

//   try {
//     // 1. Validar company_id
//     if (!company_id) {
//       throw new Error('Se requiere el ID de la compañía');
//     }

//     // 2. Validar que el usuario esté autenticado
//     const { data: { user }, error: userError } = await supabase.auth.getUser();
//     if (userError || !user) {
//       throw new Error('No se pudo autenticar al usuario');
//     }

//     // 3. Validar campos obligatorios
//     const title = formData.get('title') as string;
//     const version = formData.get('version') as string;
//     const file = formData.get('file') as File;

//     if (!title || !file) {
//       throw new Error('El título y el archivo son obligatorios');
//     }

//     // 4. Verificar si ya existe un documento con el mismo título
//     const { data: existingDoc, error: fetchError } = await supabase
//       .from('hse_documents' as any)
//       .select('*')
//       .eq('title', title)
//       .eq('company_id', company_id)
//       .maybeSingle();

//     if (existingDoc) {
//       throw new Error('El documento ya existe');
//     }

//     // 5. Subir el archivo a Supabase Storage
//     const fileExt = file.name.split('.').pop();
//     const fileName = `${Date.now()}.${fileExt}`;
//     filePath = `${company_id}/${fileName}`;

//     console.log('Subiendo archivo a storage:', { filePath, size: file.size, type: file.type });
    
//     const { error: uploadError } = await supabase.storage
//       .from('documents-hse')
//       .upload(filePath, file);

//     if (uploadError) {
//       console.error('Error al subir el archivo:', uploadError);
//       throw new Error('No se pudo subir el archivo');
//     }
  
//     // 6. Obtener URL pública del archivo
//     const { data: { publicUrl } } = supabase.storage
//       .from('documents-hse')
//       .getPublicUrl(filePath);

//     let documentId: string;

//     if (existingDoc && !fetchError) {
//       // Si existe un documento con el mismo título, guardamos la versión actual
//       documentId = existingDoc.id;
      
//       try {
//         // Guardar la versión actual en hse_document_versions
//         // Obtener la URL pública del archivo existente
//         const { data: { publicUrl } } = supabase.storage
//           .from('documents-hse')
//           .getPublicUrl(existingDoc.file_path);

//         const versionData = {
//           document_id: documentId,
//           version: existingDoc.version,
//           file_path: filePath, // Usar la URL pública en lugar de la ruta del archivo
//           file_name: existingDoc.file_name,
//           file_size: existingDoc.file_size,
//           file_type: existingDoc.file_type,
//           created_by: existingDoc.created_by,
//           change_log: `Versión ${existingDoc.version} - Reemplazada por nueva versión`,
//           created_at: new Date().toISOString(),
//           expiry_date: existingDoc.expiry_date,
          
//         };
//         console.log(versionData)
//         console.log('Guardando versión anterior en hse_document_versions:', versionData);
        
//         // Insertar la versión anterior
//         const { error: versionError } = await supabase
//           .from('hse_document_versions' as any)
//           .insert(versionData);

//         if (versionError) {
//           console.error('Error al guardar la versión anterior:', versionError);
//           // No detenemos el flujo si falla el guardado de la versión anterior
//           console.log('Continuando con la actualización del documento principal...');
//         } else {
//           console.log('Versión anterior guardada correctamente');
//         }
        
//         // 2. Ahora actualizamos el documento principal con la nueva versión
//         const updateData = {
//           version: String(version || '1.0'),
//           file_path: filePath,
//           file_name: file.name,
//           file_size: file.size,
//           file_type: file.type,
//           updated_at: new Date().toISOString(),
//           expiry_date: formData.get('expiry_date') as string || "sin vencimiento",
//           description: formData.get('description') as string || null
//         };

//         console.log('Actualizando documento principal con:', updateData);
        
//         const { error: updateError } = await supabase
//           .from('hse_documents' as any)
//           .update(updateData)
//           .eq('id', documentId);

//         if (updateError) throw updateError;
        
//         console.log('Documento actualizado correctamente');
//         documentId = existingDoc.id;
        
//       } catch (error) {
//         console.error('Error durante la actualización del documento:', error);
//         // Intentar limpiar el archivo subido si algo falló
//         if (filePath) {
//           try {
//             await supabase.storage.from('documents-hse').remove([filePath]);
//             console.log('Archivo temporal eliminado');
//           } catch (cleanupError) {
//             console.error('Error al limpiar archivo temporal:', cleanupError);
//           }
//         }
//         throw error;
//       }
//     } else {
//       // Crear un nuevo documento
//       console.log('Creando nuevo documento...');
//       const newDoc = {
//         title,
//         description: formData.get('description') as string || null,
//         version: String(version || '1.0'),
//         file_path: filePath,
//         file_name: file.name,
//         file_size: file.size,
//         file_type: file.type,
//         upload_date: new Date().toISOString(),
//         expiry_date: formData.get('expiry_date') as string || null,
//         status: 'active',
//         created_by: user.id,
//         company_id
//       };

//       console.log('Insertando nuevo documento:', newDoc);
      
//       const { data: documentData, error: insertError } = await supabase
//         .from('hse_documents' as any)
//         .insert([newDoc])
//         .select()
//         .single();

//       if (insertError) {
//         console.error('Error al crear el documento:', insertError);
//         // Limpiar el archivo subido si falla la creación
//         if (filePath) {
//           try {
//             await supabase.storage.from('documents-hse').remove([filePath]);
//             console.log('Archivo temporal eliminado');
//           } catch (cleanupError) {
//             console.error('Error al limpiar archivo temporal:', cleanupError);
//           }
//         }
//         throw insertError;
//       }

//       console.log('Documento creado correctamente:', documentData);
//       documentId = documentData.id;
//     }

//     // Obtener el documento actualizado/creado
//     const { data: document, error: fetchDocError } = await supabase
//       .from('hse_documents' as any)
//       .select('*')
//       .eq('id', documentId)
//       .single();

//     if (fetchDocError) {
//       console.error('Error al obtener el documento actualizado:', fetchDocError);
//       throw new Error('Documento procesado pero no se pudo recuperar la información actualizada');
//     }

//     return { 
//       success: true, 
//       document: document as Document,
//       publicUrl 
//     };

//   } catch (error) {
//     console.error('=== Error en la transacción ===');
//     console.error('Tipo de error:', typeof error);
    
//     // Log detailed error information
//     if (error instanceof Error) {
//       console.error('Mensaje de error:', error.message);
//       console.error('Stack trace:', error.stack);
      
//       // Log Supabase error details if available
//       if ('code' in error) {
//         console.error('Código de error:', (error as any).code);
//       }
//       if ('details' in error) {
//         console.error('Detalles:', (error as any).details);
//       }
//       if ('hint' in error) {
//         console.error('Sugerencia:', (error as any).hint);
//       }
//     } else {
//       console.error('Error desconocido:', error);
//     }
    
//     // Intentar limpiar el archivo si existe
//     if (filePath) {
//       try {
//         console.log('Intentando limpiar archivo temporal...');
//         const { error: cleanupError } = await supabase.storage
//           .from('documents-hse')
//           .remove([filePath]);
          
//         if (cleanupError) {
//           console.error('Error al limpiar archivo temporal:', cleanupError);
//         } else {
//           console.log('Archivo temporal eliminado');
//         }
//       } catch (cleanupError) {
//         console.error('Excepción al limpiar archivo temporal:', cleanupError);
//       }
//     }
    
//     throw new Error(error instanceof Error ? error.message : 'Error desconocido al procesar el documento');
//   }
// }



export async function createDocumentWithAssignments(formData: FormData, company_id: string) {
  
  const supabase = supabaseServer()
  let filePath: string | null = null

  try {
    // 1. Validar company_id
    if (!company_id) {
      throw new Error("Se requiere el ID de la compañía")
    }

    // 2. Validar que el usuario esté autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error("No se pudo autenticar al usuario")
    }

    // 3. Validar campos obligatorios
    const title = formData.get("title") as string
    const version = formData.get("version") as string
    const file = formData.get("file") as File
    const typeOfEmployee = formData.get("typeOfEmployee") as string // JSON string de array
    const tagsJson = formData.get("tags") as string // JSON string de array de IDs de etiquetas

    if (!title || !file) {
      throw new Error("El título y el archivo son obligatorios")
    }

    // Parse typeOfEmployee si existe
    let selectedPositions: string[] = []
    let assignToAll = false

    if (typeOfEmployee) {
      try {
        const parsed = JSON.parse(typeOfEmployee)
        if (Array.isArray(parsed)) {
          selectedPositions = parsed
          assignToAll = parsed.length === 0 // Si array vacío, asignar a todos
        }
      } catch (e) {
        console.warn("Error parsing typeOfEmployee:", e)
      }
    }

    // 4. Verificar si ya existe un documento con el mismo título
    const { data: existingDoc, error: fetchError } = await supabase
      .from("hse_documents" as any)
      .select("*")
      .eq("title", title)
      .eq("company_id", company_id)
      .maybeSingle()

    if (existingDoc) {
      throw new Error("El documento ya existe")
    }

    // 5. Subir el archivo a Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}.${fileExt}`
    filePath = `${company_id}/${fileName}`

    

    const { error: uploadError } = await supabase.storage.from("documents-hse").upload(filePath, file)

    if (uploadError) {
      console.error("Error al subir el archivo:", uploadError)
      throw new Error("No se pudo subir el archivo")
    }

    // 6. Obtener URL pública del archivo
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents-hse").getPublicUrl(filePath)

    let documentId: string

    // 7. Parsear tags si existen
    let tagIds: string[] = [];
    if (tagsJson) {
      try {
        tagIds = JSON.parse(tagsJson) as string[];
        if (!Array.isArray(tagIds)) {
          tagIds = [];
        }
      } catch (e) {
        console.warn("Error parsing tags:", e);
      }
    }

    // 8. Crear el documento
    const newDoc = {
      title,
      description: (formData.get("description") as string) || null,
      version: String(version || "1.0"),
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      upload_date: new Date().toISOString(),
      expiry_date: (formData.get("expiry_date") as string) || null,
      status: "active",
      created_by: user.id,
      company_id,
    }

    

    const { data: documentData, error: insertError } = await supabase
      .from("hse_documents" as any)
      .insert([newDoc])
      .select()
      .single()

    if (insertError) {
      console.error("Error al crear el documento:", insertError)
      // Limpiar el archivo subido si falla la creación
      if (filePath) {
        try {
          await supabase.storage.from("documents-hse").remove([filePath])
          
        } catch (cleanupError) {
          console.error("Error al limpiar archivo temporal:", cleanupError)
        }
      }
      throw insertError
    }

    
    documentId = documentData.id

    // 9. CREAR ASIGNACIONES AUTOMÁTICAS
    await createDocumentAssignments(supabase, documentId, company_id, user.id, assignToAll, selectedPositions)

    // 10. CREAR ASIGNACIONES DE ETIQUETAS
    if (tagIds.length > 0) {
      // Verificar qué etiquetas existen
      const { data: existingTags, error: tagsError } = await supabase
        .from('hse_document_tags' as any)
        .select('id')
        .in('id', tagIds);

      if (tagsError) {
        console.error('Error al verificar etiquetas existentes:', tagsError);
        // Continuamos sin asignar etiquetas
      } else {
        const existingTagIds = new Set(existingTags?.map(tag => tag.id) || []);
        const validTagIds = tagIds.filter(id => existingTagIds.has(id));

        // Registrar advertencia si hay etiquetas no encontradas
        if (validTagIds.length !== tagIds.length) {
          const missingTags = tagIds.filter(id => !existingTagIds.has(id));
          console.warn(`Las siguientes etiquetas no existen y no se asignarán: ${missingTags.join(', ')}`);
        }

        // Solo crear asignaciones para etiquetas que existen
        if (validTagIds.length > 0) {
          const tagAssignments = validTagIds.map(tagId => ({
            document_id: documentId,
            tag_id: tagId,
            assigned_by: user.id,
            assigned_at: new Date().toISOString()
          }));

          const { error: tagAssignError } = await supabase
            .from('hse_document_tag_assignments' as any)
            .insert(tagAssignments);

          if (tagAssignError) {
            console.error('Error al asignar etiquetas al documento:', tagAssignError);
            // No lanzamos error para no fallar la creación del documento
          }
        }
      }
    }

    // 9. Obtener el documento actualizado/creado
    const { data: document, error: fetchDocError } = await supabase
      .from("hse_documents" as any)
      .select("*")
      .eq("id", documentId)
      .single()

    if (fetchDocError) {
      console.error("Error al obtener el documento actualizado:", fetchDocError)
      throw new Error("Documento procesado pero no se pudo recuperar la información actualizada")
    }

    return {
      success: true,
      document: document,
      publicUrl,
      assignmentsCreated: true,
    }
  } catch (error) {
    console.error("=== Error en la transacción ===")
    console.error("Tipo de error:", typeof error)

    // Log detailed error information
    if (error instanceof Error) {
      console.error("Mensaje de error:", error.message)
      console.error("Stack trace:", error.stack)
    } else {
      console.error("Error desconocido:", error)
    }

    // Intentar limpiar el archivo si existe
    if (filePath) {
      try {
       
        const { error: cleanupError } = await supabase.storage.from("documents-hse").remove([filePath])

        if (cleanupError) {
          console.error("Error al limpiar archivo temporal:", cleanupError)
        } else {
          console.log("Archivo temporal eliminado")
        }
      } catch (cleanupError) {
        console.error("Excepción al limpiar archivo temporal:", cleanupError)
      }
    }

    throw new Error(error instanceof Error ? error.message : "Error desconocido al procesar el documento")
  }
}

// Función auxiliar para crear asignaciones
async function createDocumentAssignments(
  supabase: any,
  documentId: string,
  companyId: string,
  assignedBy: string,
  assignToAll: boolean,
  selectedPositions: string[],
) {
 

  try {
    if (assignToAll) {
      // OPCIÓN 1: Asignar a todos los empleados activos de la empresa

      // Obtener todos los empleados activos de la empresa
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_active", true)

      if (employeesError) {
        console.error("Error al obtener empleados:", employeesError)
        throw new Error("No se pudieron obtener los empleados para asignar")
      }

      if (employees && employees.length > 0) {
        // Crear asignaciones individuales para cada empleado
        const assignments = employees.map((employee: any) => ({
          document_id: documentId,
          assignee_type: employee.hierarchical_position,
          assignee_id: employee.id,
          assigned_by: assignedBy,
          status: "pending",
        }))

        // Insertar en lotes para mejor rendimiento
        const { error: assignmentError } = await supabase.from("hse_document_assignments").insert(assignments)

        if (assignmentError) {
          console.error("Error al crear asignaciones individuales:", assignmentError)
          throw new Error("No se pudieron crear las asignaciones individuales")
        }

       
      }
    } else if (selectedPositions.length > 0) {
      // OPCIÓN 2: Asignar por posiciones específicas
      

      // Obtener empleados que coincidan con las posiciones seleccionadas
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("id, hierarchical_position")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .in("hierarchical_position", selectedPositions)

      if (employeesError) {
        console.error("Error al obtener empleados por posición:", employeesError)
        throw new Error("No se pudieron obtener los empleados por posición")
      }

      if (employees && employees.length > 0) {
        // Crear asignaciones individuales
        const assignments = employees.map((employee: any) => ({
          document_id: documentId,
          assignee_type: employee.hierarchical_position,
          assignee_id: employee.id,
          assigned_by: assignedBy,
          status: "pending",
        }))

        const { error: assignmentError } = await supabase.from("hse_document_assignments").insert(assignments)

        if (assignmentError) {
          console.error("Error al crear asignaciones por posición:", assignmentError)
          throw new Error("No se pudieron crear las asignaciones por posición")
        }

        console.log(
          `Asignaciones creadas para ${employees.length} empleados en posiciones: ${selectedPositions.join(", ")}`,
        )
      }

      // ALTERNATIVA: También crear asignaciones por tipo de posición para futuros empleados
      const positionAssignments = selectedPositions.map((position) => ({
        document_id: documentId,
        assignee_type: position,
        assignee_id: null, // No hay ID específico para posiciones
        assigned_by: assignedBy,
        status: "active", // Estado diferente para asignaciones por tipo
        // Podrías agregar un campo adicional para almacenar la posición
        // O usar una tabla separada para este tipo de asignaciones
      }))

      // Nota: Esto requeriría modificar tu esquema para soportar asignaciones por tipo
      // Por ahora, solo creamos asignaciones individuales
    }

    console.log("Asignaciones de documento creadas exitosamente")
  } catch (error) {
    console.error("Error al crear asignaciones:", error)
    // No lanzamos el error para no fallar toda la creación del documento
    // Pero podrías decidir si esto debería ser crítico o no
    console.warn("Documento creado pero las asignaciones fallaron")
  }
}



// export async function createDocumentVersion(
//   documentId: string,
//   formData: FormData,
//   company_id: string,
// ) {
//   console.log('Iniciando creación de nueva versión de documento...');
//   const supabase = supabaseServer()
//   let filePath: string | null = null;

//   try {
//     // 1. Validar company_id
//     if (!company_id) {
//       throw new Error('Se requiere el ID de la compañía');
//     }

//     // 2. Validar que el usuario esté autenticado
//     const { data: { user }, error: userError } = await supabase.auth.getUser();
//     if (userError || !user) {
//       throw new Error('No se pudo autenticar al usuario');
//     }

//     // 3. Validar campos obligatorios
//     const version = formData.get('version') as string;
//     const file = formData.get('file') as File;
//     const expiryDate = formData.get('expiryDate') as string;
//     const description = formData.get('description') as string;

//     if (!file) {
//       throw new Error('El archivo es obligatorio');
//     }

//     // 4. Obtener documento existente
//     const { data: existingDoc, error: fetchError } = await supabase
//       .from('hse_documents' as any)
//       .select('*')
//       .eq('id', documentId)
//       .single();

//     if (fetchError || !existingDoc) {
//       throw new Error('Documento no encontrado');
//     }
//      // Validar que la versión no sea menor a la actual
//      const currentVersion = parseFloat(existingDoc.version);
//      const newVersion = version ? parseFloat(version) : currentVersion + 1;
     
//      if (newVersion <= currentVersion) {
//        throw new Error(`No se puede crear una versión (${newVersion}) menor o igual a la versión actual (${currentVersion})`);
//      }
//     // 5. Subir el archivo a Supabase Storage
//     const fileExt = file.name.split('.').pop();
//     const fileName = `${Date.now()}.${fileExt}`;
//     filePath = `${company_id}/${fileName}`;

//     console.log('Subiendo archivo a storage:', { filePath, size: file.size, type: file.type });
    
//     const { error: uploadError } = await supabase.storage
//       .from('documents-hse')
//       .upload(filePath, file);

//     if (uploadError) {
//       console.error('Error al subir el archivo:', uploadError);
//       throw new Error('No se pudo subir el archivo');
//     }
  
//     // 6. Obtener URL pública del archivo
//     const { data: { publicUrl } } = supabase.storage
//       .from('documents-hse')
//       .getPublicUrl(filePath);

//     try {
//       // 7. Guardar la versión actual en hse_document_versions
//       const versionData = {
//         document_id: documentId,
//         title: existingDoc.title,
//         status: "expired",
//         version: existingDoc.version,
//         file_path: existingDoc.file_path,
//         file_name: existingDoc.file_name,
//         file_size: existingDoc.file_size,
//         file_type: existingDoc.file_type,
//         created_by: existingDoc.created_by,
//         change_log: description || `Versión ${existingDoc.version} - Reemplazada por nueva versión`,
//         created_at: existingDoc.updated_at || existingDoc.created_at,
//         expiry_date: existingDoc.expiry_date,
//         description: existingDoc.description,
//       };

//       console.log('Guardando versión anterior en hse_document_versions:', versionData);
      
//       const { error: versionError } = await supabase
//         .from('hse_document_versions' as any)
//         .insert(versionData);

//       if (versionError) {
//         console.error('Error al guardar la versión anterior:', versionError);
//         // No detenemos el flujo si falla el guardado de la versión anterior
//         console.log('Continuando con la actualización del documento principal...');
//       } else {
//         console.log('Versión anterior guardada correctamente');
//       }
      
//       // 8. Actualizar el documento principal con la nueva versión
//       const updateData = {
//         version: version || String(Number(existingDoc.version) + 1),
//         file_path: filePath,
//         file_name: file.name,
//         file_size: file.size,
//         file_type: file.type,
//         updated_at: new Date().toISOString(),
//         expiry_date: expiryDate || null, // No heredar la fecha anterior
//         description: description || null,
//         status: 'active',
//       };

//       console.log('Actualizando documento principal con nueva versión:', updateData);
      
//       const { error: updateError } = await supabase
//         .from('hse_documents' as any)
//         .update(updateData)
//         .eq('id', documentId);

//       if (updateError) throw updateError;
      
//       console.log('Documento actualizado correctamente con la nueva versión');

//       // 9. Obtener el documento actualizado
//       const { data: document, error: fetchDocError } = await supabase
//         .from('hse_documents' as any)
//         .select('*')
//         .eq('id', documentId)
//         .single();

//       if (fetchDocError) {
//         console.error('Error al obtener el documento actualizado:', fetchDocError);
//         throw new Error('Documento actualizado pero no se pudo recuperar la información actualizada');
//       }

//       return { 
//         success: true, 
//         document: document as Document,
//         publicUrl 
//       };

//     } catch (error) {
//       console.error('Error durante la actualización del documento:', error);
//       // Intentar limpiar el archivo subido si algo falló
//       if (filePath) {
//         try {
//           await supabase.storage.from('documents-hse').remove([filePath]);
//           console.log('Archivo temporal eliminado');
//         } catch (cleanupError) {
//           console.error('Error al limpiar archivo temporal:', cleanupError);
//         }
//       }
//       throw error;
//     }

//   } catch (error) {
//     console.error('=== Error en la creación de versión ===');
//     console.error('Tipo de error:', typeof error);
    
//     // Log detailed error information
//     if (error instanceof Error) {
//       console.error('Mensaje de error:', error.message);
//       console.error('Stack trace:', error.stack);
      
//       // Log Supabase error details if available
//       if ('code' in error) {
//         console.error('Código de error:', (error as any).code);
//       }
//       if ('details' in error) {
//         console.error('Detalles:', (error as any).details);
//       }
//       if ('hint' in error) {
//         console.error('Sugerencia:', (error as any).hint);
//       }
//     } else {
//       console.error('Error desconocido:', error);
//     }
    
//     // Intentar limpiar el archivo si existe
//     if (filePath) {
//       try {
//         console.log('Intentando limpiar archivo temporal...');
//         const { error: cleanupError } = await supabase.storage
//           .from('documents-hse')
//           .remove([filePath]);
          
//         if (cleanupError) {
//           console.error('Error al limpiar archivo temporal:', cleanupError);
//         } else {
//           console.log('Archivo temporal eliminado');
//         }
//       } catch (cleanupError) {
//         console.error('Excepción al limpiar archivo temporal:', cleanupError);
//       }
//     }
    
//     throw new Error(error instanceof Error ? error.message : 'Error desconocido al crear la versión del documento');
//   }
// }

// Función para asignar documentos automáticamente a nuevos empleados

export async function createDocumentVersion(
  documentId: string,
  formData: FormData,
  company_id: string,
) {
 
  const supabase = supabaseServer();
  let filePath: string | null = null;

  try {
    if (!company_id) throw new Error('Se requiere el ID de la compañía');

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('No se pudo autenticar al usuario');

    const version = formData.get('version') as string;
    const file = formData.get('file') as File;
    const expiryDate = formData.get('expiryDate') as string;
    const description = formData.get('description') as string;

    if (!file) throw new Error('El archivo es obligatorio');

    const { data: existingDoc, error: fetchError } = await supabase
      .from('hse_documents' as any)
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !existingDoc) throw new Error('Documento no encontrado');

    const currentVersion = parseFloat(existingDoc.version);
    const newVersion = version ? parseFloat(version) : currentVersion + 1;

    if (newVersion <= currentVersion) {
      throw new Error(`No se puede crear una versión (${newVersion}) menor o igual a la versión actual (${currentVersion})`);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    filePath = `${company_id}/${fileName}`;

    console.log('Subiendo archivo a storage:', { filePath, size: file.size, type: file.type });

    const { error: uploadError } = await supabase.storage
      .from('documents-hse')
      .upload(filePath, file);

    if (uploadError) throw new Error('No se pudo subir el archivo');

    const { data: { publicUrl } } = supabase.storage
      .from('documents-hse')
      .getPublicUrl(filePath);

    // === Guardar la versión anterior en hse_document_versions ===
    const versionData = {
      document_id: documentId,
      title: existingDoc.title,
      status: "expired",
      version: existingDoc.version,
      file_path: existingDoc.file_path,
      file_name: existingDoc.file_name,
      file_size: existingDoc.file_size,
      file_type: existingDoc.file_type,
      created_by: existingDoc.created_by,
      change_log: description || `Versión ${existingDoc.version} - Reemplazada por nueva versión`,
      created_at: existingDoc.updated_at || existingDoc.created_at,
      expiry_date: existingDoc.expiry_date,
      description: existingDoc.description,
    };

   

    const { data: versionInsert, error: versionError } = await supabase
      .from('hse_document_versions' as any)
      .insert(versionData)
      .select('id')
      .single();

    if (versionError) console.error('Error al guardar la versión anterior:', versionError);

    const versionId = versionInsert?.id;

    // === Obtener y guardar asignaciones activas como historial ===
    const { data: currentAssignments, error: assignmentError } = await supabase
      .from('hse_document_assignments' as any)
      .select('*')
      .eq('document_id', documentId)
      // .eq('status', 'active');

    if (assignmentError) {
      console.error('Error al obtener asignaciones activas:', assignmentError);
      throw new Error('No se pudieron obtener las asignaciones del documento');
    }
    
    if (versionId && currentAssignments?.length > 0) {
      const versionAssignments = currentAssignments.map((a) => ({
        assignment_id: a.id,
        document_version_id: versionId,
        assignee_id: a.assignee_id,
        status: a.status,
        accepted_at: a.accepted_at,
        declined_at: a.declined_at,
        declined_reason: a.declined_reason,
      }));

      const { error: insertVersionError } = await supabase
        .from('hse_document_assignment_versions' as any)
        .insert(versionAssignments);

      if (insertVersionError) {
        console.error('Error al insertar historial de asignaciones:', insertVersionError);
      }
    }

    // === Resetear asignaciones activas a pendiente ===
    const { error: resetError } = await supabase
      .from('hse_document_assignments' as any)
      .update({
        status: 'pending',
        accepted_at: null,
        declined_at: null,
        declined_reason: null,
      })
      .eq('document_id', documentId);

    if (resetError) {
      console.error('Error al resetear asignaciones:', resetError);
      throw new Error('No se pudieron resetear las asignaciones');
    }

    // === Actualizar documento principal con nueva versión ===
    const updateData = {
      version: version || String(newVersion),
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      updated_at: new Date().toISOString(),
      expiry_date: expiryDate || null,
      description: description || null,
      status: 'active',
    };

    

    const { error: updateError } = await supabase
      .from('hse_documents' as any)
      .update(updateData)
      .eq('id', documentId);

    if (updateError) throw updateError;

    const { data: document, error: fetchDocError } = await supabase
      .from('hse_documents' as any)
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchDocError) throw new Error('Documento actualizado pero no se pudo recuperar la información actualizada');

    return {
      success: true,
      document,
      publicUrl,
    };

  } catch (error) {
    console.error('=== Error en la creación de versión ===');

    if (filePath) {
      try {
        await supabase.storage.from('documents-hse').remove([filePath]);
        
      } catch (cleanupError) {
        console.error('Error al limpiar archivo temporal:', cleanupError);
      }
    }

    throw new Error(error instanceof Error ? error.message : 'Error desconocido al crear la versión del documento');
  }
}

export async function assignDocumentsToNewEmployee(
  supabase: any,
  employeeId: string,
  companyId: string,
  employeePosition: string,
) {
 

  try {
    // 1. Buscar documentos activos que deberían asignarse a este empleado
    // Opción A: Documentos asignados a "todos" (esto requeriría un campo adicional)
    // Opción B: Documentos asignados a la posición específica del empleado

    // Por ahora, implementamos la lógica para asignar documentos activos
    // que no tengan asignación específica para este empleado

    const { data: activeDocuments, error: docsError } = await supabase
      .from("hse_documents")
      .select("id, title")
      .eq("company_id", companyId)
      .eq("status", "active")

    if (docsError) {
      console.error("Error al obtener documentos activos:", docsError)
      return
    }

    if (!activeDocuments || activeDocuments.length === 0) {
      
      return
    }

    // 2. Verificar qué documentos ya están asignados a este empleado
    const { data: existingAssignments, error: assignError } = await supabase
      .from("hse_document_assignments")
      .select("document_id")
      .eq("assignee_id", employeeId)
      .eq("assignee_type", "employee")

    if (assignError) {
      console.error("Error al verificar asignaciones existentes:", assignError)
      return
    }

    const assignedDocIds = existingAssignments?.map((a: any) => a.document_id) || []

    // 3. Filtrar documentos que no están asignados
    const documentsToAssign = activeDocuments.filter((doc: any) => !assignedDocIds.includes(doc.id))

    if (documentsToAssign.length === 0) {
      
      return
    }

    // 4. Crear asignaciones para documentos no asignados
    const newAssignments = documentsToAssign.map((doc: any) => ({
      document_id: doc.id,
      assignee_type: "employee",
      assignee_id: employeeId,
      assigned_by: null, // Sistema automático
      status: "pending",
    }))

    const { error: insertError } = await supabase.from("hse_document_assignments").insert(newAssignments)

    if (insertError) {
      console.error("Error al crear asignaciones automáticas:", insertError)
      return
    }

    
  } catch (error) {
    console.error("Error en asignación automática a nuevo empleado:", error)
  }
}

export async function getAllHierarchicalPositions() {
  const supabase = supabaseServer();
  
  try {
    const { data, error } = await supabase
      .from('hierarchy')
      .select('*')

    if (error) throw error;

    // Eliminar duplicados
    // const uniquePositions = [...new Set(data.map(item => item.name))];
    
    return { data: data, error: null };
  } catch (error) {
    console.error('Error al obtener posiciones jerárquicas:', error);
    return { data: null, error: 'Error al obtener las posiciones jerárquicas' };
  }
}

export async function getEmployeesWithAssignedDocuments(documentId?: string) {
  const supabase = supabaseServer();

  try {
    // Consulta para obtener empleados con sus documentos asignados
    let query = supabase
      .from('hse_document_assignments' as any)
      .select(`
        id,
        status,
        assigned_at,
        accepted_at,
        document:hse_documents!inner(
          id,
          title,
          version,
          expiry_date
        ),
        employee:employees!hse_document_assignments_assignee_id_fkey(
          id,
          firstname,
          lastname,
          cuil,
          email,
          hierarchical_position(id, name),
          company_position
        )
      `)
      // Filtrar solo asignaciones de empleados (no de otros tipos)
      // .eq('assignee_type', 'employee')
      // .eq('document_id', documentId || '');  
    // Si se proporciona un documentId, filtrar por ese documento
    if (documentId) {
      query = query.eq('document_id', documentId);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    // Si no hay asignaciones, devolver array vacío
    if (!data || data.length === 0) return { data: [], error: null };

    // Procesar los datos
    // Procesar los datos
const processedData: ProcessedEmployee[] = data.map((assignment: any) => {
  const employee = assignment.employee;
  
  return {
    id: employee.id,
    name: `${employee.firstname || ''} ${employee.lastname || ''}`.trim(),
    cuil: employee.cuil,
    email: employee.email,
    position: employee.hierarchical_position?.name || null,
    company_position: employee.company_position || null,
    documents: [{
      assignmentId: assignment.id,
      status: assignment.status,
      assignedAt: assignment.assigned_at,
      acceptedAt: assignment.accepted_at || null,
      document: {
        id: assignment.document.id,
        title: assignment.document.title,
        version: assignment.document.version,
        expiryDate: assignment.document.expiry_date
      }
    }]
  };
});

    return { data: processedData, error: null };
  } catch (error) {
    console.error('Error al obtener empleados con documentos asignados:', error);
    return { 
      data: null, 
      error: 'Error al obtener los empleados con sus documentos asignados' 
    };
  }
}

export async function updateDocumentExpiry(documentId: string, expiryDate: string) {
  const supabase = supabaseServer();
  
  const { data, error } = await supabase
    .from('hse_documents' as any)
    .update({ 
      expiry_date: expiryDate,
      updated_at: new Date().toISOString(), // Opcional: actualizar la fecha de modificación
      status: 'active',
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar la fecha de vencimiento:', error);
    throw new Error(error.message);
  }

  return data;
}

export interface DocumentVersionAssignment {
  id: string;
  assignment_id: string;
  document_version_id: string;
  assignee_id: string;
  status: string;
  accepted_at: string | null;
  declined_at: string | null;
  declined_reason: string | null;
  created_at: string;
  employee: {
    id: string;
    firstname: string;
    lastname: string;
    cuil: string;
    email: string | null;
    hierarchical_position: {
      id: string;
      name: string;
    };
    company_position: string | null;
  };
}

export async function getAssignedEmployeesByDocumentVersion(
  documentVersionId: string
): Promise<DocumentVersionAssignment[]> {
  const supabase = supabaseServer();
  
  const { data, error } = await supabase
    .from('hse_document_assignment_versions' as any)
    .select(`
      *,
      employee:assignee_id (
        id,
        firstname,
        lastname,
        cuil,
        email,
        hierarchical_position(id, name),
        company_position
      )
    `)
    .eq('document_version_id', documentVersionId);

  if (error) {
    console.error('Error fetching assigned employees:', error);
    throw new Error('Error al obtener los empleados asignados');
  }
 
  // Type assertion to ensure the data matches our interface
  return data as unknown as DocumentVersionAssignment[];
}

// "use server";

// import { createServerSupabaseClient } from "@/lib/supabase/server";
// import { cookies } from "next/headers";

// Crear documento (status: 'borrador')
export async function createDocument(data: any) {
  const supabase = supabaseServer();
  const { error, data: inserted } = await supabase
    .from("hse_documents")
    .insert([{ ...data, status: "borrador" }])
    .select();
  if (error) throw new Error(error.message);
  return inserted?.[0];
}

// Editar documento (solo si status === 'borrador')
export async function editDocument(id: string, data: any) {
  const supabase = supabaseServer();
  const { error, data: updated } = await supabase
    .from("hse_documents")
    .update(data)
    .eq("id", id)
    .eq("status", "borrador")
    .select();
  if (error) throw new Error(error.message);
  return updated?.[0];
}

// Publicar documento
export async function publishDocument(id: string) {
  const supabase = supabaseServer();
  const { error } = await supabase
    .from("hse_documents")
    .update({ status: "publicado" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

// En actions/documents.ts
// En actions/documents.ts
// En actions/documents.ts
// En actions/documents.ts
export async function updateDocument(formData: FormData, companyId: string) {
  const supabase = supabaseServer();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("No se pudo autenticar al usuario");
    }

    const documentId = formData.get("documentId") as string;
    const typeOfEmployee = JSON.parse(
      formData.get("typeOfEmployee") as string || "[]"
    ) as string[];
    const assignToAll = typeOfEmployee.length === 0;
    
    // Parse tag assignments
    const tagsJson = formData.get("tags") as string || "[]";
    let tagIds: string[] = [];
    try {
      const parsedTags = JSON.parse(tagsJson);
      tagIds = Array.isArray(parsedTags) ? parsedTags : [];
    } catch (e) {
      console.warn("Error parsing tags:", e);
    }

    if (!documentId) {
      throw new Error("ID de documento no proporcionado");
    }

    // 1. Actualizar archivo si hay uno nuevo
    const file = formData.get("file") as File | null;
    let filePath: string | undefined;

    if (file && file.size > 0) {
      const fileName = `documents/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents-hse")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        throw new Error("Error al subir el archivo: " + uploadError.message);
      }

      filePath = fileName;
    }

    // 2. Actualizar metadatos
    const updates = {
      title: formData.get("title") as string,
      version: formData.get("version") as string,
      description: (formData.get("description") as string) || null,
      expiry_date: (formData.get("expiry_date") as string) || null,
      updated_at: new Date().toISOString(),
      ...(filePath && { file_path: filePath }),
    };

    const { data: document, error: updateError } = await supabase
      .from("hse_documents")
      .update(updates)
      .eq("id", documentId)
      .select()
      .single();

    if (updateError) {
      throw new Error("Error al actualizar el documento: " + updateError.message);
    }

    // 3. Actualizar asignaciones de empleados
    const { error: deleteError } = await supabase
      .from("hse_document_assignments")
      .delete()
      .eq("document_id", documentId);

    if (deleteError) {
      console.error("Error al eliminar asignaciones anteriores:", deleteError);
      throw new Error("No se pudieron actualizar las asignaciones");
    }

    await createDocumentAssignments(
      supabase,
      documentId,
      companyId,
      user.id,
      assignToAll,
      typeOfEmployee
    );

    // 4. Actualizar asignaciones de etiquetas
    console.log('🔍 Iniciando actualización de etiquetas...');
    
    // Primero eliminamos todas las asignaciones existentes
    const { error: deleteTagsError } = await supabase
      .from('hse_document_tag_assignments' as any)
      .delete()
      .eq('document_id', documentId);

    if (deleteTagsError) {
      console.error('❌ Error al eliminar asignaciones de etiquetas anteriores:', deleteTagsError);
      // No lanzamos error para no fallar la actualización del documento
    } else {
      console.log('✅ Asignaciones de etiquetas anteriores eliminadas');
    }

    // Luego creamos las nuevas asignaciones si hay etiquetas
    if (tagIds.length > 0) {
      console.log('🔍 Verificando etiquetas existentes:', tagIds);
      
      // Verificar qué etiquetas existen
      const { data: existingTags, error: tagsError } = await supabase
        .from('training_tags')
        .select('id')
        .in('id', tagIds);

      if (tagsError) {
        console.error('❌ Error al verificar etiquetas existentes:', tagsError);
      } else {
        const existingTagIds = new Set(existingTags?.map(tag => tag.id) || []);
        const validTagIds = tagIds.filter(id => existingTagIds.has(id));

        // Registrar advertencia si hay etiquetas no encontradas
        if (validTagIds.length !== tagIds.length) {
          const missingTags = tagIds.filter(id => !existingTagIds.has(id));
          console.warn(`⚠️ Las siguientes etiquetas no existen y no se asignarán: ${missingTags.join(', ')}`);
        }

        // Solo crear asignaciones para etiquetas que existen
        if (validTagIds.length > 0) {
          console.log('➕ Creando asignaciones para etiquetas válidas:', validTagIds);
          
          const tagAssignments = validTagIds.map(tagId => ({
            document_id: documentId,
            tag_id: tagId,
            
          }));

          const { error: tagAssignError } = await supabase
            .from('hse_document_tag_assignments' as any)
            .insert(tagAssignments);

          if (tagAssignError) {
            console.error('❌ Error al asignar etiquetas al documento:', tagAssignError);
          } else {
            console.log('✅ Asignaciones de etiquetas actualizadas correctamente');
          }
        } else {
          console.log('ℹ️ No hay etiquetas válidas para asignar');
        }
      }
    } else {
      console.log('ℹ️ No se especificaron etiquetas para asignar');
    }

    return { success: true, document };
  } catch (error) {
    console.error("Error en updateDocument:", error);
    throw error;
  }
}

type TypeOfEmployee = {
  id: string;
  name: string;
};

export async function getTypeOfEmployeeForDocument(documentId: string): Promise<{
  data: TypeOfEmployee[] | null;
  error: string | null;
}> {
  const supabase = supabaseServer();

  try {
    console.log('🔍 Buscando posiciones asignadas para el documento:', documentId);
    
    // Primero, buscamos directamente las asignaciones de tipo 'position' para este documento
    const { data: positionAssignments, error: assignmentsError } = await supabase
      .from('hse_document_assignments' as any)
      .select('assignee_id')
      .eq('document_id', documentId)
      .eq('assignee_type', 'position');

    if (assignmentsError) {
      console.error('❌ Error al buscar asignaciones:', assignmentsError);
      throw assignmentsError;
    }

    console.log('📋 Asignaciones de posiciones encontradas:', positionAssignments);

    // Si no hay asignaciones, retornamos un array vacío
    if (!positionAssignments || positionAssignments.length === 0) {
      console.log('ℹ️ No se encontraron asignaciones de posiciones para el documento');
      return { data: [], error: null };
    }

    // Extraemos los IDs de las posiciones, asegurándonos de que no sean nulos
    const positionIds = positionAssignments
      .map((a: any) => a.assignee_id)
      .filter((id: string | null): id is string => id !== null);
    
    console.log('🔢 IDs de posiciones a buscar en hierarchy:', positionIds);

    if (positionIds.length === 0) {
      console.log('⚠️ No hay IDs de posiciones válidos para buscar');
      return { data: [], error: null };
    }

    // Obtenemos los detalles de las posiciones desde la tabla hierarchy
    const { data: positions, error: positionsError } = await supabase
      .from('hierarchy')
      .select('id, name')
      .in('id', positionIds);

    if (positionsError) {
      console.error('❌ Error al buscar las posiciones en hierarchy:', positionsError);
      throw positionsError;
    }
    
    console.log('✅ Posiciones encontradas en la base de datos:', positions);

    return { 
      data: positions || [], 
      error: null 
    };
  } catch (err) {
    console.error('Error al obtener cargos asignados al documento:', err);
    return {
      data: null,
      error: 'No se pudieron obtener las posiciones jerárquicas asignadas al documento.',
    };
  }
}