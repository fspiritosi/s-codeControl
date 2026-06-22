import 'server-only';

import { prisma } from '@/shared/lib/prisma';
import { decryptSecret } from '@/shared/lib/crypto';

/** Proveedores de AI soportados para la extracción de facturas. */
export type AiProvider = 'gemini' | 'openai';

/** Config resuelta del proveedor activo, lista para llamar al provider. */
export interface ActiveAiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
}

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

/** Modelo por defecto según el proveedor, cuando la fila no lo tiene seteado. */
function defaultModelFor(provider: AiProvider): string {
  return provider === 'openai' ? DEFAULT_OPENAI_MODEL : DEFAULT_GEMINI_MODEL;
}

/**
 * Devuelve la configuración del proveedor de AI ACTIVO (la fila
 * `ai_provider_config` con `is_active = true`), con la API key ya descifrada.
 *
 * FALLBACK por compatibilidad: si no hay fila activa, o la fila activa no tiene
 * `api_key` configurada, se usa `process.env.GEMINI_API_KEY` (provider
 * `gemini`, modelo `GEMINI_MODEL` o el default). Si tampoco hay key en el
 * entorno, lanza un Error claro.
 *
 * @throws Error si no hay ningún proveedor de AI configurado (ni en DB ni env).
 */
export async function getActiveAiConfig(): Promise<ActiveAiConfig> {
  const row = await prisma.ai_provider_config.findFirst({
    where: { is_active: true },
  });

  if (row && row.api_key) {
    const provider: AiProvider = row.provider === 'openai' ? 'openai' : 'gemini';
    return {
      provider,
      apiKey: decryptSecret(row.api_key),
      model: row.model ?? defaultModelFor(provider),
    };
  }

  // Fallback a la env (compatibilidad con el comportamiento previo).
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) {
    return {
      provider: 'gemini',
      apiKey: envKey,
      model: process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL,
    };
  }

  throw new Error('No hay proveedor de AI configurado.');
}
