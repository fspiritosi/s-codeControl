// Storage abstraction layer (server-side) sobre RustFS/S3.

import { s3Storage } from '@/shared/lib/storage/s3.server'
import {
  buildPublicUrl,
  type ListOptions,
  type StorageBucket,
  type UploadOptions,
} from '@/shared/lib/storage/types'

export type { StorageBucket, UploadOptions, ListOptions }

export const storageServer = {
  upload(bucket: StorageBucket, path: string, file: File | Blob, options?: UploadOptions) {
    return s3Storage.upload(bucket, path, file, options)
  },

  async download(bucket: StorageBucket, path: string) {
    const { body, contentType } = await s3Storage.download(bucket, path)
    return new Response(body, { headers: { 'content-type': contentType } }).blob()
  },

  remove(bucket: StorageBucket, paths: string[]) {
    return s3Storage.remove(bucket, paths)
  },

  async getPublicUrl(bucket: StorageBucket, path: string) {
    return buildPublicUrl(process.env.STORAGE_PUBLIC_URL!, bucket, path)
  },

  list(bucket: StorageBucket, path?: string, options?: ListOptions) {
    return s3Storage.list(bucket, path, options)
  },

  createSignedUrl(bucket: StorageBucket, path: string, expiresInSec = 3600) {
    return s3Storage.createSignedUrl(bucket, path, expiresInSec)
  },
}
