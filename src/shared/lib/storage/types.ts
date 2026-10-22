// Tipos compartidos de la capa de storage (cliente y servidor).

export type StorageBucket =
  | 'document_files'
  | 'document_files_expired'
  | 'documents-hse'
  | 'repair_images'
  | 'training-materials'
  | 'daily_reports'
  | 'logo'
  | 'documents'
  | 'purchase_invoices'
  | 'purchase_orders'
  | 'sales_invoices'
  | 'receipts'
  | 'costos-pdfs'
  | 'vehicle_photos'
  | 'employee_photos'
  | 'avatar'

/** Buckets cuyo contenido es privado: se sirven con URL firmada. */
export const PRIVATE_BUCKETS: readonly StorageBucket[] = ['costos-pdfs', 'purchase_orders']

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

export interface StorageObjectInfo {
  name: string
  id: string | null
  updated_at: string | null
  created_at: string | null
  last_accessed_at: string | null
  metadata: { size: number; mimetype?: string } | null
}

export type StorageDriver = 'supabase' | 's3'

/** S3 no admite guiones bajos en nombres de bucket: `document_files` pasa a `document-files`. */
export function s3BucketName(bucket: StorageBucket): string {
  return bucket.replace(/_/g, '-')
}

/** Arma la URL pública de un objeto (path-style, como lo sirve RustFS/MinIO). */
export function buildPublicUrl(baseUrl: string, bucket: StorageBucket, path: string): string {
  const cleanPath = path.replace(/^\/+/, '')
  return `${baseUrl.replace(/\/+$/, '')}/${s3BucketName(bucket)}/${cleanPath.split('/').map(encodeURIComponent).join('/')}`
}
