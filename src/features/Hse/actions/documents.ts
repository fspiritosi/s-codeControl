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
export type Document = {
  id: string
  title: string
  description: string | null
  version: string
  file_path: string  // Cambiado de file_url a file_path
  file_name: string
  file_size: number
  file_type: string
  upload_date: string
  expiry_date: string
  status: 'active' | 'expired' | 'pending'
  created_by: string
  created_at: string
  updated_at: string
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
    .eq("company_id", company_id)
    
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener documentos:', error)
    throw new Error('Error al obtener los documentos')
  }

  return data as Document[]
}

// Obtener un documento por ID
export async function getDocumentById(id: string): Promise<Document> {
  
  const supabase = supabaseServer()

  const { data, error } = await supabase
    .from('hse_documents' as any)
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error al obtener el documento:', error)
    throw new Error('Documento no encontrado')
  }

  return data as Document
}

export async function createDocument(formData: FormData, company_id: string) {
  const supabase = supabaseServer()

  // 1. Obtener el usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('Error al obtener el usuario:', userError)
    throw new Error('No se pudo obtener el usuario autenticado')
  }

  // 2. Validar y obtener datos del formulario
  const file = formData.get('file') as File | null
  if (!file) {
    throw new Error('No se ha proporcionado ningún archivo')
  }

  // 3. Subir el archivo a Supabase Storage
  const filePath = `hse/documents/${Date.now()}-${file.name}`
  const arrayBuffer = await file.arrayBuffer()

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents-hse')
    .upload(filePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
    })

  if (uploadError) {
    console.error('Error al subir el archivo:', uploadError)
    throw new Error('No se pudo subir el archivo')
  }

  // 4. Obtener URL pública del archivo
  const { data: { publicUrl } } = supabase.storage
    .from('documents-hse')
    .getPublicUrl(filePath)

  // 5. Preparar datos para la base de datos
  const documentData = {
    title: formData.get('title') as string,
    version: formData.get('version') as string,
    expiry_date: formData.get('expiry_date') as string,
    description: formData.get('description') as string | null,
    file_path: filePath,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type,
    upload_date: new Date().toISOString(),
    status: 'active' as const,
    created_by: user.id,
    company_id: company_id
  }

  // 6. Validar con el esquema compartido
  // const validation = documentSchema.safeParse(documentData)
  // if (!validation.success) {
  //   console.error('Error de validación:', validation.error)
  //   throw new Error('Datos del documento no válidos')
  // }

  // 7. Insertar en la base de datos
  const { data, error } = await supabase
    .from('hse_documents' as any)
    .insert([documentData])
    .select()
    .single()

  if (error) {
    console.error('Error al guardar el documento:', error)
    // Intentar eliminar el archivo subido si falla la inserción
    await supabase.storage
      .from('documents-hse')
      .remove([filePath])
      .catch(console.error)
    
    throw new Error('Error al guardar el documento en la base de datos')
  }

  return data as Document
}
