// Storage abstraction layer (client-side)
// Habla con /api/storage (RustFS/S3 en el servidor); las URLs públicas se arman con NEXT_PUBLIC_STORAGE_PUBLIC_URL.

import {
  buildPublicUrl,
  type ListOptions,
  type StorageBucket,
  type StorageObjectInfo,
  type UploadOptions,
} from '@/shared/lib/storage/types'

export type { StorageBucket, UploadOptions, ListOptions }

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
  upload(bucket: StorageBucket, path: string, file: File | Blob, options?: UploadOptions) {
    return api<{ path: string; id: string; fullPath: string }>('upload', bucket, {
      path,
      file,
      options: JSON.stringify(options ?? {}),
    })
  },

  async download(bucket: StorageBucket, path: string) {
    const res = await fetch(`/api/storage?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`)
    if (!res.ok) throw new Error('Object not found')
    return res.blob()
  },

  remove(bucket: StorageBucket, paths: string[]) {
    return api<{ name: string }[]>('remove', bucket, { paths: JSON.stringify(paths) })
  },

  getPublicUrl(bucket: StorageBucket, path: string) {
    return buildPublicUrl(process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL!, bucket, path)
  },

  list(bucket: StorageBucket, path?: string, options?: ListOptions) {
    return api<StorageObjectInfo[]>('list', bucket, {
      path: path ?? '',
      options: JSON.stringify(options ?? {}),
    })
  },

  async createSignedUrl(bucket: StorageBucket, path: string, expiresInSec = 3600) {
    const { url } = await api<{ url: string }>('signed-url', bucket, { path, expiresIn: String(expiresInSec) })
    return url
  },
}
