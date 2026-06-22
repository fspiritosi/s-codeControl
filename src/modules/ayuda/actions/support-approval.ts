'use server';

import { Logger } from '@/shared/lib/logger';
import { taskAppClient } from '@/shared/lib/taskapp/client';
import { TaskAppError } from '@/shared/lib/taskapp/errors';
import type { Ticket } from '@/shared/lib/taskapp/types';
import { getReporterEmail } from './getReporterEmail';
import { getSupportTicketById } from './support-tickets';

const logger = new Logger('features/Ayuda/support-approval');

async function assertCanApprove(ticketId: number): Promise<{ approverEmail: string; ticket: Ticket }> {
  const reporter = await getReporterEmail();
  if (!reporter) throw new Error('No hay usuario autenticado');

  const ticket = await getSupportTicketById(ticketId);
  if (!ticket) throw new Error('No tenés acceso a este ticket');

  // La autorización fina (que el email sea uno de los aprobadores del proyecto)
  // la hace el backend contra el array de aprobadores. Acá solo validamos que el
  // ticket esté en el estado correcto para aprobar.
  if (ticket.status?.slug !== 'pendiente_aprobacion') {
    throw new Error('Este ticket ya fue aprobado o rechazado por otro aprobador.');
  }

  return { approverEmail: reporter.email, ticket };
}

/**
 * Traduce el error del backend a un mensaje accionable. El caso típico es la
 * carrera entre aprobadores: el segundo recibe 400 "not pending" del server.
 */
function approvalError(error: unknown, fallback: string): Error {
  if (
    error instanceof TaskAppError &&
    error.status === 400 &&
    error.message.includes('not pending')
  ) {
    return new Error('Este ticket ya fue aprobado o rechazado por otro aprobador.');
  }
  return new Error(fallback);
}

/**
 * Lista completa (sin paginar) de tickets visibles para el aprobador. Usada para
 * chequeos de pertenencia (acceso al detalle). Si el usuario no es aprobador,
 * el backend responde 403 y devolvemos lista vacía.
 */
export async function getTicketsForApprover(): Promise<Ticket[]> {
  const reporter = await getReporterEmail();
  if (!reporter) return [];
  try {
    return (await taskAppClient.listTicketsForApprover(reporter.email)).tickets;
  } catch (error) {
    logger.warn('No se pudo listar tickets del aprobador', {
      data: { user: reporter.email, error },
    });
    return [];
  }
}

export interface ApproverTicketsPage {
  tickets: Ticket[];
  total: number;
}

/**
 * Página de tickets del proyecto para la vista auditora del aprobador
 * (server-side, más recientes primero).
 */
export async function getApproverTicketsPage(page: number, pageSize: number): Promise<ApproverTicketsPage> {
  const reporter = await getReporterEmail();
  if (!reporter) return { tickets: [], total: 0 };
  try {
    const { tickets, total } = await taskAppClient.listTicketsForApprover(reporter.email, {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return { tickets, total };
  } catch (error) {
    logger.warn('No se pudo listar la página de tickets del aprobador', {
      data: { user: reporter.email, page, error },
    });
    return { tickets: [], total: 0 };
  }
}

/**
 * Tickets pendientes de aprobación del cliente (bandeja del aprobador y gate
 * del banner de aprobación en el detalle).
 */
export async function getPendingApproverTickets(): Promise<Ticket[]> {
  const reporter = await getReporterEmail();
  if (!reporter) return [];
  try {
    const { tickets } = await taskAppClient.listTicketsForApprover(reporter.email, {
      status: 'pendiente_aprobacion',
      limit: 100,
    });
    return tickets;
  } catch (error) {
    logger.warn('No se pudo listar pendientes del aprobador', {
      data: { user: reporter.email, error },
    });
    return [];
  }
}

export async function approveSupportTicket(ticketId: number): Promise<Ticket> {
  const { approverEmail } = await assertCanApprove(ticketId);
  logger.info('Aprobando ticket', { data: { ticketId, approverEmail } });
  try {
    return await taskAppClient.approveTicket(ticketId, approverEmail);
  } catch (error) {
    logger.error('Error aprobando ticket', { data: { ticketId, error } });
    throw approvalError(error, 'No pudimos registrar la aprobación. Probá de nuevo.');
  }
}

export async function rejectSupportTicket(ticketId: number): Promise<Ticket> {
  const { approverEmail } = await assertCanApprove(ticketId);
  logger.info('Rechazando ticket', { data: { ticketId, approverEmail } });
  try {
    return await taskAppClient.rejectTicket(ticketId, approverEmail);
  } catch (error) {
    logger.error('Error rechazando ticket', { data: { ticketId, error } });
    throw approvalError(error, 'No pudimos registrar el rechazo. Probá de nuevo.');
  }
}
