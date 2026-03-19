'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { startOfDay, endOfDay, addMonths } from 'date-fns';

export async function getDashboardCounts() {
  const { companyId } = await getActionContext();
  if (!companyId) {
    return { totalEmployees: 0, totalEquipment: 0, employeesExpiring: 0, equipmentExpiring: 0, employeesExpired: 0, equipmentExpired: 0 };
  }

  const today = startOfDay(new Date());
  const nextMonth = endOfDay(addMonths(new Date(), 1));

  const activeDocTypeFilter = {
    is_active: true,
    NOT: { is_it_montlhy: true } as const,
    name: { not: '' },
  };

  const [totalEmployees, totalEquipment, employeesExpiring, equipmentExpiring, employeesExpired, equipmentExpired] = await Promise.all([
    // Total active employees
    prisma.employees.count({
      where: { company_id: companyId, is_active: true },
    }),
    // Total active equipment
    prisma.vehicles.count({
      where: { company_id: companyId, is_active: true },
    }),
    // Employee docs expiring in next 30 days (validity between today and nextMonth)
    prisma.documents_employees.count({
      where: {
        employee: { is: { company_id: companyId, is_active: true } },
        document_type: { is: activeDocTypeFilter },
        validity: { not: null, gte: today.toISOString(), lte: nextMonth.toISOString() },
      },
    }),
    // Equipment docs expiring in next 30 days
    prisma.documents_equipment.count({
      where: {
        vehicle: { is: { company_id: companyId, is_active: true } },
        document_type: { is: activeDocTypeFilter },
        validity: { not: null, gte: today.toISOString(), lte: nextMonth.toISOString() },
      },
    }),
    // Employee docs already expired (validity < today)
    prisma.documents_employees.count({
      where: {
        employee: { is: { company_id: companyId, is_active: true } },
        document_type: { is: activeDocTypeFilter },
        validity: { not: null, lt: today.toISOString() },
      },
    }),
    // Equipment docs already expired
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
