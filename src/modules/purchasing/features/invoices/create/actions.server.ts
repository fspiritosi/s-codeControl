'use server';

import { extractInvoiceFromFile } from '@/modules/purchasing/shared/invoice-extraction/extract-invoice';
import type { ExtractedInvoice } from '@/modules/purchasing/shared/invoice-extraction/types';
import {
  PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME,
  PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES,
} from '@/modules/purchasing/shared/validators';

/**
 * NOTA SOBRE EL RUNTIME:
 * Esta server action usa `Buffer` y llama a Gemini vía `fetch` con un archivo
 * en base64. Las server actions corren en Node.js por defecto, así que no hay
 * que setear `runtime` acá. La PÁGINA que consume esta action
 * (src/app/dashboard/purchasing/invoices/new/page.tsx) NO debe forzar
 * `export const runtime = 'edge'` — debe quedar en el runtime nodejs por
 * defecto para que la extracción funcione.
 */

type ExtractInvoiceResult =
  | { ok: true; data: ExtractedInvoice }
  | { ok: false; error: string };

/**
 * Recibe el archivo de una factura de compra (PDF o imagen) desde el cliente,
 * lo valida (MIME + tamaño), lo convierte a base64 y lo manda a la capa de
 * extracción AI. Devuelve los datos extraídos para PRE-LLENAR el formulario.
 *
 * NO sube el archivo a storage ni guarda nada: solo extrae. La subida y el
 * guardado de la factura se manejan en sus propios lotes/acciones.
 *
 * @param formData FormData con el archivo bajo la key `file`.
 */
export async function extractInvoiceDataFromFile(
  formData: FormData
): Promise<ExtractInvoiceResult> {
  const raw = formData.get('file');

  if (!(raw instanceof File)) {
    return { ok: false, error: 'No se recibió ningún archivo válido.' };
  }

  if (raw.size === 0) {
    return { ok: false, error: 'El archivo está vacío.' };
  }

  if (raw.size > PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES) {
    return { ok: false, error: 'El archivo supera los 10 MB.' };
  }

  if (
    !(PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME as readonly string[]).includes(raw.type)
  ) {
    return {
      ok: false,
      error: 'Formato no permitido. Subí una imagen (JPG/PNG) o un PDF.',
    };
  }

  try {
    const base64 = Buffer.from(await raw.arrayBuffer()).toString('base64');
    const data = await extractInvoiceFromFile({ base64, mimeType: raw.type });
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'No se pudieron leer los datos de la factura.',
    };
  }
}
