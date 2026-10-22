// Storage abstraction layer (server-side)
// Driver por STORAGE_DRIVER: 'supabase' (default) o 's3' (RustFS/MinIO).

import { supabaseServer } from '@/shared/lib/supabase/server'
import { s3Storage } from '@/shared/lib/storage/s3.server'
import {
  buildPublicUrl,
  type ListOptions,
  type StorageBucket,
  type UploadOptions,
} from '@/shared/lib/storage/types'

export type { StorageBucket, UploadOptions, ListOptions }

const useS3 = () => process.env.STORAGE_DRIVER === 's3'

export const storageServer = {
  async upload(bucket: StorageBucket, path: string, file: File | Blob, options?: UploadOptions) {
    if (useS3()) return s3Storage.upload(bucket, path, file, options)
    const supabase = await supabaseServer()
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, options)
    if (error) throw error
    return data
  },

  async download(bucket: StorageBucket, path: string) {
    if (useS3()) {
      const { body, contentType } = await s3Storage.download(bucket, path)
      return new Response(body, { headers: { 'content-type': contentType } }).blob()
    }
    const supabase = await supabaseServer()
    const { data, error } = await supabase.storage.from(bucket).download(path)
    if (error) throw error
    return data
  },

  async remove(bucket: StorageBucket, paths: string[]) {
    if (useS3()) return s3Storage.remove(bucket, paths)
    const supabase = await supabaseServer()
    const { data, error } = await supabase.storage.from(bucket).remove(paths)
    if (error) throw error
    return data
  },

  async getPublicUrl(bucket: StorageBucket, path: string) {
    if (useS3()) return buildPublicUrl(process.env.STORAGE_PUBLIC_URL!, bucket, path)
    const supabase = await supabaseServer()
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  async list(bucket: StorageBucket, path?: string, options?: ListOptions) {
    if (useS3()) return s3Storage.list(bucket, path, options)
    const supabase = await supabaseServer()
    const { data, error } = await supabase.storage.from(bucket).list(path, options)
    if (error) throw error
    return data
  },

  async createSignedUrl(bucket: StorageBucket, path: string, expiresInSec = 3600) {
    if (useS3()) return s3Storage.createSignedUrl(bucket, path, expiresInSec)
    const supabase = await supabaseServer()
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSec)
    if (error) throw error
    return data.signedUrl
  },
}
