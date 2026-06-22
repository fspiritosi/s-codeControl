'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/shared/lib/prisma';
import { getSession } from '@/shared/lib/session';
import { encryptSecret, decryptSecret } from '@/shared/lib/crypto';

/** Proveedores de AI configurables para la lectura de facturas. */
export type AiProvider = 'gemini' | 'openai';

const PROVIDERS: AiProvider[] = ['gemini', 'openai'];

const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
};

/** Vista segura de la config de un proveedor para el cliente (sin la key). */
export interface AiProviderConfigView {
  provider: AiProvider;
  model: string | null;
  isActive: boolean;
  hasKey: boolean;
}

const ADMIN_ROLES = ['Admin', 'Super Admin', 'Developer'];

/**
 * Valida que el usuario pueda administrar la config global de IA:
 * admin de plataforma o dueño (owner) de la empresa activa.
 */
async function ensureCanManageAi(): Promise<{ error: string } | null> {
  const s = await getSession();
  const isPlatformAdmin = ADMIN_ROLES.includes(s.profile?.role ?? '');
  const isOwner = s.role === 'owner';
  if (!isPlatformAdmin && !isOwner) {
    return { error: 'Sin permisos' };
  }
  return null;
}

/**
 * Devuelve la config de cada proveedor soportado (gemini, openai) en una vista
 * segura: NUNCA expone la `api_key` descifrada, solo `hasKey: boolean`. Si un
 * proveedor todavía no tiene fila, se devuelve con `hasKey=false`,
 * `isActive=false` y el modelo por defecto sugerido.
 */
export async function getAiProviderConfigs(): Promise<AiProviderConfigView[]> {
  const denied = await ensureCanManageAi();
  if (denied) return [];

  const rows = await prisma.ai_provider_config.findMany();
  const byProvider = new Map(rows.map((r) => [r.provider, r]));

  return PROVIDERS.map((provider) => {
    const row = byProvider.get(provider);
    return {
      provider,
      model: row?.model ?? DEFAULT_MODELS[provider],
      isActive: row?.is_active ?? false,
      hasKey: Boolean(row?.api_key),
    };
  });
}

export interface UpsertAiProviderConfigInput {
  provider: AiProvider;
  /** Si viene no-vacía, se cifra y reemplaza. Vacía/undefined = preservar la actual. */
  apiKey?: string;
  model?: string;
  isActive: boolean;
}

/**
 * Crea/actualiza la config de un proveedor. Reglas:
 * - `apiKey` no-vacía → se cifra con `encryptSecret` y se guarda. Vacía/undefined
 *   → NO se toca la key existente (se preserva).
 * - `isActive=true` → exclusividad: pone `is_active=false` en las demás filas y
 *   `true` en esta (en una transacción).
 */
export async function upsertAiProviderConfig(input: UpsertAiProviderConfigInput) {
  const denied = await ensureCanManageAi();
  if (denied) return denied;

  if (!PROVIDERS.includes(input.provider)) {
    return { error: 'Proveedor inválido' };
  }

  try {
    const apiKey = input.apiKey?.trim();
    const model = input.model?.trim() || null;
    const encryptedKey = apiKey ? encryptSecret(apiKey) : undefined;

    await prisma.$transaction(async (tx) => {
      // Exclusividad del activo: si esta fila pasa a activa, desactivar el resto.
      if (input.isActive) {
        await tx.ai_provider_config.updateMany({
          where: { provider: { not: input.provider } },
          data: { is_active: false },
        });
      }

      await tx.ai_provider_config.upsert({
        where: { provider: input.provider },
        update: {
          model,
          is_active: input.isActive,
          ...(encryptedKey !== undefined ? { api_key: encryptedKey } : {}),
        },
        create: {
          provider: input.provider,
          model,
          is_active: input.isActive,
          api_key: encryptedKey ?? null,
        },
      });
    });

    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error upserting ai_provider_config:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Llama de forma liviana al proveedor (un request chico de texto, sin factura)
 * usando la key GUARDADA y descifrada en el server, para confirmar que
 * autentica correctamente. NUNCA devuelve la key al cliente.
 */
export async function testAiProviderConnection(
  provider: AiProvider
): Promise<{ ok: boolean; message: string }> {
  const denied = await ensureCanManageAi();
  if (denied) return { ok: false, message: denied.error };

  if (!PROVIDERS.includes(provider)) {
    return { ok: false, message: 'Proveedor inválido' };
  }

  const row = await prisma.ai_provider_config.findUnique({ where: { provider } });
  if (!row?.api_key) {
    return { ok: false, message: 'No hay API key configurada para este proveedor.' };
  }

  let apiKey: string;
  try {
    apiKey = decryptSecret(row.api_key);
  } catch {
    return { ok: false, message: 'No se pudo descifrar la API key guardada.' };
  }

  const model = row.model ?? DEFAULT_MODELS[provider];

  try {
    if (provider === 'gemini') {
      return await testGemini(apiKey, model);
    }
    return await testOpenAI(apiKey, model);
  } catch (error) {
    return {
      ok: false,
      message: `No se pudo conectar: ${
        error instanceof Error ? error.message : 'error desconocido'
      }`,
    };
  }
}

/** Request mínimo de texto a Gemini para validar la key/modelo. */
async function testGemini(
  apiKey: string,
  model: string
): Promise<{ ok: boolean; message: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'ping' }] }],
      generationConfig: { maxOutputTokens: 1 },
    }),
  });

  if (response.ok) {
    return { ok: true, message: `Conexión correcta con Gemini (${model}).` };
  }

  let detail = '';
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    detail = body.error?.message ?? '';
  } catch {
    // sin detalle
  }
  return {
    ok: false,
    message: `Gemini respondió ${response.status}${detail ? `: ${detail}` : ''}`,
  };
}

/** Request mínimo de texto a OpenAI para validar la key/modelo. */
async function testOpenAI(
  apiKey: string,
  model: string
): Promise<{ ok: boolean; message: string }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    }),
  });

  if (response.ok) {
    return { ok: true, message: `Conexión correcta con OpenAI (${model}).` };
  }

  let detail = '';
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    detail = body.error?.message ?? '';
  } catch {
    // sin detalle
  }
  return {
    ok: false,
    message: `OpenAI respondió ${response.status}${detail ? `: ${detail}` : ''}`,
  };
}
