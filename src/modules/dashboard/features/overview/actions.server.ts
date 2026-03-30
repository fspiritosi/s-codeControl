'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { startOfDay, endOfDay, addMonths, startOfMonth, endOfMonth } from 'date-fns';
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

// ============================================================
// Purchasing Dashboard Counts
// ============================================================

export type PurchasingCounts = {
  ocPendingApproval: number;
  ocWithoutReceiving: number;
  invoicesPendingPayment: number;
  committedAmount: number;
};

const EMPTY_PURCHASING: PurchasingCounts = {
  ocPendingApproval: 0,
  ocWithoutReceiving: 0,
  invoicesPendingPayment: 0,
  committedAmount: 0,
};

async function fetchPurchasingDashboardCounts(companyId: string): Promise<PurchasingCounts> {
  const [ocPendingApproval, ocWithoutReceiving, invoicesPendingPayment, committedAgg] =
    await Promise.all([
      prisma.purchase_orders.count({
        where: { company_id: companyId, status: 'PENDING_APPROVAL' },
      }),
      prisma.purchase_orders.count({
        where: { company_id: companyId, status: { in: ['APPROVED', 'PARTIALLY_RECEIVED'] } },
      }),
      prisma.purchase_invoices.count({
        where: { company_id: companyId, status: { notIn: ['PAID', 'CANCELLED'] } },
      }),
      prisma.purchase_orders.aggregate({
        _sum: { total: true },
        where: {
          company_id: companyId,
          status: { in: ['PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_RECEIVED'] },
        },
      }),
    ]);

  return {
    ocPendingApproval,
    ocWithoutReceiving,
    invoicesPendingPayment,
    committedAmount: Number(committedAgg._sum.total ?? 0),
  };
}

const getCachedPurchasingCounts = (companyId: string) =>
  unstable_cache(
    () => fetchPurchasingDashboardCounts(companyId),
    [`dashboard-purchasing-${companyId}`],
    { revalidate: 60, tags: [`dashboard-purchasing-${companyId}`] }
  );

export async function getDashboardPurchasingCounts(): Promise<PurchasingCounts> {
  const { companyId } = await getActionContext();
  if (!companyId) return EMPTY_PURCHASING;
  return getCachedPurchasingCounts(companyId)();
}

// ============================================================
// Warehouse Dashboard Counts
// ============================================================

export type WarehouseCounts = {
  productsLowStock: number;
  ormPending: number;
  movementsThisMonth: number;
};

const EMPTY_WAREHOUSE: WarehouseCounts = {
  productsLowStock: 0,
  ormPending: 0,
  movementsThisMonth: 0,
};

async function fetchWarehouseDashboardCounts(companyId: string): Promise<WarehouseCounts> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [lowStockResult, ormPending, movementsThisMonth] = await Promise.all([
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT p.id) as count
      FROM products p
      JOIN warehouse_stocks ws ON ws.product_id = p.id
      WHERE p.company_id = ${companyId}::uuid
        AND p.track_stock = true
        AND p.status = 'ACTIVE'
        AND p.min_stock > 0
        AND ws.quantity < p.min_stock
    `,
    prisma.withdrawal_orders.count({
      where: {
        company_id: companyId,
        status: { in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'] },
      },
    }),
    prisma.stock_movements.count({
      where: {
        company_id: companyId,
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
  ]);

  return {
    productsLowStock: Number(lowStockResult[0]?.count ?? 0),
    ormPending,
    movementsThisMonth,
  };
}

const getCachedWarehouseCounts = (companyId: string) =>
  unstable_cache(
    () => fetchWarehouseDashboardCounts(companyId),
    [`dashboard-warehouse-${companyId}`],
    { revalidate: 60, tags: [`dashboard-warehouse-${companyId}`] }
  );

export async function getDashboardWarehouseCounts(): Promise<WarehouseCounts> {
  const { companyId } = await getActionContext();
  if (!companyId) return EMPTY_WAREHOUSE;
  return getCachedWarehouseCounts(companyId)();
}

// ============================================================
// Supplier Dashboard Counts
// ============================================================

export type SupplierCounts = {
  activeSuppliers: number;
  creditExceeded: number;
};

const EMPTY_SUPPLIERS: SupplierCounts = {
  activeSuppliers: 0,
  creditExceeded: 0,
};

async function fetchSupplierDashboardCounts(companyId: string): Promise<SupplierCounts> {
  const [activeSuppliers, creditResult] = await Promise.all([
    prisma.suppliers.count({
      where: { company_id: companyId, status: 'ACTIVE' },
    }),
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM suppliers s
      WHERE s.company_id = ${companyId}::uuid
        AND s.status = 'ACTIVE'
        AND s.credit_limit IS NOT NULL
        AND s.credit_limit > 0
        AND (
          SELECT COALESCE(SUM(po.total), 0)
          FROM purchase_orders po
          WHERE po.supplier_id = s.id
            AND po.status IN ('PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_RECEIVED')
        ) > s.credit_limit
    `,
  ]);

  return {
    activeSuppliers,
    creditExceeded: Number(creditResult[0]?.count ?? 0),
  };
}

const getCachedSupplierCounts = (companyId: string) =>
  unstable_cache(
    () => fetchSupplierDashboardCounts(companyId),
    [`dashboard-suppliers-${companyId}`],
    { revalidate: 60, tags: [`dashboard-suppliers-${companyId}`] }
  );

export async function getDashboardSupplierCounts(): Promise<SupplierCounts> {
  const { companyId } = await getActionContext();
  if (!companyId) return EMPTY_SUPPLIERS;
  return getCachedSupplierCounts(companyId)();
}
