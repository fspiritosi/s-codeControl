import { cookies } from 'next/headers';
import { prisma } from '@/shared/lib/prisma';

export interface CompanyScope {
  activeCompanyId: string;
  visibleCompanyIds: string[];
  groupId: string | null;
}

/**
 * Devuelve el scope de empresas visibles para la empresa activa.
 *
 * Si la empresa activa pertenece a un company_group, visibleCompanyIds incluye
 * a todas las empresas del grupo (incluyendo la propia). Si no, devuelve
 * solo la empresa activa.
 *
 * Casos de uso:
 *   const scope = await getCompanyScope();
 *   prisma.warehouses.findMany({ where: { company_id: { in: scope.visibleCompanyIds } } })
 *
 * Para crear, usar siempre `scope.activeCompanyId`.
 */
export async function getCompanyScope(): Promise<CompanyScope | null> {
  const cookiesStore = await cookies();
  const activeCompanyId = cookiesStore.get('actualComp')?.value;
  if (!activeCompanyId) return null;

  const company = await prisma.company.findUnique({
    where: { id: activeCompanyId },
    select: { company_group_id: true },
  });

  if (!company?.company_group_id) {
    return { activeCompanyId, visibleCompanyIds: [activeCompanyId], groupId: null };
  }

  const groupMembers = await prisma.company.findMany({
    where: { company_group_id: company.company_group_id },
    select: { id: true },
  });

  return {
    activeCompanyId,
    visibleCompanyIds: groupMembers.map((c) => c.id),
    groupId: company.company_group_id,
  };
}
