// Storage abstraction layer (client-side)
// Driver por NEXT_PUBLIC_STORAGE_DRIVER: 'supabase' (default) o 's3' (RustFS vía /api/storage).

import { supabaseBrowser } from '@/shared/lib/supabase/browser'
import {
  buildPublicUrl,
  type ListOptions,
  type StorageBucket,
  type StorageObjectInfo,
  type UploadOptions,
} from '@/shared/lib/storage/types'

export type { StorageBucket, UploadOptions, ListOptions }

const useS3 = process.env.NEXT_PUBLIC_STORAGE_DRIVER === 's3'

async function api<T>(op: string, bucket: StorageBucket, fields: Record<string, string | Blob> = {}): Promise<T> {
  const form = new FormData()
  form.set('op', op)
  form.set('bucket', bucket)
  for (const [key, value] of Object.entries(fields)) form.set(key, value)
  const res = await fetch('/api/storage', { method: 'POST', body: form })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error ?? `Storage error ${res.status}`)
  return body as T
}

export const storage = {
  async upload(bucket: StorageBucket, path: string, file: File | Blob, options?: UploadOptions) {
    if (useS3) {
      return api<{ path: string; id: string; fullPath: string }>('upload', bucket, {
        path,
        file,
        options: JSON.stringify(options ?? {}),
      })
    }
    const supabase = supabaseBrowser()
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, options)
    if (error) throw error
    return data
  },

  async download(bucket: StorageBucket, path: string) {
    if (useS3) {
      const res = await fetch(`/api/storage?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`)
      if (!res.ok) throw new Error('Object not found')
      return res.blob()
    }
    const supabase = supabaseBrowser()
    const { data, error } = await supabase.storage.from(bucket).download(path)
    if (error) throw error
    return data
  },

  async remove(bucket: StorageBucket, paths: string[]) {
    if (useS3) return api<{ name: string }[]>('remove', bucket, { paths: JSON.stringify(paths) })
    const supabase = supabaseBrowser()
    const { data, error } = await supabase.storage.from(bucket).remove(paths)
    if (error) throw error
    return data
  },

  getPublicUrl(bucket: StorageBucket, path: string) {
    if (useS3) return buildPublicUrl(process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL!, bucket, path)
    const supabase = supabaseBrowser()
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  async list(bucket: StorageBucket, path?: string, options?: ListOptions) {
    if (useS3) {
      return api<StorageObjectInfo[]>('list', bucket, {
        path: path ?? '',
        options: JSON.stringify(options ?? {}),
      })
    }
    const supabase = supabaseBrowser()
    const { data, error } = await supabase.storage.from(bucket).list(path, options)
    if (error) throw error
    return data
  },

  async createSignedUrl(bucket: StorageBucket, path: string, expiresInSec = 3600) {
    if (useS3) {
      const { url } = await api<{ url: string }>('signed-url', bucket, { path, expiresIn: String(expiresInSec) })
      return url
    }
    const supabase = supabaseBrowser()
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSec)
    if (error) throw error
    return data.signedUrl
  },
}
