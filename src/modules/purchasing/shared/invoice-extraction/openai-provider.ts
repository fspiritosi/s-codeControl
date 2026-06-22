import 'server-only';

import {
  ExtractedInvoiceSchema,
  type ExtractedInvoice,
  type ExtractionFileInput,
} from './types';
import { EXTRACTION_PROMPT } from './gemini-provider';

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Esperas (ms) entre reintentos ante respuestas de servicio saturado
 * (429 rate limit / 503 service unavailable). El nº de elementos define el
 * máximo de reintentos.
 */
const RETRY_DELAYS_MS = [1500, 3000, 5000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Opciones de ejecución del provider (resueltas desde la config activa). */
export interface OpenAiProviderOptions {
  apiKey: string;
  model: string;
}

/**
 * `json_schema` de OpenAI (subset de JSON Schema). A diferencia de Gemini, los
 * `type` van en minúsculas y los campos opcionales se expresan como union con
 * `"null"`. `strict: true` exige que el modelo respete el shape exactamente.
 */
const OPENAI_RESPONSE_SCHEMA = {
  name: 'extracted_invoice',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      razon_social: { type: ['string', 'null'] },
      cuit: { type: ['string', 'null'] },
      voucher_type: { type: ['string', 'null'] },
      point_of_sale: { type: ['string', 'null'] },
      number: { type: ['string', 'null'] },
      issue_date: { type: ['string', 'null'] },
      due_date: { type: ['string', 'null'] },
      cae: { type: ['string', 'null'] },
      total: { type: ['number', 'null'] },
      lines: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            description: { type: ['string', 'null'] },
            quantity: { type: ['number', 'null'] },
            unit_cost: { type: ['number', 'null'] },
            vat_rate: { type: ['number', 'null'] },
          },
          required: ['description', 'quantity', 'unit_cost', 'vat_rate'],
        },
      },
    },
    required: [
      'razon_social',
      'cuit',
      'voucher_type',
      'point_of_sale',
      'number',
      'issue_date',
      'due_date',
      'cae',
      'total',
      'lines',
    ],
  },
} as const;

interface OpenAiResponse {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string;
  }>;
  error?: { message?: string };
}

/**
 * Extrae los datos de una factura de compra usando OpenAI Chat Completions
 * (REST, sin SDK). El archivo se envía como `image_url` con data URL
 * (`data:${mimeType};base64,${base64}`) + el prompt de extracción compartido,
 * y se pide la salida estructurada con `response_format: json_schema`.
 *
 * LIMITACIÓN: el endpoint de chat NO acepta PDF como `image_url`. Si el archivo
 * es `application/pdf`, se lanza un Error claro pidiendo usar Gemini o una
 * imagen.
 *
 * REINTENTO: ante 429 (rate limit) o 503 (unavailable) reintenta con backoff
 * creciente (~1.5s, 3s, 5s). Otros errores se propagan de inmediato.
 *
 * @throws Error si el archivo es PDF, si OpenAI responde con error (tras agotar
 *   reintentos en 429/503), o si la respuesta no es JSON válido / no cumple
 *   `ExtractedInvoiceSchema`.
 */
export async function extractWithOpenAI(
  file: ExtractionFileInput,
  opts: OpenAiProviderOptions
): Promise<ExtractedInvoice> {
  if (file.mimeType === 'application/pdf') {
    throw new Error(
      'OpenAI no soporta PDF directamente; usá Gemini para PDFs o subí una imagen (JPG/PNG).'
    );
  }

  const model = opts.model || DEFAULT_MODEL;
  const dataUrl = `data:${file.mimeType};base64,${file.base64}`;

  const body = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: EXTRACTION_PROMPT },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: OPENAI_RESPONSE_SCHEMA,
    },
  };

  let rawText = '';
  // Reintenta solo ante 429/503; cualquier otro fallo rompe el loop y propaga.
  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new Error(
        `No se pudo conectar con el servicio de lectura de facturas: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`
      );
    }

    rawText = await response.text();

    if (response.ok) {
      break;
    }

    const retriable = response.status === 429 || response.status === 503;
    if (retriable && attempt < RETRY_DELAYS_MS.length) {
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }

    let detail = rawText;
    try {
      const parsed = JSON.parse(rawText) as OpenAiResponse;
      detail = parsed.error?.message ?? rawText;
    } catch {
      // se usa rawText tal cual
    }
    throw new Error(
      `El servicio de lectura de facturas devolvió un error (${response.status}): ${detail}`
    );
  }

  let parsed: OpenAiResponse;
  try {
    parsed = JSON.parse(rawText) as OpenAiResponse;
  } catch {
    throw new Error('La respuesta del servicio de lectura de facturas no es JSON válido.');
  }

  const text = parsed.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('El servicio de lectura de facturas no devolvió ningún dato extraído.');
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Los datos extraídos de la factura no tienen un formato JSON válido.');
  }

  const result = ExtractedInvoiceSchema.safeParse(json);
  if (!result.success) {
    throw new Error('Los datos extraídos de la factura no tienen el formato esperado.');
  }

  return result.data;
}
