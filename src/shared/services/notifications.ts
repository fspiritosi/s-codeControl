import { prisma } from '@/shared/lib/prisma';
import { fetchCurrentUser } from '@/shared/actions/auth';

export interface CreateNotificationInput {
  /** Código de notification_types (ej. "purchase_orders.pending_approval"). */
  typeCode: string;
  companyId: string;
  /** Variables para resolver title/description/link templates ({{var}}). */
  metadata?: Record<string, string | number | null | undefined>;
  /** Si se especifica, se usa para deduplicar (UNIQUE en DB). */
  dedupeKey?: string;
  /**
   * IDs explícitos de profile destinatarios. Si se omite, se calcula a partir
   * del required_permission_code del notification_type (todos los usuarios de
   * la empresa que tengan ese permiso).
   */
  recipientProfileIds?: string[];
  /**
   * IDs a excluir del fan-out automático (ej. el usuario que disparó el evento
   * no debería notificarse a sí mismo).
   */
  excludeProfileIds?: string[];
}

const TEMPLATE_VAR = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

function renderTemplate(
  template: string | null | undefined,
  vars: Record<string, string | number | null | undefined>
): string | null {
  if (!template) return null;
  return template.replace(TEMPLATE_VAR, (_, key) => {
    const value = vars[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

/**
 * Crea una notificación + un notification_recipient por cada destinatario.
 *
 * Si dedupeKey está presente y ya existe una notification con esa key para
 * la misma empresa, retorna { skipped: true } sin crear nada (evita duplicar
 * notificaciones del cron diario).
 *
 * Si recipientProfileIds está vacío después de resolver permisos, no crea nada.
 *
 * Idempotente y safe-to-fail: nunca lanza al caller. Las acciones que invocan
 * este servicio no deben fallar si la notificación falla.
 */
export async function createNotification(input: CreateNotificationInput): Promise<{
  notificationId?: string;
  recipientsCount: number;
  skipped?: boolean;
  error?: string;
}> {
  try {
    // 1. Cargar el tipo de notificación.
    const type = await prisma.notification_types.findUnique({
      where: { code: input.typeCode },
    });
    if (!type) return { recipientsCount: 0, error: `Tipo no encontrado: ${input.typeCode}` };
    if (!type.is_active) return { recipientsCount: 0, skipped: true };

    // 2. Dedupe: si ya existe una notification con (company_id, dedupe_key) → skip.
    if (input.dedupeKey) {
      const existing = await prisma.notifications.findFirst({
        where: { company_id: input.companyId, dedupe_key: input.dedupeKey },
        select: { id: true },
      });
      if (existing) return { recipientsCount: 0, skipped: true, notificationId: existing.id };
    }

    // 3. Resolver destinatarios.
    let recipientIds = input.recipientProfileIds;
    if (!recipientIds || recipientIds.length === 0) {
      if (!type.required_permission_code) {
        return { recipientsCount: 0, skipped: true };
      }
      recipientIds = await resolveProfilesByPermission(
        input.companyId,
        type.required_permission_code
      );
    }

    if (input.excludeProfileIds?.length) {
      const excluded = new Set(input.excludeProfileIds);
      recipientIds = recipientIds.filter((id) => !excluded.has(id));
    }

    if (recipientIds.length === 0) {
      return { recipientsCount: 0, skipped: true };
    }

    // 4. Renderizar templates con metadata.
    const vars = input.metadata ?? {};
    const title = renderTemplate(type.title_template, vars) ?? '';
    const description = renderTemplate(type.description_template, vars);
    const link = renderTemplate(type.link_template, vars);

    // 5. Crear la notification + recipients en transacción.
    const created = await prisma.$transaction(async (tx) => {
      const n = await tx.notifications.create({
        data: {
          company_id: input.companyId,
          notification_type_code: type.code,
          title,
          description,
          category: type.category,
          metadata: vars as object,
          dedupe_key: input.dedupeKey ?? null,
          link,
        },
      });
      await tx.notification_recipients.createMany({
        data: recipientIds!.map((profile_id) => ({
          notification_id: n.id,
          profile_id,
        })),
        skipDuplicates: true,
      });
      return n;
    });

    return { notificationId: created.id, recipientsCount: recipientIds.length };
  } catch (error) {
    console.error('createNotification error:', error);
    return { recipientsCount: 0, error: String(error) };
  }
}

/**
 * Devuelve los profile_ids de los usuarios de una empresa que tienen el
 * permiso indicado, considerando user_roles + fallback legacy y al owner.
 */
async function resolveProfilesByPermission(
  companyId: string,
  permissionCode: string
): Promise<string[]> {
  const result = new Set<string>();

  // 1. Owner de la empresa: siempre recibe (acceso total).
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { owner_id: true },
  });
  if (company?.owner_id) result.add(company.owner_id);

  // 2. Usuarios con user_roles cuyos roles tengan el permiso.
  const viaUserRoles = await prisma.user_roles.findMany({
    where: {
      company_id: companyId,
      role: {
        role_permissions: {
          some: { permission: { code: permissionCode } },
        },
      },
    },
    select: { profile_id: true },
    distinct: ['profile_id'],
  });
  for (const ur of viaUserRoles) result.add(ur.profile_id);

  // 3. Fallback legacy: usuarios sin user_roles cuyo share_company_users.role
  //    referencie un rol con ese permiso.
  const profilesAlready = Array.from(result);
  const viaLegacy = await prisma.share_company_users.findMany({
    where: {
      company_id: companyId,
      profile_id: { not: null, notIn: profilesAlready.length ? profilesAlready : undefined },
      role: { not: null },
      role_rel: {
        role_permissions: {
          some: { permission: { code: permissionCode } },
        },
      },
    },
    select: { profile_id: true },
    distinct: ['profile_id'],
  });
  for (const s of viaLegacy) {
    if (s.profile_id) result.add(s.profile_id);
  }

  return Array.from(result);
}

// ============================================================
// LECTURA / ESTADO
// ============================================================

export interface NotificationListItem {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  link: string | null;
  created_at: Date | null;
  read_at: Date | null;
  dismissed_at: Date | null;
  metadata: Record<string, unknown>;
  type_code: string | null;
}

export async function listNotificationsForCurrentUser(options?: {
  onlyUnread?: boolean;
  companyId?: string;
  limit?: number;
}): Promise<NotificationListItem[]> {
  const user = await fetchCurrentUser();
  if (!user?.id) return [];

  const where: Record<string, unknown> = {
    profile_id: user.id,
    dismissed_at: null,
  };
  if (options?.onlyUnread) where.read_at = null;

  const notifWhere: Record<string, unknown> = {};
  if (options?.companyId) notifWhere.company_id = options.companyId;

  const rows = await prisma.notification_recipients.findMany({
    where: {
      ...where,
      notification: notifWhere,
    },
    include: { notification: true },
    orderBy: { notification: { created_at: 'desc' } },
    take: options?.limit ?? 50,
  });

  return rows.map((r) => ({
    id: r.notification.id,
    title: r.notification.title,
    description: r.notification.description,
    category: r.notification.category,
    link: r.notification.link,
    created_at: r.notification.created_at,
    read_at: r.read_at,
    dismissed_at: r.dismissed_at,
    metadata: (r.notification.metadata as Record<string, unknown>) ?? {},
    type_code: r.notification.notification_type_code,
  }));
}

export async function unreadNotificationsCountForCurrentUser(companyId?: string): Promise<number> {
  const user = await fetchCurrentUser();
  if (!user?.id) return 0;

  return prisma.notification_recipients.count({
    where: {
      profile_id: user.id,
      read_at: null,
      dismissed_at: null,
      ...(companyId ? { notification: { company_id: companyId } } : {}),
    },
  });
}

export async function markNotificationAsRead(notificationId: string): Promise<{ error: string | null }> {
  const user = await fetchCurrentUser();
  if (!user?.id) return { error: 'No autenticado' };

  try {
    await prisma.notification_recipients.updateMany({
      where: { notification_id: notificationId, profile_id: user.id, read_at: null },
      data: { read_at: new Date() },
    });
    return { error: null };
  } catch (error) {
    return { error: String(error) };
  }
}

export async function markAllNotificationsAsRead(companyId?: string): Promise<{ error: string | null }> {
  const user = await fetchCurrentUser();
  if (!user?.id) return { error: 'No autenticado' };

  try {
    await prisma.notification_recipients.updateMany({
      where: {
        profile_id: user.id,
        read_at: null,
        dismissed_at: null,
        ...(companyId ? { notification: { company_id: companyId } } : {}),
      },
      data: { read_at: new Date() },
    });
    return { error: null };
  } catch (error) {
    return { error: String(error) };
  }
}

export async function dismissNotification(notificationId: string): Promise<{ error: string | null }> {
  const user = await fetchCurrentUser();
  if (!user?.id) return { error: 'No autenticado' };

  try {
    await prisma.notification_recipients.updateMany({
      where: { notification_id: notificationId, profile_id: user.id },
      data: { dismissed_at: new Date(), read_at: new Date() },
    });
    return { error: null };
  } catch (error) {
    return { error: String(error) };
  }
}

export async function dismissAllNotifications(companyId?: string): Promise<{ error: string | null }> {
  const user = await fetchCurrentUser();
  if (!user?.id) return { error: 'No autenticado' };

  try {
    await prisma.notification_recipients.updateMany({
      where: {
        profile_id: user.id,
        dismissed_at: null,
        ...(companyId ? { notification: { company_id: companyId } } : {}),
      },
      data: { dismissed_at: new Date(), read_at: new Date() },
    });
    return { error: null };
  } catch (error) {
    return { error: String(error) };
  }
}
