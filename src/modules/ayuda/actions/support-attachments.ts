'use server';

import { Logger } from '@/shared/lib/logger';
import { taskAppClient } from '@/shared/lib/taskapp/client';
import { TaskAppError } from '@/shared/lib/taskapp/errors';
import { getReporterEmail } from './getReporterEmail';

const logger = new Logger('features/Ayuda/support-attachments');

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = /^(image\/.+|application\/pdf)$/;

export async function uploadSupportTicketAttachment(formData: FormData): Promise<{ key: string }> {
  const reporter = await getReporterEmail();
  if (!reporter) throw new Error('No hay usuario autenticado');

  const raw = formData.get('file');
  if (!(raw instanceof File)) {
    throw new Error('Archivo inválido');
  }

  if (raw.size === 0) {
    throw new Error('El archivo está vacío');
  }
  if (raw.size > MAX_BYTES) {
    throw new Error('El archivo supera los 10 MB');
  }
  if (!ALLOWED_TYPES.test(raw.type)) {
    throw new Error('Formato no permitido. Solo imagen o PDF.');
  }

  // ticket_id es opcional: cuando se envia desde el composer de un ticket
  // existente, el archivo queda en <project_slug>/ticket-<id>/. Si no, queda
  // en <project_slug>/ (caso del form de creacion del ticket).
  const rawTicketId = formData.get('ticket_id');
  const ticketId =
    typeof rawTicketId === 'string' && /^\d+$/.test(rawTicketId) ? Number(rawTicketId) : undefined;

  try {
    return await taskAppClient.uploadFile(raw, ticketId);
  } catch (error) {
    if (error instanceof TaskAppError && error.code === 'config') {
      throw new Error('El servicio de soporte no está configurado');
    }
    logger.error('Error subiendo adjunto', { data: { name: raw.name, size: raw.size, ticketId, error } });
    throw new Error('No pudimos subir el archivo. Probá de nuevo.');
  }
}

/**
 * Asocia archivos ya subidos (storage keys) a un ticket existente del reporter actual.
 * El backend valida que el reporter sea el dueno del ticket y deduplica las keys.
 */
export async function appendSupportTicketAttachments(
  ticketId: number,
  keys: string[]
): Promise<void> {
  if (keys.length === 0) return;
  const reporter = await getReporterEmail();
  if (!reporter) throw new Error('No hay usuario autenticado');

  try {
    await taskAppClient.attachToTicket(ticketId, reporter.email, keys);
  } catch (error) {
    if (error instanceof TaskAppError && error.code === 'config') {
      throw new Error('El servicio de soporte no está configurado');
    }
    logger.error('Error asociando adjuntos al ticket', {
      data: { ticketId, count: keys.length, error },
    });
    throw new Error('No pudimos adjuntar los archivos al ticket');
  }
}
