import 'server-only';

import { getActiveAiConfig } from './ai-config';
import { extractWithGemini } from './gemini-provider';
import { extractWithOpenAI } from './openai-provider';
import type { ExtractedInvoice, ExtractionFileInput } from './types';

/**
 * Capa swappable de extracción de facturas por AI.
 *
 * Resuelve el proveedor ACTIVO con `getActiveAiConfig` (lee la fila
 * `ai_provider_config` activa de la DB, con la API key descifrada; cae a la env
 * por compatibilidad) y rutea al provider correspondiente pasándole `apiKey` y
 * `model`. El resto de la app consume siempre `extractInvoiceFromFile` y no
 * necesita enterarse de qué proveedor hay detrás.
 *
 * Para sumar otro proveedor de AI: crear otro archivo `*-provider.ts` (mismo
 * contrato `(file, opts) => Promise<ExtractedInvoice>`) y agregar un `case` en
 * el ruteo de abajo.
 */
export async function extractInvoiceFromFile(
  file: ExtractionFileInput
): Promise<ExtractedInvoice> {
  const cfg = await getActiveAiConfig();

  switch (cfg.provider) {
    case 'openai':
      return extractWithOpenAI(file, cfg);
    case 'gemini':
    default:
      return extractWithGemini(file, cfg);
  }
}
