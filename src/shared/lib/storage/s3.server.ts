// Backend S3 (RustFS/MinIO/R2). Solo se importa desde el servidor.

import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3BucketName, type ListOptions, type StorageBucket, type StorageObjectInfo, type UploadOptions } from './types'

const globalForS3 = globalThis as unknown as { s3?: S3Client; s3Public?: S3Client }

// Las URLs firmadas las abre el navegador: la firma incluye el host, así que se generan
// contra la URL pública (STORAGE_PUBLIC_URL) y no contra el endpoint interno de la red de Docker.
function publicClient(): S3Client {
  if (globalForS3.s3Public) return globalForS3.s3Public
  globalForS3.s3Public = new S3Client({
    endpoint: process.env.STORAGE_PUBLIC_URL || process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  })
  return globalForS3.s3Public
}

function client(): S3Client {
  if (globalForS3.s3) return globalForS3.s3
  globalForS3.s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  })
  return globalForS3.s3
}

export const s3Storage = {
  async upload(bucket: StorageBucket, path: string, file: Blob, options?: UploadOptions) {
    if (!options?.upsert) {
      const exists = await client()
        .send(new ListObjectsV2Command({ Bucket: s3BucketName(bucket), Prefix: path, MaxKeys: 1 }))
        .then((r) => r.Contents?.some((o) => o.Key === path) ?? false)
      if (exists) throw new Error('The resource already exists')
    }
    await client().send(
      new PutObjectCommand({
        Bucket: s3BucketName(bucket),
        Key: path,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: options?.contentType || file.type || 'application/octet-stream',
        CacheControl: options?.cacheControl ? `max-age=${options.cacheControl}` : undefined,
      })
    )
    return { path, id: path, fullPath: `${bucket}/${path}` }
  },

  async download(bucket: StorageBucket, path: string): Promise<{ body: ReadableStream; contentType: string }> {
    const res = await client().send(new GetObjectCommand({ Bucket: s3BucketName(bucket), Key: path }))
    return {
      body: res.Body!.transformToWebStream() as ReadableStream,
      contentType: res.ContentType || 'application/octet-stream',
    }
  },

  async remove(bucket: StorageBucket, paths: string[]) {
    if (paths.length === 0) return []
    // Se borra objeto por objeto: DeleteObjects en modo Quiet devuelve los fallos en `Errors` sin lanzar, y RustFS los deja
    // sin borrar en silencio (el archivo queda huérfano en el bucket aunque la app diga que lo eliminó).
    await Promise.all(
      paths.map((Key) => client().send(new DeleteObjectCommand({ Bucket: s3BucketName(bucket), Key })))
    )
    return paths.map((name) => ({ name }))
  },

  async list(bucket: StorageBucket, path?: string, options?: ListOptions): Promise<StorageObjectInfo[]> {
    const prefix = path ? `${path.replace(/\/+$/, '')}/` : ''
    const res = await client().send(
      new ListObjectsV2Command({
        Bucket: s3BucketName(bucket),
        Prefix: prefix,
        Delimiter: '/',
        MaxKeys: (options?.limit ?? 100) + (options?.offset ?? 0),
      })
    )
    const search = options?.search?.toLowerCase()
    const files = (res.Contents ?? [])
      .filter((o) => o.Key && o.Key !== prefix)
      .map((o) => ({
        name: o.Key!.slice(prefix.length),
        id: o.ETag ?? null,
        updated_at: o.LastModified?.toISOString() ?? null,
        created_at: o.LastModified?.toISOString() ?? null,
        last_accessed_at: o.LastModified?.toISOString() ?? null,
        metadata: { size: o.Size ?? 0 },
      }))
    const folders = (res.CommonPrefixes ?? []).map((p) => ({
      name: p.Prefix!.slice(prefix.length).replace(/\/$/, ''),
      id: null,
      updated_at: null,
      created_at: null,
      last_accessed_at: null,
      metadata: null,
    }))
    return [...folders, ...files]
      .filter((o) => !search || o.name.toLowerCase().includes(search))
      .slice(options?.offset ?? 0)
  },

  async createSignedUrl(bucket: StorageBucket, path: string, expiresInSec: number) {
    return getSignedUrl(publicClient(), new GetObjectCommand({ Bucket: s3BucketName(bucket), Key: path }), { expiresIn: expiresInSec })
  },
}
