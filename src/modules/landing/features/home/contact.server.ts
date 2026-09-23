import { createHash } from 'node:crypto';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const RECIPIENT = 'ventas@codecontrol.com.ar';
const WINDOW_MS = 15 * 60 * 1000;
const MAX_BODY_BYTES = 16_384;
// Per-process safety limit. Multi-instance deployments should also rate-limit at the proxy.
const attempts = new Map<string, { count: number; expires: number }>();
const singleLine = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[^\r\n]+$/);
const schema = z
  .object({
    nombre: singleLine,
    empresa: singleLine,
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .regex(/^[^\r\n]+$/),
    interes: z.enum(['Software a medida', 'Gestión operativa', 'PyME Suite', 'Necesito orientación']),
    mensaje: z.string().trim().min(10).max(4000),
    website: z.string().max(200).optional().default(''),
  })
  .strict();

function consume(key: string, max: number) {
  const now = Date.now();
  for (const [id, entry] of attempts) if (entry.expires <= now) attempts.delete(id);
  const entry = attempts.get(key) ?? { count: 0, expires: now + WINDOW_MS };
  if (entry.count >= max) return false;
  entry.count++;
  attempts.set(key, entry);
  return true;
}

function respond(message: string, status: number) {
  return Response.json(
    { message },
    {
      status,
      headers: { 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '900' } : {}) },
    }
  );
}

async function readBody(request: Request) {
  if (!request.body) throw new Error('empty');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error('too-large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

export async function handleContact(request: Request): Promise<Response> {
  const origin = request.headers.get('origin');
  const allowed = new Set([
    new URL(request.url).origin,
    'https://www.codecontrol.com.ar',
    'https://codecontrol.com.ar',
  ]);
  if (!origin || !allowed.has(origin)) return respond('Origen no permitido.', 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return respond('Formato de consulta no válido.', 415);
  }
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES)
    return respond('La consulta es demasiado larga.', 413);
  let input: unknown;
  try {
    input = await readBody(request);
  } catch (error) {
    return respond('No pudimos leer la consulta.', error instanceof Error && error.message === 'too-large' ? 413 : 400);
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return respond('Revisá los datos. El mensaje debe tener entre 10 y 4000 caracteres.', 400);
  const data = parsed.data;
  if (data.website) return respond('No pudimos procesar la consulta.', 400);

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 465);
  if (!host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) {
    return respond('El envío no está disponible. Escribinos a ventas@codecontrol.com.ar.', 503);
  }
  const key = createHash('sha256').update(data.email.toLowerCase()).digest('hex');
  if (!consume('total', 30) || !consume(key, 3))
    return respond('Ya recibimos varios intentos. Esperá unos minutos antes de volver a enviar.', 429);

  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  try {
    const result = await transport.sendMail({
      from: { name: 'CodeControl Web', address: user },
      to: RECIPIENT,
      replyTo: { name: data.nombre, address: data.email },
      subject: `Consulta web: ${data.interes} — ${data.empresa}`,
      text: [
        'Nueva consulta desde la web de CodeControl',
        '',
        `Nombre: ${data.nombre}`,
        `Empresa: ${data.empresa}`,
        `Email: ${data.email}`,
        `Interés: ${data.interes}`,
        '',
        data.mensaje,
      ].join('\n'),
    });
    if (!result.accepted?.some((address) => String(address).toLowerCase() === RECIPIENT)) {
      return respond(
        'El servidor no aceptó el correo. Intentá nuevamente o escribinos a ventas@codecontrol.com.ar.',
        502
      );
    }
    return respond('Tu consulta fue enviada. Te responderemos al email que indicaste.', 200);
  } catch {
    // Do not expose SMTP credentials, internal hostnames or visitor details in logs/responses.
    console.error('No se pudo enviar una consulta web por SMTP.');
    return respond(
      'No pudimos confirmar el envío. Tus datos siguen en el formulario; podés reintentar o escribirnos a ventas@codecontrol.com.ar.',
      502
    );
  } finally {
    transport.close();
  }
}
