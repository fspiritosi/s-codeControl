import { cache } from 'react';
import { prisma } from '@/shared/lib/prisma';
import { getSession } from '@/shared/lib/session';

// Códigos de permiso usados en server actions y middleware.
// Mantener sincronizado con el seed (ver supabase/migrations/*_seed_permissions_*.sql).
export type PermissionCode = string;

// Roles "owner" virtuales: el dueño de la empresa siempre tiene todos los permisos
// aunque no tenga una asignación explícita en user_roles.
const OWNER_ROLE = 'owner';

/**
 * Devuelve los códigos de permiso efectivos del usuario en una empresa, como
 * unión de todos los roles asignados en user_roles.
 *
 * Si el usuario es owner_id de la empresa, devuelve TODOS los permisos del sistema
 * (acceso total) sin necesidad de tener entradas en user_roles.
 */
async function loadEffectivePermissions(profileId: string, companyId: string): Promise<string[]> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { owner_id: true },
  });

  if (company?.owner_id === profileId) {
    const all = await prisma.permissions.findMany({ select: { code: true } });
    return all.map((p) => p.code);
  }

  const rows = await prisma.role_permissions.findMany({
    where: {
      role: {
        user_roles: {
          some: { profile_id: profileId, company_id: companyId },
        },
      },
    },
    select: { permission: { select: { code: true } } },
    distinct: ['permission_id'],
  });

  if (rows.length > 0) return rows.map((r) => r.permission.code);

  // Fallback de coexistencia: usar el rol legacy en share_company_users.
  const legacy = await prisma.share_company_users.findFirst({
    where: { profile_id: profileId, company_id: companyId, role: { not: null } },
    select: { role: true },
  });
  if (!legacy?.role) return [];

  const legacyRows = await prisma.role_permissions.findMany({
    where: { role: { name: legacy.role } },
    select: { permission: { select: { code: true } } },
    distinct: ['permission_id'],
  });
  return legacyRows.map((r) => r.permission.code);
}

/**
 * Versión cacheada por request (React.cache) para evitar refetch en server components.
 */
export const getEffectivePermissions = cache(
  async (profileId: string, companyId: string): Promise<Set<string>> => {
    const codes = await loadEffectivePermissions(profileId, companyId);
    return new Set(codes);
  }
);

/**
 * Obtiene el set de permisos del usuario activo en la empresa activa.
 * Lee de la sesión (cookie actualComp + auth).
 */
export const getSessionPermissions = cache(async (): Promise<Set<string>> => {
  const session = await getSession();
  if (!session.user || !session.company) return new Set();

  // Si la sesión ya marcó al usuario como owner, todos los permisos.
  if (session.role === OWNER_ROLE) {
    const all = await prisma.permissions.findMany({ select: { code: true } });
    return new Set(all.map((p) => p.code));
  }

  return getEffectivePermissions(session.user.id, session.company.id);
});

/**
 * `true` si el usuario activo tiene el permiso indicado en la empresa activa.
 */
export async function can(permission: PermissionCode): Promise<boolean> {
  const perms = await getSessionPermissions();
  return perms.has(permission);
}

/**
 * Lanza si el usuario no tiene el permiso. Usar al inicio de mutaciones server.
 */
export async function requirePermission(permission: PermissionCode): Promise<void> {
  const allowed = await can(permission);
  if (!allowed) {
    throw new PermissionDeniedError(permission);
  }
}

export class PermissionDeniedError extends Error {
  readonly permission: PermissionCode;
  constructor(permission: PermissionCode) {
    super(`Permiso requerido: ${permission}`);
    this.name = 'PermissionDeniedError';
    this.permission = permission;
  }
}
