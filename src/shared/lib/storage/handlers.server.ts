// Lógica de /api/storage: el cliente (navegador) habla con este endpoint cuando
// STORAGE_DRIVER=s3, porque ya no hay SDK de Supabase con sesión propia.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { s3Storage } from './s3.server'
import { PRIVATE_BUCKETS, type ListOptions, type StorageBucket, type UploadOptions } from './types'

const BUCKETS: readonly StorageBucket[] = [
  'document_files',
  'document_files_expired',
  'documents-hse',
  'repair_images',
  'training-materials',
  'daily_reports',
  'logo',
  'documents',
  'purchase_invoices',
  'purchase_orders',
  'sales_invoices',
  'receipts',
  'costos-pdfs',
  'vehicle_photos',
  'employee_photos',
  'avatar',
]

// Las páginas públicas de mantenimiento (QR) suben fotos sin sesión de NextAuth:
// se identifican con la cookie `empleado_name` que setea su login por CUIL/invitado.
const PUBLIC_UPLOAD_BUCKETS: readonly StorageBucket[] = ['repair_images']

function isBucket(value: unknown): value is StorageBucket {
  return typeof value === 'string' && (BUCKETS as readonly string[]).includes(value)
}

function isSafePath(path: unknown): path is string {
  return typeof path === 'string' && path.length > 0 && !path.includes('..') && !path.startsWith('/')
}

async function isAllowed(req: NextRequest, bucket: StorageBucket): Promise<boolean> {
  const session = await auth()
  if (session?.user) return true
  if (PUBLIC_UPLOAD_BUCKETS.includes(bucket) && req.cookies.get('empleado_name')) return true
  // Los buckets públicos también se leen por URL directa; el endpoint no hace falta sin sesión.
  return false
}

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

/** GET /api/storage?bucket=&path=  → descarga el objeto (stream). */
export async function handleStorageGet(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket')
  const path = req.nextUrl.searchParams.get('path')
  if (!isBucket(bucket) || !isSafePath(path)) return fail('Parámetros inválidos', 400)
  if (!(await isAllowed(req, bucket))) return fail('No autorizado', 401)

  try {
    const { body, contentType } = await s3Storage.download(bucket, path)
    return new NextResponse(body, { headers: { 'content-type': contentType } })
  } catch {
    return fail('Object not found', 404)
  }
}

/** POST /api/storage  (multipart/form-data con `op`) */
export async function handleStoragePost(req: NextRequest) {
  const form = await req.formData()
  const op = form.get('op')
  const bucket = form.get('bucket')
  if (!isBucket(bucket)) return fail('Bucket inválido', 400)
  if (!(await isAllowed(req, bucket))) return fail('No autorizado', 401)

  try {
    switch (op) {
      case 'upload': {
        const path = form.get('path')
        const file = form.get('file')
        if (!isSafePath(path) || !(file instanceof Blob)) return fail('Parámetros inválidos', 400)
        const options = JSON.parse(String(form.get('options') ?? '{}')) as UploadOptions
        return NextResponse.json(await s3Storage.upload(bucket, path, file, options))
      }
      case 'remove': {
        const paths = JSON.parse(String(form.get('paths') ?? '[]')) as unknown[]
        if (!paths.every(isSafePath)) return fail('Parámetros inválidos', 400)
        return NextResponse.json(await s3Storage.remove(bucket, paths as string[]))
      }
      case 'list': {
        const path = form.get('path')
        const options = JSON.parse(String(form.get('options') ?? '{}')) as ListOptions
        if (path && !isSafePath(path)) return fail('Parámetros inválidos', 400)
        return NextResponse.json(await s3Storage.list(bucket, path ? String(path) : undefined, options))
      }
      case 'signed-url': {
        const path = form.get('path')
        if (!isSafePath(path)) return fail('Parámetros inválidos', 400)
        if (!PRIVATE_BUCKETS.includes(bucket) && !(await auth())) return fail('No autorizado', 401)
        const expiresIn = Number(form.get('expiresIn') ?? 3600)
        return NextResponse.json({ url: await s3Storage.createSignedUrl(bucket, path, expiresIn) })
      }
      default:
        return fail('Operación inválida', 400)
    }
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Error de storage', 500)
  }
}
