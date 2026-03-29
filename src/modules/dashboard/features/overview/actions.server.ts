'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { startOfDay, endOfDay, addMonths } from 'date-fns';
import { unstable_cache } from 'next/cache';

const EMPTY_COUNTS = { totalEmployees: 0, totalEquipment: 0, employeesExpiring: 0, equipmentExpiring: 0, employeesExpired: 0, equipmentExpired: 0 };

async function fetchDashboardCounts(companyId: string) {
  const today = startOfDay(new Date());
  const nextMonth = endOfDay(addMonths(new Date(), 1));

  const activeDocTypeFilter = {
    is_active: true,
    NOT: { is_it_montlhy: true } as const,
    name: { not: '' },
  };

  const [totalEmployees, totalEquipment, employeesExpiring, equipmentExpiring, employeesExpired, equipmentExpired] = await Promise.all([
    prisma.employees.count({
      where: { company_id: companyId, is_active: true },
    }),
    prisma.vehicles.count({
      where: { company_id: companyId, is_active: true },
    }),
    prisma.documents_employees.count({
      where: {
        employee: { is: { company_id: companyId, is_active: true } },
        document_type: { is: activeDocTypeFilter },
        validity: { not: null, gte: today.toISOString(), lte: nextMonth.toISOString() },
      },
    }),
    prisma.documents_equipment.count({
      where: {
        vehicle: { is: { company_id: companyId, is_active: true } },
        document_type: { is: activeDocTypeFilter },
        validity: { not: null, gte: today.toISOString(), lte: nextMonth.toISOString() },
      },
    }),
    prisma.documents_employees.count({
      where: {
        employee: { is: { company_id: companyId, is_active: true } },
        document_type: { is: activeDocTypeFilter },
        validity: { not: null, lt: today.toISOString() },
      },
    }),
    prisma.documents_equipment.count({
      where: {
        vehicle: { is: { company_id: companyId, is_active: true } },
        document_type: { is: activeDocTypeFilter },
        validity: { not: null, lt: today.toISOString() },
      },
    }),
  ]);

  return { totalEmployees, totalEquipment, employeesExpiring, equipmentExpiring, employeesExpired, equipmentExpired };
}

const getCachedCountsForCompany = (companyId: string) =>
  unstable_cache(
    () => fetchDashboardCounts(companyId),
    [`dashboard-counts-${companyId}`],
    { revalidate: 60, tags: [`dashboard-${companyId}`] }
  );

export async function getDashboardCounts() {
  const { companyId } = await getActionContext();
  if (!companyId) return EMPTY_COUNTS;
  return getCachedCountsForCompany(companyId)();
}
