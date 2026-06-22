import 'server-only';

import {
  ExtractedInvoiceSchema,
  type ExtractedInvoice,
  type ExtractionFileInput,
} from './types';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Esperas (ms) entre reintentos ante respuestas de servicio saturado
 * (503 UNAVAILABLE / 429 RESOURCE_EXHAUSTED). El nº de elementos define el
 * máximo de reintentos: tras `RETRY_DELAYS_MS.length` esperas fallidas, se
 * propaga el error.
 */
const RETRY_DELAYS_MS = [1500, 3000, 5000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Opciones de ejecución del provider (resueltas desde la config activa). */
export interface GeminiProviderOptions {
  apiKey: string;
  model: string;
}

/**
 * Schema de respuesta en el subset de OpenAPI que acepta Gemini
 * (`responseSchema`). Los `type` van en MAYÚSCULAS y `nullable: true` permite
 * que la AI devuelva `null` cuando un dato no aparece en el comprobante.
 *
 * Verificado contra el endpoint real (gemini-2.5-flash) con un archivo de
 * prueba: devuelve 200 y JSON válido respetando este shape.
 */
const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    razon_social: { type: 'STRING', nullable: true },
    cuit: { type: 'STRING', nullable: true },
    voucher_type: { type: 'STRING', nullable: true },
    point_of_sale: { type: 'STRING', nullable: true },
    number: { type: 'STRING', nullable: true },
    issue_date: { type: 'STRING', nullable: true },
    due_date: { type: 'STRING', nullable: true },
    cae: { type: 'STRING', nullable: true },
    total: { type: 'NUMBER', nullable: true },
    lines: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          description: { type: 'STRING', nullable: true },
          quantity: { type: 'NUMBER', nullable: true },
          unit_cost: { type: 'NUMBER', nullable: true },
          vat_rate: { type: 'NUMBER', nullable: true },
        },
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
} as const;

export const EXTRACTION_PROMPT = `Sos un asistente experto en facturas de compra argentinas (comprobantes AFIP).
Analizá el comprobante adjunto (factura, nota de crédito, nota de débito o recibo) y extraé los siguientes datos.

Devolvé SOLO un objeto JSON con estos campos. Si un dato no aparece en el comprobante, devolvé null (no inventes datos):

- razon_social: razón social o nombre del EMISOR del comprobante (el proveedor / vendedor), NO del receptor.
- cuit: CUIT del emisor (proveedor), solo los dígitos o con guiones, tal como aparece.
- voucher_type: tipo de comprobante. Usá EXACTAMENTE uno de estos valores según corresponda:
  "FACTURA_A", "FACTURA_B", "FACTURA_C",
  "NOTA_CREDITO_A", "NOTA_CREDITO_B", "NOTA_CREDITO_C",
  "NOTA_DEBITO_A", "NOTA_DEBITO_B", "NOTA_DEBITO_C",
  "RECIBO".
  La letra (A/B/C) suele estar en un recuadro destacado junto al tipo de comprobante (ej. "FACTURA" + "A").
- point_of_sale: punto de venta, los primeros dígitos del número de comprobante (ej. en "0001-00001234" es "0001"). Solo los dígitos.
- number: número del comprobante, la segunda parte luego del guión (ej. en "0001-00001234" es "00001234"). Solo los dígitos.
- issue_date: fecha de emisión en formato YYYY-MM-DD.
- due_date: fecha de vencimiento del comprobante en formato YYYY-MM-DD, si existe.
- cae: número de CAE / CAEA del comprobante, si aparece.
- total: importe total del comprobante como número (sin símbolo de moneda ni separadores de miles; usá punto como separador decimal).
- lines: array con los ítems/renglones del comprobante. Por cada ítem:
  - description: descripción del producto o servicio.
  - quantity: cantidad como número.
  - unit_cost: precio unitario SIN IVA como número. Si solo figura el precio con IVA, devolvé ese valor igual.
  - vat_rate: alícuota de IVA del ítem como número (ej. 21, 10.5, 27, 0). Si no se discrimina por ítem, devolvé null.

Los importes deben ser números (no strings). Las fechas en formato YYYY-MM-DD.`;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  error?: { message?: string };
}

/**
 * Extrae los datos de una factura de compra usando Gemini (REST, sin SDK).
 *
 * La API key y el modelo se reciben por `opts` (los resuelve la capa de config
 * `getActiveAiConfig`, que lee la DB o cae a la env). Envía el archivo como
 * `inlineData` (base64) + un prompt de extracción y pide la respuesta
 * estructurada vía `responseSchema`.
 *
 * REINTENTO: si Gemini responde 503 (UNAVAILABLE) o 429 (RESOURCE_EXHAUSTED) —
 * servicio saturado / rate limit —, reintenta con backoff creciente
 * (~1.5s, 3s, 5s) hasta agotar `RETRY_DELAYS_MS`. Otros errores (4xx, parseo)
 * no se reintentan: se propagan de inmediato.
 *
 * @throws Error con mensaje claro si Gemini responde con error (tras agotar
 *   reintentos en el caso 503/429), o si la respuesta no es JSON válido / no
 *   cumple `ExtractedInvoiceSchema`.
 */
export async function extractWithGemini(
  file: ExtractionFileInput,
  opts: GeminiProviderOptions
): Promise<ExtractedInvoice> {
  const model = opts.model || DEFAULT_MODEL;
  const url = `${GEMINI_ENDPOINT}/${model}:generateContent`;

  const body = {
    contents: [
      {
        parts: [
          { inlineData: { mimeType: file.mimeType, data: file.base64 } },
          { text: EXTRACTION_PROMPT },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: GEMINI_RESPONSE_SCHEMA,
    },
  };

  let rawText = '';
  // Reintenta solo ante 503/429; cualquier otro fallo rompe el loop y propaga.
  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': opts.apiKey,
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

    const retriable = response.status === 503 || response.status === 429;
    if (retriable && attempt < RETRY_DELAYS_MS.length) {
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }

    let detail = rawText;
    try {
      const parsed = JSON.parse(rawText) as GeminiResponse;
      detail = parsed.error?.message ?? rawText;
    } catch {
      // se usa rawText tal cual
    }
    throw new Error(
      `El servicio de lectura de facturas devolvió un error (${response.status}): ${detail}`
    );
  }

  let parsed: GeminiResponse;
  try {
    parsed = JSON.parse(rawText) as GeminiResponse;
  } catch {
    throw new Error('La respuesta del servicio de lectura de facturas no es JSON válido.');
  }

  const candidate = parsed.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
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
