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
  status: 'active' | 'expired' | 'pending' | 'inactive'
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
  status: 'active' | 'expired' | 'pending' | 'inactive'
  created_by: string
  created_at: string
  updated_at: string
  company_id: string
  versions?: DocumentVersion[]
}

// Obtener todos los documentos
export async function getDocuments(company_id: string, filters?: {
  status?: 'active' | 'expired' | 'pending'
  search?: string
}) {
  const supabase = supabaseServer()
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

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener documentos:', error)
    throw new Error('No se pudieron obtener los documentos')
  }

  return data as Document[]
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

export async function createDocument(formData: FormData, company_id: string) {
  console.log('Iniciando creación de documento...');
  const supabase = supabaseServer()
  let filePath: string | null = null;

  try {
    // 1. Validar company_id
    if (!company_id) {
      throw new Error('Se requiere el ID de la compañía');
    }

    // 2. Validar que el usuario esté autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No se pudo autenticar al usuario');
    }

    // 3. Validar campos obligatorios
    const title = formData.get('title') as string;
    const version = formData.get('version') as string;
    const file = formData.get('file') as File;

    if (!title || !file) {
      throw new Error('El título y el archivo son obligatorios');
    }

    // 4. Verificar si ya existe un documento con el mismo título
    const { data: existingDoc, error: fetchError } = await supabase
      .from('hse_documents' as any)
      .select('*')
      .eq('title', title)
      .eq('company_id', company_id)
      .maybeSingle();

    if (existingDoc) {
      throw new Error('El documento ya existe');
    }

    // 5. Subir el archivo a Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    filePath = `${company_id}/${fileName}`;

    console.log('Subiendo archivo a storage:', { filePath, size: file.size, type: file.type });
    
    const { error: uploadError } = await supabase.storage
      .from('documents-hse')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error al subir el archivo:', uploadError);
      throw new Error('No se pudo subir el archivo');
    }
  
    // 6. Obtener URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('documents-hse')
      .getPublicUrl(filePath);

    let documentId: string;

    if (existingDoc && !fetchError) {
      // Si existe un documento con el mismo título, guardamos la versión actual
      documentId = existingDoc.id;
      
      try {
        // Guardar la versión actual en hse_document_versions
        // Obtener la URL pública del archivo existente
        const { data: { publicUrl } } = supabase.storage
          .from('documents-hse')
          .getPublicUrl(existingDoc.file_path);

        const versionData = {
          document_id: documentId,
          version: existingDoc.version,
          file_path: filePath, // Usar la URL pública en lugar de la ruta del archivo
          file_name: existingDoc.file_name,
          file_size: existingDoc.file_size,
          file_type: existingDoc.file_type,
          created_by: existingDoc.created_by,
          change_log: `Versión ${existingDoc.version} - Reemplazada por nueva versión`,
          created_at: new Date().toISOString(),
          expiry_date: existingDoc.expiry_date,
          
        };
        console.log(versionData)
        console.log('Guardando versión anterior en hse_document_versions:', versionData);
        
        // Insertar la versión anterior
        const { error: versionError } = await supabase
          .from('hse_document_versions' as any)
          .insert(versionData);

        if (versionError) {
          console.error('Error al guardar la versión anterior:', versionError);
          // No detenemos el flujo si falla el guardado de la versión anterior
          console.log('Continuando con la actualización del documento principal...');
        } else {
          console.log('Versión anterior guardada correctamente');
        }
        
        // 2. Ahora actualizamos el documento principal con la nueva versión
        const updateData = {
          version: String(version || '1.0'),
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          updated_at: new Date().toISOString(),
          expiry_date: formData.get('expiry_date') as string || "sin vencimiento",
          description: formData.get('description') as string || null
        };

        console.log('Actualizando documento principal con:', updateData);
        
        const { error: updateError } = await supabase
          .from('hse_documents' as any)
          .update(updateData)
          .eq('id', documentId);

        if (updateError) throw updateError;
        
        console.log('Documento actualizado correctamente');
        documentId = existingDoc.id;
        
      } catch (error) {
        console.error('Error durante la actualización del documento:', error);
        // Intentar limpiar el archivo subido si algo falló
        if (filePath) {
          try {
            await supabase.storage.from('documents-hse').remove([filePath]);
            console.log('Archivo temporal eliminado');
          } catch (cleanupError) {
            console.error('Error al limpiar archivo temporal:', cleanupError);
          }
        }
        throw error;
      }
    } else {
      // Crear un nuevo documento
      console.log('Creando nuevo documento...');
      const newDoc = {
        title,
        description: formData.get('description') as string || null,
        version: String(version || '1.0'),
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        upload_date: new Date().toISOString(),
        expiry_date: formData.get('expiry_date') as string || null,
        status: 'active',
        created_by: user.id,
        company_id
      };

      console.log('Insertando nuevo documento:', newDoc);
      
      const { data: documentData, error: insertError } = await supabase
        .from('hse_documents' as any)
        .insert([newDoc])
        .select()
        .single();

      if (insertError) {
        console.error('Error al crear el documento:', insertError);
        // Limpiar el archivo subido si falla la creación
        if (filePath) {
          try {
            await supabase.storage.from('documents-hse').remove([filePath]);
            console.log('Archivo temporal eliminado');
          } catch (cleanupError) {
            console.error('Error al limpiar archivo temporal:', cleanupError);
          }
        }
        throw insertError;
      }

      console.log('Documento creado correctamente:', documentData);
      documentId = documentData.id;
    }

    // Obtener el documento actualizado/creado
    const { data: document, error: fetchDocError } = await supabase
      .from('hse_documents' as any)
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchDocError) {
      console.error('Error al obtener el documento actualizado:', fetchDocError);
      throw new Error('Documento procesado pero no se pudo recuperar la información actualizada');
    }

    return { 
      success: true, 
      document: document as Document,
      publicUrl 
    };

  } catch (error) {
    console.error('=== Error en la transacción ===');
    console.error('Tipo de error:', typeof error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      console.error('Stack trace:', error.stack);
      
      // Log Supabase error details if available
      if ('code' in error) {
        console.error('Código de error:', (error as any).code);
      }
      if ('details' in error) {
        console.error('Detalles:', (error as any).details);
      }
      if ('hint' in error) {
        console.error('Sugerencia:', (error as any).hint);
      }
    } else {
      console.error('Error desconocido:', error);
    }
    
    // Intentar limpiar el archivo si existe
    if (filePath) {
      try {
        console.log('Intentando limpiar archivo temporal...');
        const { error: cleanupError } = await supabase.storage
          .from('documents-hse')
          .remove([filePath]);
          
        if (cleanupError) {
          console.error('Error al limpiar archivo temporal:', cleanupError);
        } else {
          console.log('Archivo temporal eliminado');
        }
      } catch (cleanupError) {
        console.error('Excepción al limpiar archivo temporal:', cleanupError);
      }
    }
    
    throw new Error(error instanceof Error ? error.message : 'Error desconocido al procesar el documento');
  }
}


