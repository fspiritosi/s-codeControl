import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '@/shared/lib/prisma';
import { fetchCurrentUser } from '@/shared/actions/auth';

export interface Session {
  user: { id: string; email: string } | null;
  profile: { id: string; fullname: string | null; avatar: string | null; role: string | null; email: string | null } | null;
  company: { id: string; company_name: string | null; owner_id: string | null } | null;
  role: string | null;
  modules: string[];
  permissions: string[];
  companies: any[];
  sharedCompanies: any[];
}

const EMPTY_SESSION: Session = {
  user: null,
  profile: null,
  company: null,
  role: null,
  modules: [],
  permissions: [],
  companies: [],
  sharedCompanies: [],
};

// Convierte los BigInt de un company para que JSON.stringify (usado por
// unstable_cache y por el RSC payload al cliente) no rompa con
// "Do not know how to serialize a BigInt".
function serializeCompany<T extends { city?: bigint | number | null; province_id?: bigint | number | null }>(
  c: T
): T {
  return {
    ...c,
    city: c.city != null ? Number(c.city) : c.city,
    province_id: c.province_id != null ? Number(c.province_id) : c.province_id,
  };
}

// Cacheado a nivel de request por user+companyId. Evita refetch en cada navegación
// del layout (queries se quedaban fuera del scope de React.cache entre requests).
// Invalidación implícita por cambio de companyId en cookie; revalidate de 60s para profile/companies.
const buildSessionForUser = unstable_cache(
  async (userId: string, userEmail: string, requestedCompanyId: string | undefined): Promise<Session> => {
    const [profile, companies, sharedEntries] = await Promise.all([
      prisma.profile.findUnique({
        where: { id: userId },
        select: { id: true, fullname: true, avatar: true, role: true, email: true },
      }),
      prisma.company.findMany({
        where: { owner_id: userId },
      }),
      prisma.share_company_users.findMany({
        where: { profile_id: userId },
        include: { company: true },
      }),
    ]);

    let activeCompanyId = requestedCompanyId;
    if (!activeCompanyId) {
      activeCompanyId = companies?.[0]?.id || sharedEntries?.[0]?.company_id || undefined;
    }

    let role: string | null = null;
    let modules: string[] = [];
    let permissions: string[] = [];

    if (activeCompanyId) {
      const isOwner = companies?.some((c: any) => c.id === activeCompanyId);
      if (isOwner) {
        role = 'owner';
        // Owner virtual: todos los permisos del sistema.
        const allPerms = await prisma.permissions.findMany({ select: { code: true } });
        permissions = allPerms.map((p) => p.code);
      } else {
        const shared = sharedEntries?.find(
          (e: any) => e.company_id === activeCompanyId || e.company?.id === activeCompanyId
        );
        role = shared?.role || null;
        modules = (shared?.modules as string[]) || [];

        // Unión de permisos sobre todos los roles asignados en user_roles.
        const rolePerms = await prisma.role_permissions.findMany({
          where: {
            role: {
              user_roles: {
                some: { profile_id: userId, company_id: activeCompanyId },
              },
            },
          },
          select: { permission: { select: { code: true } } },
          distinct: ['permission_id'],
        });
        permissions = rolePerms.map((r) => r.permission.code);

        // Fallback de coexistencia: si todavía no se migró a user_roles,
        // resolver permisos por el rol legacy en share_company_users.role.
        if (permissions.length === 0 && role) {
          const legacyPerms = await prisma.role_permissions.findMany({
            where: { role: { name: role } },
            select: { permission: { select: { code: true } } },
            distinct: ['permission_id'],
          });
          permissions = legacyPerms.map((r) => r.permission.code);
        }
      }
    }

    const company = activeCompanyId
      ? companies?.find((c: any) => c.id === activeCompanyId) ||
        sharedEntries?.find((e: any) => e.company_id === activeCompanyId || e.company?.id === activeCompanyId)?.company ||
        null
      : null;

    const safeCompanies = (companies || []).map(serializeCompany);
    const safeShared = (sharedEntries || []).map((e: any) => ({
      ...e,
      company: e.company ? serializeCompany(e.company) : e.company,
    }));

    return {
      user: { id: userId, email: userEmail },
      profile,
      company: company ? { id: company.id, company_name: company.company_name, owner_id: company.owner_id } : null,
      role,
      modules,
      permissions,
      companies: safeCompanies,
      sharedCompanies: safeShared,
    };
  },
  ['session-data'],
  { revalidate: 60, tags: ['session'] }
);

/**
 * Centralized session utility for server components and server actions.
 * Deduplicated per request via React.cache(); cross-request via unstable_cache (60s).
 */
export const getSession = cache(async (): Promise<Session> => {
  const user = await fetchCurrentUser();
  if (!user?.id) return EMPTY_SESSION;

  const cookiesStore = await cookies();
  const companyId = cookiesStore.get('actualComp')?.value;

  return buildSessionForUser(user.id, user.email || '', companyId);
});
