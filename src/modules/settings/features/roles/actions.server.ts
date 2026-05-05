'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { requirePermission } from '@/shared/lib/permissions';
import { revalidatePath } from 'next/cache';

// ============================================================
// QUERIES
// ============================================================

export interface RoleSummary {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  company_id: string | null;
  permissions_count: number;
}

/**
 * Devuelve los roles disponibles para la empresa actual:
 *   - todos los roles de sistema (company_id NULL)
 *   - los roles custom de la empresa actual
 */
export async function listRolesForCompany(): Promise<RoleSummary[]> {
  await requirePermission('roles.view');
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const rows = await prisma.roles.findMany({
    where: {
      OR: [{ company_id: null }, { company_id: companyId }],
    },
    orderBy: [{ is_system: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { role_permissions: true } } },
  });

  return rows.map((r) => ({
    id: r.id.toString(),
    name: r.name,
    description: r.description ?? null,
    is_system: r.is_system,
    is_active: r.is_active ?? true,
    company_id: r.company_id ?? null,
    permissions_count: r._count.role_permissions,
  }));
}

export interface RoleDetail extends RoleSummary {
  permission_codes: string[];
}

export async function getRoleDetail(roleId: string): Promise<RoleDetail | null> {
  await requirePermission('roles.view');
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  const id = BigInt(roleId);
  const role = await prisma.roles.findFirst({
    where: {
      id,
      OR: [{ company_id: null }, { company_id: companyId }],
    },
    include: {
      role_permissions: { include: { permission: { select: { code: true } } } },
    },
  });
  if (!role) return null;

  return {
    id: role.id.toString(),
    name: role.name,
    description: role.description ?? null,
    is_system: role.is_system,
    is_active: role.is_active ?? true,
    company_id: role.company_id ?? null,
    permissions_count: role.role_permissions.length,
    permission_codes: role.role_permissions.map((rp) => rp.permission.code),
  };
}

export interface PermissionItem {
  code: string;
  module: string | null;
  action: string;
  description: string | null;
}

export async function listAllPermissions(): Promise<PermissionItem[]> {
  await requirePermission('roles.view');
  const rows = await prisma.permissions.findMany({
    orderBy: [{ module: 'asc' }, { action: 'asc' }],
  });
  return rows.map((p) => ({
    code: p.code,
    module: p.module,
    action: p.action,
    description: p.description,
  }));
}

// ============================================================
// MUTATIONS — ROLES
// ============================================================

export async function createCustomRole(input: {
  name: string;
  description?: string;
  permission_codes: string[];
}) {
  try {
    await requirePermission('roles.create');
    const { companyId } = await getActionContext();
    if (!companyId) return { data: null, error: 'No company selected' };

    const name = input.name.trim();
    if (!name) return { data: null, error: 'El nombre es requerido' };

    // El campo name es UNIQUE global; prefijar con companyId acotado evita
    // colisiones entre empresas pero mantiene un name humano. La UI mostrará
    // el nombre limpio (sin prefijo).
    const existing = await prisma.roles.findFirst({
      where: { name, OR: [{ company_id: null }, { company_id: companyId }] },
      select: { id: true },
    });
    if (existing) {
      return { data: null, error: 'Ya existe un rol con ese nombre en esta empresa' };
    }

    // Buscar IDs de los permisos solicitados (ignora códigos inexistentes)
    const perms = await prisma.permissions.findMany({
      where: { code: { in: input.permission_codes } },
      select: { id: true },
    });

    const role = await prisma.roles.create({
      data: {
        name,
        description: input.description?.trim() || null,
        is_system: false,
        is_active: true,
        company_id: companyId,
        role_permissions: {
          create: perms.map((p) => ({ permission_id: p.id })),
        },
      },
    });

    revalidatePath('/dashboard/settings');
    return { data: { id: role.id.toString() }, error: null };
  } catch (error) {
    console.error('Error creating role:', error);
    return { data: null, error: String(error) };
  }
}