export async function createDocumentVersion(
  documentId: string,
  formData: FormData,
  company_id: string,
) {
  console.log('Iniciando creación de nueva versión de documento...');
  const supabase = supabaseServer()
  let filePath: string | null = null;

  try {
    // 1. Validar company_id
    if (!company_id) {
      throw new Error('Se requiere el ID de la compañía');
    }

    // 2. Validar que el usuario esté autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No se pudo autenticar al usuario');
    }

    // 3. Validar campos obligatorios
    const version = formData.get('version') as string;
    const file = formData.get('file') as File;
    const expiryDate = formData.get('expiryDate') as string;
    const description = formData.get('description') as string;

    if (!file) {
      throw new Error('El archivo es obligatorio');
    }

    // 4. Obtener documento existente
    const { data: existingDoc, error: fetchError } = await supabase
      .from('hse_documents' as any)
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !existingDoc) {
      throw new Error('Documento no encontrado');
    }
     // Validar que la versión no sea menor a la actual
     const currentVersion = parseFloat(existingDoc.version);
     const newVersion = version ? parseFloat(version) : currentVersion + 1;
     
     if (newVersion <= currentVersion) {
       throw new Error(`No se puede crear una versión (${newVersion}) menor o igual a la versión actual (${currentVersion})`);
     }
    // 5. Subir el archivo a Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    filePath = `${company_id}/${fileName}`;

    console.log('Subiendo archivo a storage:', { filePath, size: file.size, type: file.type });
    
    const { error: uploadError } = await supabase.storage
      .from('documents-hse')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error al subir el archivo:', uploadError);
      throw new Error('No se pudo subir el archivo');
    }
  
    // 6. Obtener URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('documents-hse')
      .getPublicUrl(filePath);

    try {
      // 7. Guardar la versión actual en hse_document_versions
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

      console.log('Guardando versión anterior en hse_document_versions:', versionData);
      
      const { error: versionError } = await supabase
        .from('hse_document_versions' as any)
        .insert(versionData);

      if (versionError) {
        console.error('Error al guardar la versión anterior:', versionError);
        // No detenemos el flujo si falla el guardado de la versión anterior
        console.log('Continuando con la actualización del documento principal...');
      } else {
        console.log('Versión anterior guardada correctamente');
      }
      
      // 8. Actualizar el documento principal con la nueva versión
      const updateData = {
        version: version || String(Number(existingDoc.version) + 1),
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        updated_at: new Date().toISOString(),
        expiry_date: expiryDate || null, // No heredar la fecha anterior
        description: description || null,
        status: 'active',
      };

      console.log('Actualizando documento principal con nueva versión:', updateData);
      
      const { error: updateError } = await supabase
        .from('hse_documents' as any)
        .update(updateData)
        .eq('id', documentId);

      if (updateError) throw updateError;
      
      console.log('Documento actualizado correctamente con la nueva versión');

      // 9. Obtener el documento actualizado
      const { data: document, error: fetchDocError } = await supabase
        .from('hse_documents' as any)
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchDocError) {
        console.error('Error al obtener el documento actualizado:', fetchDocError);
        throw new Error('Documento actualizado pero no se pudo recuperar la información actualizada');
      }

      return { 
        success: true, 
        document: document as Document,
        publicUrl 
      };

    } catch (error) {
      console.error('Error durante la actualización del documento:', error);
      // Intentar limpiar el archivo subido si algo falló
      if (filePath) {
        try {
          await supabase.storage.from('documents-hse').remove([filePath]);
          console.log('Archivo temporal eliminado');
        } catch (cleanupError) {
          console.error('Error al limpiar archivo temporal:', cleanupError);
        }
      }
      throw error;
    }

  } catch (error) {
    console.error('=== Error en la creación de versión ===');
    console.error('Tipo de error:', typeof error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      console.error('Stack trace:', error.stack);
      
      // Log Supabase error details if available
      if ('code' in error) {
        console.error('Código de error:', (error as any).code);
      }
      if ('details' in error) {
        console.error('Detalles:', (error as any).details);
      }
      if ('hint' in error) {
        console.error('Sugerencia:', (error as any).hint);
      }
    } else {
      console.error('Error desconocido:', error);
    }
    
    // Intentar limpiar el archivo si existe
    if (filePath) {
      try {
        console.log('Intentando limpiar archivo temporal...');
        const { error: cleanupError } = await supabase.storage
          .from('documents-hse')
          .remove([filePath]);
          
        if (cleanupError) {
          console.error('Error al limpiar archivo temporal:', cleanupError);
        } else {
          console.log('Archivo temporal eliminado');
        }
      } catch (cleanupError) {
        console.error('Excepción al limpiar archivo temporal:', cleanupError);
      }
    }
    
    throw new Error(error instanceof Error ? error.message : 'Error desconocido al crear la versión del documento');
  }
}