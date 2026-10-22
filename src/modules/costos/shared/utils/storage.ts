'use server';

import { storageServer } from '@/shared/lib/storage-server';
import { COSTOS_PDF_BUCKET, COSTOS_SIGNED_URL_TTL } from '@/modules/costos/shared/constants';

/**
 * Sube (o reemplaza) un PDF al bucket privado del módulo de costos.
 * Devuelve el `path` almacenado (para persistir en la fila correspondiente).
 */
export async function subirPDF(path: string, buffer: Buffer): Promise<string> {
  await storageServer.upload(COSTOS_PDF_BUCKET, path, new Blob([new Uint8Array(buffer)], { type: 'application/pdf' }), {
    contentType: 'application/pdf',
    upsert: true,
  });
  return path;
}

/** Genera una URL firmada (temporal) para descargar un PDF privado. */
export async function getSignedUrlPDF(path: string): Promise<string> {
  return storageServer.createSignedUrl(COSTOS_PDF_BUCKET, path, COSTOS_SIGNED_URL_TTL);
}

/** Elimina un PDF del bucket (best-effort, no lanza si no existe). */
export async function eliminarPDF(path: string): Promise<void> {
  await storageServer.remove(COSTOS_PDF_BUCKET, [path]).catch(() => undefined);
}