export async function updateCustomRole(
  roleId: string,
  input: { name: string; description?: string; permission_codes: string[] }
) {
  try {
    await requirePermission('roles.update');
    const { companyId } = await getActionContext();
    if (!companyId) return { error: 'No company selected' };

    const id = BigInt(roleId);
    const role = await prisma.roles.findFirst({
      where: { id, company_id: companyId, is_system: false },
      select: { id: true },
    });
    if (!role) return { error: 'Rol no encontrado o no editable' };

    const name = input.name.trim();
    if (!name) return { error: 'El nombre es requerido' };

    // Detectar colisión de nombre con otro rol distinto
    const collision = await prisma.roles.findFirst({
      where: {
        name,
        id: { not: id },
        OR: [{ company_id: null }, { company_id: companyId }],
      },
      select: { id: true },
    });
    if (collision) return { error: 'Ya existe otro rol con ese nombre' };

    const perms = await prisma.permissions.findMany({
      where: { code: { in: input.permission_codes } },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.roles.update({
        where: { id },
        data: {
          name,
          description: input.description?.trim() || null,
          updated_at: new Date(),
        },
      }),
      prisma.role_permissions.deleteMany({ where: { role_id: id } }),
      prisma.role_permissions.createMany({
        data: perms.map((p) => ({ role_id: id, permission_id: p.id })),
        skipDuplicates: true,
      }),
    ]);

    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error updating role:', error);
    return { error: String(error) };
  }
}

export async function deleteCustomRole(roleId: string) {
  try {
    await requirePermission('roles.delete');
    const { companyId } = await getActionContext();
    if (!companyId) return { error: 'No company selected' };

    const id = BigInt(roleId);
    const role = await prisma.roles.findFirst({
      where: { id, company_id: companyId, is_system: false },
      select: { id: true },
    });
    if (!role) return { error: 'Rol no encontrado o no eliminable' };

    // user_roles se borra en cascada por la FK ON DELETE CASCADE.
    await prisma.roles.delete({ where: { id } });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error deleting role:', error);
    return { error: String(error) };
  }
}

// ============================================================
// MUTATIONS — ASIGNACIÓN A USUARIOS
// ============================================================

export interface CompanyUserWithRoles {
  profile_id: string;
  email: string | null;
  fullname: string | null;
  legacy_role: string | null; // share_company_users.role
  role_ids: string[];         // user_roles.role_id (string para JSON)
}

export async function listCompanyUsersWithRoles(): Promise<CompanyUserWithRoles[]> {
  await requirePermission('roles.assign');
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  // Usuarios vinculados a la empresa por share_company_users (incluye al owner).
  const shares = await prisma.share_company_users.findMany({
    where: { company_id: companyId, profile_id: { not: null } },
    include: { profile: { select: { id: true, email: true, fullname: true } } },
    distinct: ['profile_id'],
  });

  if (shares.length === 0) return [];

  const profileIds = shares.map((s) => s.profile_id!).filter(Boolean);

  const userRoles = await prisma.user_roles.findMany({
    where: { company_id: companyId, profile_id: { in: profileIds } },
    select: { profile_id: true, role_id: true },
  });

  const byProfile = new Map<string, string[]>();
  for (const ur of userRoles) {
    const arr = byProfile.get(ur.profile_id) ?? [];
    arr.push(ur.role_id.toString());
    byProfile.set(ur.profile_id, arr);
  }

  return shares.map((s) => ({
    profile_id: s.profile_id!,
    email: s.profile?.email ?? null,
    fullname: s.profile?.fullname ?? null,
    legacy_role: s.role,
    role_ids: byProfile.get(s.profile_id!) ?? [],
  }));
}

/**
 * Reemplaza el set de roles asignados a un usuario en la empresa actual.
 * Sólo permite asignar roles del catálogo de la empresa (sistema + custom).
 */
export async function setUserRoles(profileId: string, roleIds: string[]) {
  try {
    await requirePermission('roles.assign');
    const { companyId } = await getActionContext();
    if (!companyId) return { error: 'No company selected' };

    // Verificar que el usuario pertenece a la empresa
    const share = await prisma.share_company_users.findFirst({
      where: { profile_id: profileId, company_id: companyId },
      select: { id: true },
    });
    if (!share) return { error: 'El usuario no pertenece a esta empresa' };

    const validRoles = await prisma.roles.findMany({
      where: {
        id: { in: roleIds.map((r) => BigInt(r)) },
        OR: [{ company_id: null }, { company_id: companyId }],
      },
      select: { id: true },
    });
    const validIds = validRoles.map((r) => r.id);

    await prisma.$transaction([
      prisma.user_roles.deleteMany({
        where: { profile_id: profileId, company_id: companyId },
      }),
      prisma.user_roles.createMany({
        data: validIds.map((roleId) => ({
          profile_id: profileId,
          company_id: companyId,
          role_id: roleId,
        })),
        skipDuplicates: true,
      }),
    ]);

    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error setting user roles:', error);
    return { error: String(error) };
  }
}
