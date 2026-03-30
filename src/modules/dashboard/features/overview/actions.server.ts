'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { startOfDay, endOfDay, addMonths } from 'date-fns';
import { unstable_cache } from 'next/cache';
import {
  checkDocumentAppliesToEmployee,
  checkDocumentAppliesToEquipment,
  type DocumentCondition,
} from '@/shared/lib/documentConditions';

const EMPTY_COUNTS = { totalEmployees: 0, totalEquipment: 0, employeesExpiring: 0, equipmentExpiring: 0, employeesExpired: 0, equipmentExpired: 0 };

/**
 * Cuenta documentos condicionales (special=true) que están vencidos o por vencer,
 * evaluando en JS si el tipo realmente aplica al empleado/equipo.
 */
async function countConditionalDocs(
  companyId: string,
  validityFilter: Record<string, any>,
  entity: 'employee' | 'equipment'
) {
  if (entity === 'employee') {
    const docs = await prisma.documents_employees.findMany({
      where: {
        employee: { is: { company_id: companyId, is_active: true } },
        document_type: {
          is: {
            is_active: true,
            NOT: { is_it_montlhy: true },
            name: { not: '' },
            special: true,
          },
        },
        validity: validityFilter,
      },
      select: {
        id: true,
        document_type: { select: { conditions: true, special: true } },
        employee: {
          select: {
            gender: true,
            type_of_contract: true,
            hierarchical_position: true,
            category_id: true,
            covenants_id: true,
            guild_id: true,
          },
        },
      },
    });

    return docs.filter((doc) => {
      const conditions = (doc.document_type?.conditions ?? []) as unknown as DocumentCondition[];
      const isConditional = doc.document_type?.special ?? false;
      return checkDocumentAppliesToEmployee(conditions, isConditional, doc.employee ?? {});
    }).length;
  } else {
    const docs = await prisma.documents_equipment.findMany({
      where: {
        vehicle: { is: { company_id: companyId, is_active: true } },
        document_type: {
          is: {
            is_active: true,
            NOT: { is_it_montlhy: true },
            name: { not: '' },
            special: true,
          },
        },
        validity: validityFilter,
      },
      select: {
        id: true,
        document_type: { select: { conditions: true, special: true } },
        vehicle: {
          select: {
            brand: true,
            type_of_vehicle: true,
          },
        },
      },
    });

    return docs.filter((doc) => {
      const conditions = (doc.document_type?.conditions ?? []) as unknown as DocumentCondition[];
      const isConditional = doc.document_type?.special ?? false;
      return checkDocumentAppliesToEquipment(conditions, isConditional, doc.vehicle ?? {});
    }).length;
  }
}

async function fetchDashboardCounts(companyId: string) {
  const today = startOfDay(new Date());
  const nextMonth = endOfDay(addMonths(new Date(), 1));

  // Para tipos NO condicionales: count directo en SQL (rapido)
  const nonConditionalFilter = {
    is_active: true,
    NOT: { is_it_montlhy: true } as const,
    name: { not: '' },
    special: false,
  };

  const expiringValidity = { not: null, gte: today.toISOString(), lte: nextMonth.toISOString() };
  const expiredValidity = { not: null, lt: today.toISOString() };

  const [
    totalEmployees,
    totalEquipment,
    empExpiringNonCond,
    eqExpiringNonCond,
    empExpiredNonCond,
    eqExpiredNonCond,
    empExpiringCond,
    eqExpiringCond,
    empExpiredCond,
    eqExpiredCond,
  ] = await Promise.all([
    prisma.employees.count({
      where: { company_id: companyId, is_active: true },
    }),
    prisma.vehicles.count({
      where: { company_id: companyId, is_active: true },
    }),
    // Non-conditional counts (SQL)
    prisma.documents_employees.count({
      where: {
        employee: { is: { company_id: companyId, is_active: true } },
        document_type: { is: nonConditionalFilter },
        validity: expiringValidity,
      },
    }),
    prisma.documents_equipment.count({
      where: {
        vehicle: { is: { company_id: companyId, is_active: true } },
        document_type: { is: nonConditionalFilter },
        validity: expiringValidity,
      },
    }),
    prisma.documents_employees.count({
      where: {
        employee: { is: { company_id: companyId, is_active: true } },
        document_type: { is: nonConditionalFilter },
        validity: expiredValidity,
      },
    }),
    prisma.documents_equipment.count({
      where: {
        vehicle: { is: { company_id: companyId, is_active: true } },
        document_type: { is: nonConditionalFilter },
        validity: expiredValidity,
      },
    }),
    // Conditional counts (JS evaluation)
    countConditionalDocs(companyId, expiringValidity, 'employee'),
    countConditionalDocs(companyId, expiringValidity, 'equipment'),
    countConditionalDocs(companyId, expiredValidity, 'employee'),
    countConditionalDocs(companyId, expiredValidity, 'equipment'),
  ]);

  return {
    totalEmployees,
    totalEquipment,
    employeesExpiring: empExpiringNonCond + empExpiringCond,
    equipmentExpiring: eqExpiringNonCond + eqExpiringCond,
    employeesExpired: empExpiredNonCond + empExpiredCond,
    equipmentExpired: eqExpiredNonCond + eqExpiredCond,
  };
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
