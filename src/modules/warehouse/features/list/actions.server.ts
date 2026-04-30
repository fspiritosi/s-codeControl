'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { getCompanyScope } from '@/shared/lib/company-scope';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildSearchWhere,
  buildFiltersWhere,
} from '@/shared/components/common/DataTable/helpers';
import { revalidatePath } from 'next/cache';

// ============================================================
// WAREHOUSE CRUD
// ============================================================

function buildWarehousesWhere(state: ReturnType<typeof parseSearchParams>, companyIds: string[]) {
  const baseWhere: Record<string, unknown> = { company_id: { in: companyIds } };

  if (state.search) {
    Object.assign(baseWhere, buildSearchWhere(state.search, ['name', 'code']));
  }

  const filtersWhere = buildFiltersWhere(state.filters, { type: 'type' });
  Object.assign(baseWhere, filtersWhere);

  return baseWhere;
}

export async function getWarehousesPaginated(searchParams: DataTableSearchParams) {
  const scope = await getCompanyScope();
  if (!scope) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);
    const where = buildWarehousesWhere(state, scope.visibleCompanyIds);

    const [data, total] = await Promise.all([
      prisma.warehouses.findMany({
        where,
        skip,
        take,
        orderBy: [{ is_active: 'desc' }, { name: 'asc' }],
        include: {
          _count: { select: { stocks: true, movements: true } },
          company: { select: { id: true, company_name: true } },
        },
      }),
      prisma.warehouses.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return { data: [], total: 0 };
  }
}

export async function getWarehouseFacets(): Promise<Record<string, { value: string; count: number }[]>> {
  const scope = await getCompanyScope();
  if (!scope) return {};

  try {
    const typeGroups = await prisma.warehouses.groupBy({
      by: ['type'],
      where: { company_id: { in: scope.visibleCompanyIds } },
      _count: true,
    });

    return {
      type: typeGroups.map((g) => ({ value: g.type, count: g._count })),
    };
  } catch (error) {
    console.error('Error fetching warehouse facets:', error);
    return {};
  }
}

export async function createWarehouse(data: Record<string, unknown>) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  try {
    const warehouse = await prisma.warehouses.create({
      data: {
        company_id: companyId,
        code: data.code as string,
        name: data.name as string,
        type: (data.type as any) || 'MAIN',
        address: (data.address as string) || null,
        city: (data.city as string) || null,
        province: (data.province as string) || null,
      },
    });

    revalidatePath('/dashboard/warehouse');
    return { data: warehouse, error: null };
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { data: null, error: 'Ya existe un almacén con ese código' };
    }
    console.error('Error creating warehouse:', error);
    return { data: null, error: String(error) };
  }
}

export async function getWarehouseById(id: string) {
  const scope = await getCompanyScope();
  if (!scope) return null;

  return prisma.warehouses.findFirst({
    where: { id, company_id: { in: scope.visibleCompanyIds } },
    include: {
      _count: { select: { stocks: true, movements: true } },
      company: { select: { id: true, company_name: true } },
    },
  });
}

export async function updateWarehouse(id: string, data: Record<string, unknown>) {
  try {
    const warehouse = await prisma.warehouses.update({
      where: { id },
      data: {
        name: data.name as string,
        type: data.type as any,
        address: (data.address as string) || null,
        city: (data.city as string) || null,
        province: (data.province as string) || null,
      },
    });

    revalidatePath('/dashboard/warehouse');
    return { data: warehouse, error: null };
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return { data: null, error: String(error) };
  }
}

export async function toggleWarehouseActive(id: string) {
  try {
    const current = await prisma.warehouses.findUnique({ where: { id }, select: { is_active: true } });
    await prisma.warehouses.update({ where: { id }, data: { is_active: !current?.is_active } });
    revalidatePath('/dashboard/warehouse');
    return { error: null };
  } catch (error) {
    console.error('Error toggling warehouse:', error);
    return { error: String(error) };
  }
}

export async function getWarehousesByCompany() {
  const scope = await getCompanyScope();
  if (!scope) return [];

  return prisma.warehouses.findMany({
    where: { company_id: { in: scope.visibleCompanyIds }, is_active: true },
    select: { id: true, code: true, name: true },
    orderBy: { name: 'asc' },
  });
}

// ============================================================
// STOCK QUERIES
// ============================================================

export async function getWarehouseStocks(warehouseId: string) {
  try {
    const stocks = await prisma.warehouse_stocks.findMany({
      where: { warehouse_id: warehouseId },
      include: {
        product: {
          select: {
            id: true,
            code: true,
            name: true,
            unit_of_measure: true,
            company: { select: { id: true, company_name: true } },
          },
        },
      },
      orderBy: { product: { name: 'asc' } },
    });

    return stocks.map((s) => ({
      ...s,
      quantity: Number(s.quantity),
      reserved_qty: Number(s.reserved_qty),
      available_qty: Number(s.available_qty),
    }));
  } catch (error) {
    console.error('Error fetching warehouse stocks:', error);
    return [];
  }
}

// ============================================================
// STOCK ADJUSTMENT
// ============================================================

