'use server'

import { supabaseServer } from '@/lib/supabase/server'
import { uploadDocumentFile } from '@/lib/utils';

import { z } from 'zod'

// Esquema de validación para documentos
const documentSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(255),
  description: z.string().nullable().optional(),
  version: z.string().min(1, 'La versión es requerida').max(50),
  file_url: z.string().url('URL de archivo no válida'),
  file_name: z.string().min(1, 'Nombre de archivo requerido').max(255),
  file_size: z.number().int().positive('El tamaño del archivo debe ser un número positivo'),
  file_type: z.string().min(1, 'Tipo de archivo requerido').max(100),
  upload_date: z.string().or(z.date()).transform(val => new Date(val).toISOString()).optional(),
  expiry_date: z.string().or(z.date()).transform(val => new Date(val).toISOString().split('T')[0]),
  status: z.enum(['active', 'expired', 'pending']).default('pending'),
  created_by: z.string().uuid('ID de usuario no válido').optional()
})

// Tipos
export type DocumentInput = z.infer<typeof documentSchema>
export type Document = {
  id: string
  title: string
  description: string | null
  version: string
  file_url: string
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
type FileData = {
  name: string
  type: string
  size: number
  data: number[] // Array de bytes
}

type CreateDocumentInput = {
  title: string
  version: string
  expiry_date: string
  description?: string | null
  file: FileData
}

// Obtener todos los documentos
export async function getDocuments(company_id: string ,filters?: {
  status?: 'active' | 'expired' | 'pending'
  search?: string
}) {
  
    
  const supabase = supabaseServer()
  
  console.log(company_id)
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

export async function createDocument(formData: FormData) {
  const supabase = supabaseServer()

  // Recuperar el usuario autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error al obtener el usuario:', userError)
    throw new Error('No se pudo obtener el usuario autenticado')
  }

  // Leer campos del FormData
  const title = formData.get('title') as string
  const version = formData.get('version') as string
  const expiryDate = formData.get('expiryDate') as string
  const description = formData.get('description') as string | null
  const file = formData.get('file') as File

  if (!file || typeof file.name !== 'string') {
    throw new Error('Archivo inválido')
  }

  // Convertir archivo a ArrayBuffer para subirlo
  const arrayBuffer = await file.arrayBuffer()

  const filePath = `hse/documents/${Date.now()}-${file.name}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents-hse')
    .upload(filePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Error al subir el archivo:', uploadError)
    throw new Error('No se pudo subir el archivo')
  }

  const { data: { publicUrl } } = supabase.storage
    .from('documents-hse')
    .getPublicUrl(filePath)

  // Insertar en la base de datos
  const { data, error } = await supabase
    .from('hse_documents' as any)
    .insert([
      {
        title,
        version,
        expiry_date: expiryDate,
        description,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        upload_date: new Date().toISOString(),
        status: 'pending',
        created_by: user.id,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error al guardar el documento:', error)
    throw new Error('Error al guardar el documento en la base de datos')
  }

  return data
}





