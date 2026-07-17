'use server';
import { prisma } from '@/shared/lib/prisma';
import {
  dismissAllNotifications,
  dismissNotification,
  listNotificationsForCurrentUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  unreadNotificationsCountForCurrentUser,
} from '@/shared/services/notifications';

// ============================================================
// Sistema nuevo (Fase 6) — recipientes por usuario
// ============================================================

export async function getMyNotifications(companyId?: string, onlyUnread = false) {
  return listNotificationsForCurrentUser({ companyId, onlyUnread });
}

export async function getMyUnreadCount(companyId?: string) {
  return unreadNotificationsCountForCurrentUser(companyId);
}

/**
 * Lista + contador de no leídos en un solo server action. Next serializa los
 * server actions, así que llamar getMyNotifications y getMyUnreadCount por
 * separado desde el cliente genera 2 POST secuenciales; esto los une en 1
 * (Promise.all server-side). Se usa en el badge del NavBar, presente en toda página.
 */
export async function getMyNotificationsWithCount(companyId?: string, onlyUnread = false) {
  const [list, count] = await Promise.all([
    listNotificationsForCurrentUser({ companyId, onlyUnread }),
    unreadNotificationsCountForCurrentUser(companyId),
  ]);
  return { list, count };
}

export async function markAsRead(notificationId: string) {
  return markNotificationAsRead(notificationId);
}

export async function markAllAsRead(companyId?: string) {
  return markAllNotificationsAsRead(companyId);
}

export async function dismiss(notificationId: string) {
  return dismissNotification(notificationId);
}

export async function dismissAll(companyId?: string) {
  return dismissAllNotifications(companyId);
}

// ============================================================
// Compatibilidad con UI legacy (uiStore)
// ============================================================

export const fetchNotificationsByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const notifications = await prisma.notifications.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    if (!notifications?.length) return [];

    // Collect document IDs to enrich in batch
    const docIds = notifications.map((n) => n.document_id).filter(Boolean) as string[];
    if (!docIds.length) return notifications;

    // Fetch matching documents from both tables in parallel
    const [empDocs, eqDocs] = await Promise.all([
      prisma.documents_employees.findMany({
        where: { id: { in: docIds } },
        select: {
          id: true,
          document_type: { select: { name: true } },
          employee: { select: { firstname: true, lastname: true } },
        },
      }),
      prisma.documents_equipment.findMany({
        where: { id: { in: docIds } },
        select: {
          id: true,
          document_type: { select: { name: true } },
          vehicle: { select: { domain: true, intern_number: true } },
        },
      }),
    ]);

    // Build a lookup map
    const docMap = new Map<string, { documentName: string; resource: string; id: string }>();
    for (const d of empDocs) {
      docMap.set(d.id, {
        id: d.id,
        documentName: d.document_type?.name || '',
        resource: `${d.employee?.lastname || ''} ${d.employee?.firstname || ''}`.trim(),
      });
    }
    for (const d of eqDocs) {
      docMap.set(d.id, {
        id: d.id,
        documentName: d.document_type?.name || '',
        resource: d.vehicle?.domain || d.vehicle?.intern_number || '',
      });
    }

    // Enrich notifications with document data
    return notifications.map((n) => ({
      ...n,
      document: n.document_id ? docMap.get(n.document_id) ?? null : null,
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const deleteNotificationsByCompany = async (companyId: string) => {
  if (!companyId) return { error: 'No company ID' };
  try {
    await prisma.notifications.deleteMany({
      where: { company_id: companyId },
    });
    return { error: null };
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return { error: String(error) };
  }
};
