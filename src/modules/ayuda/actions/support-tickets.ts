'use server';

import { Logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { taskAppClient } from '@/shared/lib/taskapp/client';
import { TaskAppError } from '@/shared/lib/taskapp/errors';
import type { Ticket, TicketWithUnread } from '@/shared/lib/taskapp/types';
import { buildTitleWithCategory } from '../constants/categories';
import type { CreateSupportTicketInput } from '../types';
import { getReporterEmail } from './getReporterEmail';
import { listSupportTicketComments } from './support-comments';

const logger = new Logger('features/Ayuda/support-tickets');
const notifLogger = new Logger('features/Ayuda/notifications');

// Estados terminales: en ellos no esperamos respuestas nuevas de agente, así que
// se pueden omitir del fetch de comments para acotar llamadas a la API.
const RESOLVED_STATUS_SLUGS = new Set(['resolved', 'done', 'closed', 'cancelled']);

export async function createSupportTicket(input: CreateSupportTicketInput): Promise<Ticket> {
  const reporter = await getReporterEmail();
  if (!reporter) {
    logger.warn('createSupportTicket sin usuario autenticado');
    throw new Error('No hay usuario autenticado');
  }

  logger.info('Creando ticket de soporte', {
    data: { category: input.category, priority: input.priority, email: reporter.email },
  });

  let ticket: Ticket;
  try {
    ticket = await taskAppClient.createTicket({
      title: buildTitleWithCategory(input.category, input.title),
      description: input.description,
      reporter_email: reporter.email,
      reporter_name: reporter.name ?? undefined,
      priority: input.priority,
      attachments: input.attachmentKeys ?? [],
    });
  } catch (error) {
    if (error instanceof TaskAppError && error.code === 'config') {
      throw new Error('El servicio de soporte no está configurado');
    }
    logger.error('Error creando ticket', { data: { error } });
    throw new Error('No pudimos enviar tu reporte. Probá de nuevo en unos minutos.');
  }

  // Crear view inicial para que el creador no vea su propio ticket como "no leído"
  try {
    await prisma.support_ticket_views.create({
      data: {
        user_id: reporter.userId,
        taskapp_ticket_id: BigInt(ticket.id),
        last_seen_at: new Date(),
        last_seen_status_id: BigInt(ticket.status_id),
      },
    });
  } catch (error) {
    notifLogger.warn('Failed to create initial ticket view (non-fatal)', {
      data: { ticketId: ticket.id, error },
    });
  }

  return ticket;
}

export async function getMySupportTickets(): Promise<Ticket[]> {
  const reporter = await getReporterEmail();
  if (!reporter) return [];

  try {
    return (await taskAppClient.listTicketsByReporter(reporter.email)).tickets;
  } catch (error) {
    logger.error('Error listando tickets propios', { data: { error } });
    return [];
  }
}

/**
 * Retorna el ticket si el usuario logueado es reporter o approver.
 * Si no tiene acceso o el ticket no existe → null (sin throw, para que la UI
 * muestre un estado "no encontrado").
 */
export async function getSupportTicketById(id: number): Promise<Ticket | null> {
  const reporter = await getReporterEmail();
  if (!reporter) {
    logger.warn('getSupportTicketById sin usuario autenticado', { data: { id } });
    return null;
  }

  let ticket: Ticket;
  try {
    ticket = await taskAppClient.getTicketById(id);
  } catch (error) {
    logger.error('Error obteniendo ticket', { data: { id, error } });
    return null;
  }

  const isReporter = ticket.reporter_email === reporter.email;

  // ¿Es aprobador del proyecto? El listado for-approver solo devuelve este ticket
  // si el email está en el array de aprobadores (si no, 403 → []). Lo necesitamos
  // para dos cosas: autorizar a los no-reporters y decidir si puede ver las horas
  // valorizadas. Si es reporter y el ticket no tiene horas cargadas, evitamos la
  // llamada extra a la API (caso común sin nada que ocultar).
  let isApprover = false;
  if (!isReporter || ticket.estimated_hours != null) {
    try {
      const approverTickets = await taskAppClient.listTicketsForApprover(reporter.email);
      isApprover = approverTickets.tickets.some((t) => t.id === ticket.id);
    } catch {
      // no es aprobador — isApprover queda en false
    }
  }

  if (!isReporter && !isApprover) {
    logger.warn('Acceso denegado al ticket', {
      data: { id, user: reporter.email, reporter: ticket.reporter_email },
    });
    return null;
  }

  // Las horas valorizadas (estimated_hours) son información interna del proyecto:
  // solo el aprobador puede verlas. Para el resto las ocultamos en el servidor,
  // antes de que el dato salga al cliente — no basta con esconderlas en la UI.
  if (!isApprover && ticket.estimated_hours != null) {
    return { ...ticket, estimated_hours: null };
  }

  return ticket;
}

/**
 * Retorna los tickets del reporter actual enriquecidos con info de "no leído":
 * - hasStatusChange: el status actual difiere del que el usuario vio por última vez
 * - hasNewAgentComment: hay comentarios de otros (no el reporter) creados después del last_seen_at
 */
export async function getMyTicketsWithUnread(): Promise<TicketWithUnread[]> {
  const reporter = await getReporterEmail();
  if (!reporter) {
    notifLogger.warn('No authenticated user, returning empty');
    return [];
  }

  const tickets = await getMySupportTickets();
  if (tickets.length === 0) return [];

  return enrichWithUnread(tickets, reporter);
}

export interface MyTicketsPage {
  tickets: TicketWithUnread[];
  total: number;
  completed: number;
}

/**
 * Página de tickets del usuario (server-side, más recientes primero) enriquecida
 * con no-leídos. `total`/`completed` vienen del backend sin paginar, para la
 * navegación y las estadísticas.
 */
export async function getMyTicketsPageWithUnread(page: number, pageSize: number): Promise<MyTicketsPage> {
  const reporter = await getReporterEmail();
  if (!reporter) {
    notifLogger.warn('No authenticated user, returning empty page');
    return { tickets: [], total: 0, completed: 0 };
  }

  try {
    const { tickets, total, completed } = await taskAppClient.listTicketsByReporter(reporter.email, {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    const enriched = tickets.length > 0 ? await enrichWithUnread(tickets, reporter) : [];
    return { tickets: enriched, total, completed };
  } catch (error) {
    logger.error('Error listando página de tickets propios', { data: { page, error } });
    return { tickets: [], total: 0, completed: 0 };
  }
}

async function enrichWithUnread(
  tickets: Ticket[],
  reporter: NonNullable<Awaited<ReturnType<typeof getReporterEmail>>>
): Promise<TicketWithUnread[]> {
  // Views del usuario (degrada elegante si la DB falla)
  let viewsMap = new Map<number, { lastSeenAt: Date; lastSeenStatusId: bigint }>();
  try {
    const views = await prisma.support_ticket_views.findMany({
      where: {
        user_id: reporter.userId,
        taskapp_ticket_id: { in: tickets.map((t) => BigInt(t.id)) },
      },
      select: { taskapp_ticket_id: true, last_seen_at: true, last_seen_status_id: true },
    });
    viewsMap = new Map(
      views.map((v) => [
        Number(v.taskapp_ticket_id),
        { lastSeenAt: v.last_seen_at, lastSeenStatusId: v.last_seen_status_id },
      ])
    );
  } catch (error) {
    notifLogger.error('Failed to fetch ticket views from DB', { data: { error } });
    return tickets.map((t) => ({
      ...t,
      unread: { hasStatusChange: false, hasNewAgentComment: false, lastSeenAt: null },
    }));
  }

  // Identificar tickets que requieren fetch de comments.
  // NO dependemos solo de updated_at: crear un comentario en el backend NO
  // bumpea tasks.updated_at, así que filtrar por updated_at perdería las
  // respuestas nuevas de agente. Traemos comments de los tickets sin view,
  // de los actualizados, y de todos los que NO están resueltos (donde una
  // respuesta de agente es esperable). Los resueltos se omiten para acotar
  // llamadas a la API.
  const ticketsNeedingComments = tickets.filter((t) => {
    const view = viewsMap.get(t.id);
    if (!view) return true;
    if (new Date(t.updated_at) > view.lastSeenAt) return true;
    const slug = t.status?.slug;
    return !slug || !RESOLVED_STATUS_SLUGS.has(slug);
  });

  // Fetch comments en paralelo con failure aislado
  const commentsByTicket = new Map<number, Awaited<ReturnType<typeof listSupportTicketComments>>>();
  await Promise.all(
    ticketsNeedingComments.map(async (t) => {
      try {
        const comments = await listSupportTicketComments(t.id);
        commentsByTicket.set(t.id, comments);
      } catch (error) {
        notifLogger.warn('Failed to fetch comments for ticket', { data: { ticketId: t.id, error } });
        commentsByTicket.set(t.id, []);
      }
    })
  );

  return tickets.map<TicketWithUnread>((t) => {
    const view = viewsMap.get(t.id);
    const lastSeenAt = view?.lastSeenAt ?? null;
    const lastSeenStatusId = view?.lastSeenStatusId ?? null;

    const hasStatusChange =
      lastSeenStatusId !== null && BigInt(t.status_id) !== lastSeenStatusId;

    const comments = commentsByTicket.get(t.id) ?? [];
    const hasNewAgentComment = comments.some(
      (c) =>
        c.author_email !== reporter.email &&
        (lastSeenAt === null || new Date(c.created_at) > lastSeenAt)
    );

    return {
      ...t,
      unread: {
        hasStatusChange,
        hasNewAgentComment,
        lastSeenAt: lastSeenAt ? lastSeenAt.toISOString() : null,
      },
    };
  });
}
