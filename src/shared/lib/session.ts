import { cache } from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/shared/lib/prisma';
import { fetchCurrentUser } from '@/shared/actions/auth';

export interface Session {
  user: { id: string; email: string } | null;
  profile: { id: string; fullname: string | null; avatar: string | null; role: string | null } | null;
  company: { id: string; company_name: string | null; owner_id: string | null } | null;
  role: string | null;
  modules: string[];
  companies: any[];
  sharedCompanies: any[];
}

const EMPTY_SESSION: Session = {
  user: null,
  profile: null,
  company: null,
  role: null,
  modules: [],
  companies: [],
  sharedCompanies: [],
};

/**
 * Centralized session utility for server components and server actions.
 * Deduplicated per request via React.cache() — calling getSession() multiple
 * times in the same render cycle only executes the queries once.
 */
export const getSession = cache(async (): Promise<Session> => {
  const user = await fetchCurrentUser();
  if (!user?.id) return EMPTY_SESSION;

  const cookiesStore = await cookies();
  const companyId = cookiesStore.get('actualComp')?.value;

  // Run all independent queries in parallel
  const [profile, companies, sharedEntries] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true, fullname: true, avatar: true, role: true },
    }),
    prisma.company.findMany({
      where: { owner_id: user.id },
    }),
    prisma.share_company_users.findMany({
      where: { profile_id: user.id },
      include: { company: true },
    }),
  ]);

  // Determine active company
  let activeCompanyId = companyId;
  if (!activeCompanyId) {
    activeCompanyId = companies?.[0]?.id || sharedEntries?.[0]?.company_id || undefined;
  }

  // Determine role + modules for active company
  let role: string | null = null;
  let modules: string[] = [];

  if (activeCompanyId) {
    const isOwner = companies?.some((c: any) => c.id === activeCompanyId);
    if (isOwner) {
      role = 'owner';
    } else {
      const shared = sharedEntries?.find(
        (e: any) => e.company_id === activeCompanyId || e.company?.id === activeCompanyId
      );
      role = shared?.role || null;
      modules = (shared?.modules as string[]) || [];
    }
  }

  // Get active company data
  const company = activeCompanyId
    ? companies?.find((c: any) => c.id === activeCompanyId) ||
      sharedEntries?.find((e: any) => e.company_id === activeCompanyId || e.company?.id === activeCompanyId)?.company ||
      null
    : null;

  return {
    user: { id: user.id, email: user.email || '' },
    profile,
    company: company ? { id: company.id, company_name: company.company_name, owner_id: company.owner_id } : null,
    role,
    modules,
    companies: companies || [],
    sharedCompanies: sharedEntries || [],
  };
});
