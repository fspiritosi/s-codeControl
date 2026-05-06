'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildDateRangeFiltersWhere,
} from '@/shared/components/common/DataTable/helpers';

export interface RetentionRow {
  id: string;
  certificate_number: string | null;
  base_amount: number;
  rate: number;
  amount: number;
  notes: string | null;
  payment_order_id: string;
  payment_order_full_number: string;
  payment_order_date: Date;
  payment_order_status: string;
  supplier: string;
  supplier_tax_id: string;
  tax_type_id: string;
  tax_type_code: string;
  tax_type_name: string;
  tax_type_jurisdiction: string | null;
}

const RETENTION_INCLUDE = {
  tax_type: { select: { id: true, code: true, name: true, jurisdiction: true } },
  payment_order: {
    select: {
      id: true,
      full_number: true,
      date: true,
      status: true,
      supplier: { select: { business_name: true, tax_id: true } },
    },
  },
} as const;

function rowToRetention(r: any): RetentionRow {
  return {
    id: r.id,
    certificate_number: r.certificate_number,
    base_amount: Number(r.base_amount),
    rate: Number(r.rate),
    amount: Number(r.amount),
    notes: r.notes,
    payment_order_id: r.payment_order.id,
    payment_order_full_number: r.payment_order.full_number,
    payment_order_date: r.payment_order.date,
    payment_order_status: r.payment_order.status,
    supplier: r.payment_order.supplier?.business_name ?? 'Sin proveedor',
    supplier_tax_id: r.payment_order.supplier?.tax_id ?? '',
    tax_type_id: r.tax_type.id,
    tax_type_code: r.tax_type.code,
    tax_type_name: r.tax_type.name,
    tax_type_jurisdiction: r.tax_type.jurisdiction,
  };
}

function buildRetentionsWhere(
  companyId: string,
  searchParams: DataTableSearchParams
): Record<string, unknown> {
  const state = parseSearchParams(searchParams);

  const orderConditions: Record<string, unknown> = { company_id: companyId };

  const taxTypeFilter = state.filters.tax_type;
  const statusFilter = state.filters.payment_order_status;

  const dateWhere = buildDateRangeFiltersWhere(state.filters, ['payment_order_date']);
  const dateFilter = (dateWhere as any).payment_order_date;
  if (dateFilter) orderConditions.date = dateFilter;
  if (statusFilter && statusFilter.length > 0) orderConditions.status = { in: statusFilter };

  const supplierFilter = state.filters.supplier?.[0];
  if (supplierFilter) {
    orderConditions.supplier = {
      business_name: { contains: supplierFilter, mode: 'insensitive' },
    };
  }

  const where: Record<string, unknown> = { payment_order: orderConditions };

  if (taxTypeFilter && taxTypeFilter.length > 0) {
    where.tax_type_id = { in: taxTypeFilter };
  }

  if (state.search) {
    where.OR = [
      { certificate_number: { contains: state.search, mode: 'insensitive' } },
      {
        payment_order: {
          ...orderConditions,
          full_number: { contains: state.search, mode: 'insensitive' },
        },
      },
      {
        payment_order: {
          ...orderConditions,
          supplier: { business_name: { contains: state.search, mode: 'insensitive' } },
        },
      },
    ];
  }

  return where;
}

export async function getRetentionsPaginated(
  searchParams: DataTableSearchParams
): Promise<{ data: RetentionRow[]; total: number }> {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);
    const where = buildRetentionsWhere(companyId, searchParams);

    const [rows, total] = await Promise.all([
      prisma.payment_order_retentions.findMany({
        where: where as any,
        include: RETENTION_INCLUDE,
        orderBy: { payment_order: { date: 'desc' } },
        skip,
        take,
      }),
      prisma.payment_order_retentions.count({ where: where as any }),
    ]);

    return { data: rows.map(rowToRetention), total };
  } catch (error) {
    console.error('Error fetching retentions:', error);
    return { data: [], total: 0 };
  }
}

/**
 * Mismo where que getRetentionsPaginated pero sin paginación. Pensado para
 * el botón "Exportar Excel" — respeta los filtros activos.
 */
export async function getAllRetentionsForExport(
  searchParams: DataTableSearchParams
): Promise<RetentionRow[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const where = buildRetentionsWhere(companyId, searchParams);
    const rows = await prisma.payment_order_retentions.findMany({
      where: where as any,
      include: RETENTION_INCLUDE,
      orderBy: { payment_order: { date: 'desc' } },
    });
    return rows.map(rowToRetention);
  } catch (error) {
    console.error('Error exporting retentions:', error);
    return [];
  }
}

export async function getRetentionTypeOptions(): Promise<
  { id: string; code: string; name: string }[]
> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];
  return prisma.tax_types.findMany({
    where: { company_id: companyId, kind: 'RETENTION' },
    select: { id: true, code: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export interface RetentionsSummary {
  totalAmount: number;
  byTaxType: { taxTypeId: string; name: string; total: number; count: number }[];
}

export async function getRetentionsSummary(): Promise<RetentionsSummary> {
  const { companyId } = await getActionContext();
  if (!companyId) return { totalAmount: 0, byTaxType: [] };

  const [groups, taxTypes] = await Promise.all([
    prisma.payment_order_retentions.groupBy({
      by: ['tax_type_id'],
      where: { payment_order: { company_id: companyId } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.tax_types.findMany({
      where: { company_id: companyId, kind: 'RETENTION' },
      select: { id: true, name: true },
    }),
  ]);

  const nameMap = new Map(taxTypes.map((t) => [t.id, t.name]));
  const byTaxType = groups.map((g) => ({
    taxTypeId: g.tax_type_id,
    name: nameMap.get(g.tax_type_id) ?? 'Sin nombre',
    total: Number(g._sum.amount ?? 0),
    count: g._count._all,
  }));
  byTaxType.sort((a, b) => b.total - a.total);
  const totalAmount = byTaxType.reduce((acc, g) => acc + g.total, 0);

  return { totalAmount, byTaxType };
}
