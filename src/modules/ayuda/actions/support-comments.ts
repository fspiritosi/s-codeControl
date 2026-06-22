'use server';

import { Logger } from '@/shared/lib/logger';
import { taskAppClient } from '@/shared/lib/taskapp/client';
import { TaskAppError } from '@/shared/lib/taskapp/errors';
import type { Comment } from '@/shared/lib/taskapp/types';
import type { CreateSupportCommentInput } from '../types';
import { getReporterEmail } from './getReporterEmail';
import { getSupportTicketById } from './support-tickets';

const logger = new Logger('features/Ayuda/support-comments');

export async function listSupportTicketComments(ticketId: number): Promise<Comment[]> {
  const ticket = await getSupportTicketById(ticketId);
  if (!ticket) {
    logger.warn('listSupportTicketComments sin acceso', { data: { ticketId } });
    return [];
  }

  try {
    const all = await taskAppClient.listComments(ticketId);
    return all.filter((c) => !c.is_internal);
  } catch (error) {
    logger.error('Error listando comentarios', { data: { ticketId, error } });
    return [];
  }
}

export async function createSupportTicketComment(input: CreateSupportCommentInput): Promise<Comment> {
  const reporter = await getReporterEmail();
  if (!reporter) {
    logger.warn('createSupportTicketComment sin usuario autenticado');
    throw new Error('No hay usuario autenticado');
  }

  const ticket = await getSupportTicketById(input.ticketId);
  if (!ticket) {
    throw new Error('No tenés acceso a este ticket');
  }

  const body = input.body.trim();
  if (body.length === 0) {
    throw new Error('El comentario no puede estar vacío');
  }
  if (body.length > 5000) {
    throw new Error('El comentario no puede superar los 5000 caracteres');
  }

  try {
    return await taskAppClient.createComment(input.ticketId, {
      body,
      author_email: reporter.email,
    });
  } catch (error) {
    if (error instanceof TaskAppError && error.code === 'config') {
      throw new Error('El servicio de soporte no está configurado');
    }
    logger.error('Error creando comentario', { data: { ticketId: input.ticketId, error } });
    throw new Error('No pudimos enviar tu comentario. Probá de nuevo.');
  }
}
