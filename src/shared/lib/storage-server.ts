// Storage abstraction layer (server-side)
// Currently delegates to Supabase Storage via the server client.
// Can be swapped to S3, R2, Vercel Blob, etc. in the future.

import { supabaseServer } from '@/shared/lib/supabase/server'

export type StorageBucket =
  | 'document_files'
  | 'document_files_expired'
  | 'documents-hse'
  | 'repair_images'
  | 'training-materials'
  | 'daily_reports'
  | 'logo'
  | 'documents'

export interface UploadOptions {
  cacheControl?: string
  upsert?: boolean
  contentType?: string
}

export interface ListOptions {
  search?: string
  limit?: number
  offset?: number
  sortBy?: { column: string; order: string }
}

export const storageServer = {
  async upload(bucket: StorageBucket, path: string, file: File | Blob, options?: UploadOptions) {
    const supabase = await supabaseServer()
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, options)
    if (error) throw error
    return data
  },

  async download(bucket: StorageBucket, path: string) {
    const supabase = await supabaseServer()
    const { data, error } = await supabase.storage.from(bucket).download(path)
    if (error) throw error
    return data
  },

  async remove(bucket: StorageBucket, paths: string[]) {
    const supabase = await supabaseServer()
    const { data, error } = await supabase.storage.from(bucket).remove(paths)
    if (error) throw error
    return data
  },

  async getPublicUrl(bucket: StorageBucket, path: string) {
    const supabase = await supabaseServer()
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  async list(bucket: StorageBucket, path?: string, options?: ListOptions) {
    const supabase = await supabaseServer()
    const { data, error } = await supabase.storage.from(bucket).list(path, options)
    if (error) throw error
    return data
  },
}
