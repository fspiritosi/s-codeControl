'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildSearchWhere,
  buildFiltersWhere,
} from '@/shared/components/common/DataTable/helpers';
import { revalidatePath } from 'next/cache';

const productSearchFields = ['name', 'code', 'brand'];

const productColumnMap: Record<string, string> = {
  type: 'type',
  status: 'status',
};

function buildProductsWhere(state: ReturnType<typeof parseSearchParams>, companyId: string) {
  const baseWhere: Record<string, unknown> = { company_id: companyId };

  if (state.search) {
    Object.assign(baseWhere, buildSearchWhere(state.search, productSearchFields));
  }

  const filtersWhere = buildFiltersWhere(state.filters, productColumnMap);
  Object.assign(baseWhere, filtersWhere);

  // Text filter for name
  const nameFilter = state.filters.name;
  if (nameFilter?.length) {
    baseWhere.name = { contains: nameFilter[0], mode: 'insensitive' };
  }

  return baseWhere;
}

export async function getProductsPaginated(searchParams: DataTableSearchParams) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);

    const where = buildProductsWhere(state, companyId);

    const [data, total] = await Promise.all([
      prisma.products.findMany({
        where,
        skip,
        take,
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
      }),
      prisma.products.count({ where }),
    ]);

    const formatted = data.map((p) => ({
      ...p,
      cost_price: Number(p.cost_price),
      sale_price: Number(p.sale_price),
      vat_rate: Number(p.vat_rate),
      min_stock: p.min_stock ? Number(p.min_stock) : null,
      max_stock: p.max_stock ? Number(p.max_stock) : null,
    }));

    return { data: formatted, total };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { data: [], total: 0 };
  }
}

export async function getProductFacets(): Promise<Record<string, { value: string; count: number }[]>> {
  const { companyId } = await getActionContext();
  if (!companyId) return {};

  try {
    const [typeGroups, statusGroups] = await Promise.all([
      prisma.products.groupBy({
        by: ['type'],
        where: { company_id: companyId },
        _count: true,
      }),
      prisma.products.groupBy({
        by: ['status'],
        where: { company_id: companyId },
        _count: true,
      }),
    ]);

    return {
      type: typeGroups.map((g) => ({ value: g.type, count: g._count })),
      status: statusGroups.map((g) => ({ value: g.status, count: g._count })),
    };
  } catch (error) {
    console.error('Error fetching product facets:', error);
    return {};
  }
}

export async function getAllProductsForExport() {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const data = await prisma.products.findMany({
    where: { company_id: companyId },
    orderBy: { name: 'asc' },
  });

  return data.map((p) => ({
    ...p,
    cost_price: Number(p.cost_price),
    sale_price: Number(p.sale_price),
    vat_rate: Number(p.vat_rate),
    min_stock: p.min_stock ? Number(p.min_stock) : null,
    max_stock: p.max_stock ? Number(p.max_stock) : null,
  }));
}

export async function createProduct(data: Record<string, unknown>) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  try {
    // Auto-generate code
    const lastProduct = await prisma.products.findFirst({
      where: { company_id: companyId },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    const lastNum = lastProduct?.code ? parseInt(lastProduct.code.replace('PROD-', ''), 10) || 0 : 0;
    const code = `PROD-${String(lastNum + 1).padStart(4, '0')}`;

    const product = await prisma.products.create({
      data: {
        company_id: companyId,
        code,
        name: data.name as string,
        description: (data.description as string) || null,
        type: data.type as any,
        unit_of_measure: (data.unit_of_measure as string) || 'UN',
        cost_price: Number(data.cost_price) || 0,
        sale_price: Number(data.sale_price) || 0,
        vat_rate: Number(data.vat_rate) ?? 21,
        track_stock: data.track_stock as boolean ?? true,
        min_stock: data.min_stock != null ? Number(data.min_stock) : 0,
        max_stock: data.max_stock != null ? Number(data.max_stock) : null,
        barcode: (data.barcode as string) || null,
        brand: (data.brand as string) || null,
      },
    });

    revalidatePath('/dashboard/warehouse');
    return { data: { id: product.id, code: product.code, name: product.name }, error: null };
  } catch (error) {
    console.error('Error creating product:', error);
    return { data: null, error: String(error) };
  }
}

export async function updateProduct(id: string, data: Record<string, unknown>) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  try {
    const product = await prisma.products.update({
      where: { id },
      data: {
        name: data.name as string,
        description: (data.description as string) || null,
        type: data.type as any,
        unit_of_measure: (data.unit_of_measure as string) || 'UN',
        cost_price: Number(data.cost_price) || 0,
        sale_price: Number(data.sale_price) || 0,
        vat_rate: Number(data.vat_rate) ?? 21,
        track_stock: data.track_stock as boolean ?? true,
        min_stock: data.min_stock != null ? Number(data.min_stock) : 0,
        max_stock: data.max_stock != null ? Number(data.max_stock) : null,
        barcode: (data.barcode as string) || null,
        brand: (data.brand as string) || null,
        status: data.status as any,
      },
    });

    revalidatePath('/dashboard/warehouse');
    return { data: { id: product.id, code: product.code, name: product.name }, error: null };
  } catch (error) {
    console.error('Error updating product:', error);
    return { data: null, error: String(error) };
  }
}

export async function deleteProduct(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  try {
    await prisma.products.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    revalidatePath('/dashboard/warehouse');
    return { error: null };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { error: String(error) };
  }
}

export async function getProductById(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  const product = await prisma.products.findFirst({
    where: { id, company_id: companyId },
  });
  if (!product) return null;

  return {
    ...product,
    cost_price: Number(product.cost_price),
    sale_price: Number(product.sale_price),
    vat_rate: Number(product.vat_rate),
    min_stock: product.min_stock != null ? Number(product.min_stock) : null,
    max_stock: product.max_stock != null ? Number(product.max_stock) : null,
  };
}

export async function getProductStockByWarehouse(productId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const stocks = await prisma.warehouse_stocks.findMany({
    where: {
      product_id: productId,
      warehouse: { company_id: companyId },
    },
    include: {
      warehouse: { select: { id: true, code: true, name: true, type: true } },
    },
    orderBy: { warehouse: { name: 'asc' } },
  });

  return stocks.map((s) => ({
    id: s.id,
    warehouse_id: s.warehouse_id,
    warehouse_code: s.warehouse.code,
    warehouse_name: s.warehouse.name,
    warehouse_type: s.warehouse.type,
    quantity: Number(s.quantity),
    reserved_qty: Number(s.reserved_qty),
    available_qty: Number(s.available_qty),
    updated_at: s.updated_at.toISOString(),
  }));
}

export async function getProductMovements(productId: string, limit = 100) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const movements = await prisma.stock_movements.findMany({
    where: { product_id: productId, company_id: companyId },
    include: {
      warehouse: { select: { code: true, name: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
  });

  return movements.map((m) => ({
    id: m.id,
    type: m.type,
    quantity: Number(m.quantity),
    warehouse_code: m.warehouse.code,
    warehouse_name: m.warehouse.name,
    reference_type: m.reference_type,
    reference_id: m.reference_id,
    notes: m.notes,
    date: m.date.toISOString(),
  }));
}

export async function getProductsByCompany() {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  return prisma.products.findMany({
    where: { company_id: companyId, status: 'ACTIVE' },
    select: { id: true, code: true, name: true, unit_of_measure: true, cost_price: true, vat_rate: true, track_stock: true },
    orderBy: { name: 'asc' },
  });
}
