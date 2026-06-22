'use server';

import { Logger } from '@/shared/lib/logger';
import { taskAppClient } from '@/shared/lib/taskapp/client';
import { TaskAppError } from '@/shared/lib/taskapp/errors';
import type { Ticket } from '@/shared/lib/taskapp/types';
import { getReporterEmail } from './getReporterEmail';
import { getSupportTicketById } from './support-tickets';

const logger = new Logger('features/Ayuda/support-reopen');

const TERMINAL_STATUSES = new Set(['resolved', 'done', 'closed']);

/**
 * Solicita la reapertura de un ticket cerrado.
 * Solo el reporter del ticket puede solicitar.
 */
export async function requestSupportTicketReopen(
  ticketId: number,
  reason: string,
  attachmentKeys: string[]
): Promise<Ticket> {
  const reporter = await getReporterEmail();
  if (!reporter) throw new Error('No hay usuario autenticado');

  const ticket = await getSupportTicketById(ticketId);
  if (!ticket) throw new Error('No tenés acceso a este ticket');

  if (ticket.reporter_email !== reporter.email) {
    logger.warn('Usuario no es el reporter del ticket', {
      data: { ticketId, user: reporter.email, reporter: ticket.reporter_email },
    });
    throw new Error('Solo el reporter original puede solicitar reapertura');
  }

  if (!ticket.status || !TERMINAL_STATUSES.has(ticket.status.slug)) {
    throw new Error('Solo se pueden reabrir tickets resueltos o cerrados');
  }
  if (ticket.reopen_status === 'pending') {
    throw new Error('Ya hay una solicitud de reapertura pendiente para este ticket');
  }

  const trimmed = reason.trim();
  if (trimmed.length < 20 || trimmed.length > 2000) {
    throw new Error('La justificación debe tener entre 20 y 2000 caracteres');
  }
  if (attachmentKeys.length > 3) {
    throw new Error('Máximo 3 adjuntos');
  }

  logger.info('Solicitando reapertura', {
    data: { ticketId, reporterEmail: reporter.email, keysCount: attachmentKeys.length },
  });

  try {
    return await taskAppClient.requestTicketReopen(ticketId, reporter.email, trimmed, attachmentKeys);
  } catch (error) {
    if (error instanceof TaskAppError && error.code === 'config') {
      throw new Error('El servicio de soporte no está configurado');
    }
    logger.error('Error solicitando reapertura', { data: { ticketId, error } });
    throw new Error('No pudimos enviar tu solicitud. Probá de nuevo en unos minutos.');
  }
}
