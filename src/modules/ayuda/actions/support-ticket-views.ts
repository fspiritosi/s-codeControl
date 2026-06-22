'use server';

import { prisma } from '@/shared/lib/prisma';
import { Logger } from '@/shared/lib/logger';
import { getReporterEmail } from './getReporterEmail';
import { getSupportTicketById } from './support-tickets';

const logger = new Logger('features/Ayuda/support-ticket-views');

/**
 * Marca un ticket como leído por el usuario actual. Guarda last_seen_at = now
 * y last_seen_status_id = status actual del ticket en TaskApp.
 * Idempotente: si ya existía una view, la actualiza.
 */
export async function markSupportTicketAsRead(taskappTicketId: number): Promise<void> {
  try {
    const reporter = await getReporterEmail();
    if (!reporter) {
      logger.warn('No authenticated user, skipping markAsRead');
      return;
    }

    const ticket = await getSupportTicketById(taskappTicketId);
    if (!ticket) {
      logger.warn('Ticket not found in TaskApp', { data: { taskappTicketId } });
      return;
    }

    const now = new Date();
    await prisma.support_ticket_views.upsert({
      where: {
        user_id_taskapp_ticket_id: {
          user_id: reporter.userId,
          taskapp_ticket_id: BigInt(taskappTicketId),
        },
      },
      create: {
        user_id: reporter.userId,
        taskapp_ticket_id: BigInt(taskappTicketId),
        last_seen_at: now,
        last_seen_status_id: BigInt(ticket.status_id),
      },
      update: {
        last_seen_at: now,
        last_seen_status_id: BigInt(ticket.status_id),
      },
    });
  } catch (error) {
    logger.error('Failed to mark ticket as read', { data: { taskappTicketId, error } });
    // No re-throw: el usuario seguirá viendo el dot hasta el próximo intento; no es crítico
  }
}
