'use server';

import { supabaseServer } from '@/shared/lib/supabase/server';
import { COSTOS_PDF_BUCKET, COSTOS_SIGNED_URL_TTL } from '@/modules/costos/shared/constants';

/**
 * Sube (o reemplaza) un PDF al bucket privado del módulo de costos.
 * Devuelve el `path` almacenado (para persistir en la fila correspondiente).
 */
export async function subirPDF(path: string, buffer: Buffer): Promise<string> {
  const supabase = await supabaseServer();
  const { error } = await supabase.storage.from(COSTOS_PDF_BUCKET).upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

/** Genera una URL firmada (temporal) para descargar un PDF privado. */
export async function getSignedUrlPDF(path: string): Promise<string> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.storage
    .from(COSTOS_PDF_BUCKET)
    .createSignedUrl(path, COSTOS_SIGNED_URL_TTL);
  if (error || !data) throw error ?? new Error('No se pudo generar la URL firmada del PDF');
  return data.signedUrl;
}

/** Elimina un PDF del bucket (best-effort, no lanza si no existe). */
export async function eliminarPDF(path: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.storage.from(COSTOS_PDF_BUCKET).remove([path]);
}