export async function adjustStock(data: {
  warehouse_id: string;
  product_id: string;
  quantity: number;
  notes: string;
}) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  try {
    const currentStock = await prisma.warehouse_stocks.findUnique({
      where: { warehouse_id_product_id: { warehouse_id: data.warehouse_id, product_id: data.product_id } },
    });

    const currentQty = currentStock ? Number(currentStock.quantity) : 0;
    const diff = data.quantity - currentQty;

    await prisma.$transaction([
      prisma.warehouse_stocks.upsert({
        where: { warehouse_id_product_id: { warehouse_id: data.warehouse_id, product_id: data.product_id } },
        update: {
          quantity: data.quantity,
          available_qty: data.quantity - (currentStock ? Number(currentStock.reserved_qty) : 0),
        },
        create: {
          warehouse_id: data.warehouse_id,
          product_id: data.product_id,
          quantity: data.quantity,
          available_qty: data.quantity,
          reserved_qty: 0,
        },
      }),
      prisma.stock_movements.create({
        data: {
          company_id: companyId,
          warehouse_id: data.warehouse_id,
          product_id: data.product_id,
          type: 'ADJUSTMENT',
          quantity: diff,
          reference_type: 'adjustment',
          notes: data.notes,
          date: new Date(),
        },
      }),
    ]);

    revalidatePath('/dashboard/warehouse');
    return { error: null };
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return { error: String(error) };
  }
}

// ============================================================
// STOCK TRANSFER
// ============================================================

export async function transferStock(data: {
  source_warehouse_id: string;
  destination_warehouse_id: string;
  product_id: string;
  quantity: number;
  notes?: string;
}) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  try {
    // Validate source has enough stock
    const sourceStock = await prisma.warehouse_stocks.findUnique({
      where: { warehouse_id_product_id: { warehouse_id: data.source_warehouse_id, product_id: data.product_id } },
    });

    if (!sourceStock || Number(sourceStock.available_qty) < data.quantity) {
      return { error: 'Stock insuficiente en el almacén de origen' };
    }

    const now = new Date();

    await prisma.$transaction([
      // Decrement source
      prisma.warehouse_stocks.update({
        where: { warehouse_id_product_id: { warehouse_id: data.source_warehouse_id, product_id: data.product_id } },
        data: {
          quantity: { decrement: data.quantity },
          available_qty: { decrement: data.quantity },
        },
      }),
      // Increment destination
      prisma.warehouse_stocks.upsert({
        where: { warehouse_id_product_id: { warehouse_id: data.destination_warehouse_id, product_id: data.product_id } },
        update: {
          quantity: { increment: data.quantity },
          available_qty: { increment: data.quantity },
        },
        create: {
          warehouse_id: data.destination_warehouse_id,
          product_id: data.product_id,
          quantity: data.quantity,
          available_qty: data.quantity,
          reserved_qty: 0,
        },
      }),
      // Movement OUT
      prisma.stock_movements.create({
        data: {
          company_id: companyId,
          warehouse_id: data.source_warehouse_id,
          product_id: data.product_id,
          type: 'TRANSFER_OUT',
          quantity: -data.quantity,
          reference_type: 'transfer',
          notes: data.notes || null,
          date: now,
        },
      }),
      // Movement IN
      prisma.stock_movements.create({
        data: {
          company_id: companyId,
          warehouse_id: data.destination_warehouse_id,
          product_id: data.product_id,
          type: 'TRANSFER_IN',
          quantity: data.quantity,
          reference_type: 'transfer',
          notes: data.notes || null,
          date: now,
        },
      }),
    ]);

    revalidatePath('/dashboard/warehouse');
    return { error: null };
  } catch (error) {
    console.error('Error transferring stock:', error);
    return { error: String(error) };
  }
}

// ============================================================
// STOCK MOVEMENTS
// ============================================================

export async function getStockMovementsPaginated(searchParams: DataTableSearchParams) {
  const scope = await getCompanyScope();
  if (!scope) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);

    const where: Record<string, unknown> = {
      warehouse: { company_id: { in: scope.visibleCompanyIds } },
    };

    if (state.search) {
      where.OR = [
        { product: { name: { contains: state.search, mode: 'insensitive' } } },
        { warehouse: { name: { contains: state.search, mode: 'insensitive' } } },
        { notes: { contains: state.search, mode: 'insensitive' } },
      ];
    }

    const typeFilter = state.filters.type;
    if (typeFilter?.length) {
      where.type = typeFilter.length === 1 ? typeFilter[0] : { in: typeFilter };
    }

    const warehouseFilter = state.filters.warehouse;
    if (warehouseFilter?.length) {
      where.warehouse_id = warehouseFilter.length === 1 ? warehouseFilter[0] : { in: warehouseFilter };
    }

    const [data, total] = await Promise.all([
      prisma.stock_movements.findMany({
        where: where as any,
        include: {
          product: { select: { code: true, name: true, unit_of_measure: true } },
          warehouse: { select: { code: true, name: true } },
          company: { select: { id: true, company_name: true } },
        },
        skip,
        take,
        orderBy: { date: 'desc' },
      }),
      prisma.stock_movements.count({ where: where as any }),
    ]);

    const formatted = data.map((m) => ({
      ...m,
      quantity: Number(m.quantity),
    }));

    return { data: formatted, total };
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return { data: [], total: 0 };
  }
}

export async function getMovementTypeFacets(): Promise<Record<string, { value: string; count: number }[]>> {
  const scope = await getCompanyScope();
  if (!scope) return {};

  try {
    const typeGroups = await prisma.stock_movements.groupBy({
      by: ['type'],
      where: { warehouse: { company_id: { in: scope.visibleCompanyIds } } },
      _count: true,
    });

    return {
      type: typeGroups.map((g) => ({ value: g.type, count: g._count })),
    };
  } catch (error) {
    console.error('Error fetching movement facets:', error);
    return {};
  }
}
