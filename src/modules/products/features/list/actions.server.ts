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

const productSearchFields = ['name', 'code', 'brand'];

const productColumnMap: Record<string, string> = {
  type: 'type',
  status: 'status',
};

function buildProductsWhere(state: ReturnType<typeof parseSearchParams>, companyIds: string[]) {
  const baseWhere: Record<string, unknown> = { company_id: { in: companyIds } };

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
  const scope = await getCompanyScope();
  if (!scope) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);

    const where = buildProductsWhere(state, scope.visibleCompanyIds);

    const [data, total] = await Promise.all([
      prisma.products.findMany({
        where,
        skip,
        take,
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
        include: { company: { select: { id: true, company_name: true } } },
      }),
      prisma.products.count({ where }),
    ]);

    const formatted = data.map((p) => ({
      ...p,
      cost_price: Number(p.cost_price),
      sale_price: Number(p.sale_price),
      vat_rate: Number(p.vat_rate),
      profit_margin_percent: p.profit_margin_percent != null ? Number(p.profit_margin_percent) : null,
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
  const scope = await getCompanyScope();
  if (!scope) return {};

  try {
    const [typeGroups, statusGroups] = await Promise.all([
      prisma.products.groupBy({
        by: ['type'],
        where: { company_id: { in: scope.visibleCompanyIds } },
        _count: true,
      }),
      prisma.products.groupBy({
        by: ['status'],
        where: { company_id: { in: scope.visibleCompanyIds } },
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
  const scope = await getCompanyScope();
  if (!scope) return [];

  const data = await prisma.products.findMany({
    where: { company_id: { in: scope.visibleCompanyIds } },
    orderBy: { name: 'asc' },
  });

  return data.map((p) => ({
    ...p,
    cost_price: Number(p.cost_price),
    sale_price: Number(p.sale_price),
    vat_rate: Number(p.vat_rate),
    profit_margin_percent: p.profit_margin_percent != null ? Number(p.profit_margin_percent) : null,
    min_stock: p.min_stock ? Number(p.min_stock) : null,
    max_stock: p.max_stock ? Number(p.max_stock) : null,
  }));
}

export async function createProduct(data: Record<string, unknown>) {
  const scope = await getCompanyScope();
  if (!scope) throw new Error('No company selected');

  try {
    // Auto-generate code (scoped to the visible group to avoid duplicates across the group)
    const lastProduct = await prisma.products.findFirst({
      where: { company_id: { in: scope.visibleCompanyIds }, code: { startsWith: 'PROD-' } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    const lastNum = lastProduct?.code ? parseInt(lastProduct.code.replace('PROD-', ''), 10) || 0 : 0;
    const code = `PROD-${String(lastNum + 1).padStart(4, '0')}`;

    const purchaseSaleType = (data.purchase_sale_type as 'PURCHASE' | 'PURCHASE_SALE') || 'PURCHASE_SALE';
    const costPrice = Number(data.cost_price) || 0;
    const profitMarginRaw = data.profit_margin_percent;
    const profitMargin = profitMarginRaw != null && profitMarginRaw !== '' ? Number(profitMarginRaw) : null;

    let salePrice = 0;
    let profitMarginToSave: number | null = null;
    if (purchaseSaleType === 'PURCHASE_SALE') {
      profitMarginToSave = profitMargin ?? 0;
      salePrice = costPrice * (1 + profitMarginToSave / 100);
    }

    const product = await prisma.products.create({
      data: {
        company_id: scope.activeCompanyId,
        code,
        name: data.name as string,
        description: (data.description as string) || null,
        type: data.type as any,
        purchase_sale_type: purchaseSaleType as any,
        unit_of_measure: (data.unit_of_measure as string) || 'UN',
        cost_price: costPrice,
        sale_price: salePrice,
        vat_rate: Number(data.vat_rate) ?? 21,
        profit_margin_percent: profitMarginToSave,
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
    const existing = await prisma.products.findUnique({ where: { id } });
    if (!existing) throw new Error('Producto no encontrado');

    const purchaseSaleType = (data.purchase_sale_type as 'PURCHASE' | 'PURCHASE_SALE') || (existing.purchase_sale_type as any);
    const costPrice = data.cost_price != null ? Number(data.cost_price) : Number(existing.cost_price);

    // Detectamos si la llamada incluye datos de "edicion completa" (formulario) vs
    // operaciones puntuales (toggle de estado en la lista). Si vienen los campos de
    // negocio, recalculamos el sale_price; si no, preservamos los valores actuales.
    const hasMarginInput =
      Object.prototype.hasOwnProperty.call(data, 'profit_margin_percent') ||
      Object.prototype.hasOwnProperty.call(data, 'purchase_sale_type');

    let salePrice: number;
    let profitMarginToSave: number | null;
    if (hasMarginInput) {
      const profitMarginRaw = data.profit_margin_percent;
      const profitMargin =
        profitMarginRaw != null && profitMarginRaw !== '' ? Number(profitMarginRaw) : null;
      if (purchaseSaleType === 'PURCHASE_SALE') {
        profitMarginToSave = profitMargin ?? 0;
        salePrice = costPrice * (1 + profitMarginToSave / 100);
      } else {
        profitMarginToSave = null;
        salePrice = 0;
      }
    } else {
      salePrice = data.sale_price != null ? Number(data.sale_price) : Number(existing.sale_price);
      profitMarginToSave =
        existing.profit_margin_percent != null ? Number(existing.profit_margin_percent) : null;
    }

    const product = await prisma.products.update({
      where: { id },
      data: {
        name: data.name as string,
        description: (data.description as string) || null,
        type: data.type as any,
        purchase_sale_type: purchaseSaleType as any,
        unit_of_measure: (data.unit_of_measure as string) || 'UN',
        cost_price: costPrice,
        sale_price: salePrice,
        vat_rate: Number(data.vat_rate) ?? 21,
        profit_margin_percent: profitMarginToSave,
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
  const scope = await getCompanyScope();
  if (!scope) return null;

  const product = await prisma.products.findFirst({
    where: { id, company_id: { in: scope.visibleCompanyIds } },
    include: { company: { select: { id: true, company_name: true } } },
  });
  if (!product) return null;

  return {
    ...product,
    cost_price: Number(product.cost_price),
    sale_price: Number(product.sale_price),
    vat_rate: Number(product.vat_rate),
    profit_margin_percent: product.profit_margin_percent != null ? Number(product.profit_margin_percent) : null,
    min_stock: product.min_stock != null ? Number(product.min_stock) : null,
    max_stock: product.max_stock != null ? Number(product.max_stock) : null,
  };
}

export async function getProductStockByWarehouse(productId: string) {
  const scope = await getCompanyScope();
  if (!scope) return [];

  const stocks = await prisma.warehouse_stocks.findMany({
    where: {
      product_id: productId,
      warehouse: { company_id: { in: scope.visibleCompanyIds } },
    },
    include: {
      warehouse: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          company: { select: { id: true, company_name: true } },
        },
      },
    },
    orderBy: { warehouse: { name: 'asc' } },
  });

  return stocks.map((s) => ({
    id: s.id,
    warehouse_id: s.warehouse_id,
    warehouse_code: s.warehouse.code,
    warehouse_name: s.warehouse.name,
    warehouse_type: s.warehouse.type,
    warehouse_company_id: s.warehouse.company.id,
    warehouse_company_name: s.warehouse.company.company_name,
    quantity: Number(s.quantity),
    reserved_qty: Number(s.reserved_qty),
    available_qty: Number(s.available_qty),
    updated_at: s.updated_at.toISOString(),
  }));
}

export async function getProductMovements(productId: string, limit = 100) {
  const scope = await getCompanyScope();
  if (!scope) return [];

  const movements = await prisma.stock_movements.findMany({
    where: {
      product_id: productId,
      warehouse: { company_id: { in: scope.visibleCompanyIds } },
    },
    include: {
      warehouse: { select: { code: true, name: true } },
      company: { select: { id: true, company_name: true } },
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
    company_id: m.company.id,
    company_name: m.company.company_name,
    reference_type: m.reference_type,
    reference_id: m.reference_id,
    notes: m.notes,
    date: m.date.toISOString(),
  }));
}

export async function getProductsByCompany() {
  const scope = await getCompanyScope();
  if (!scope) return [];

  return prisma.products.findMany({
    where: { company_id: { in: scope.visibleCompanyIds }, status: 'ACTIVE' },
    select: { id: true, code: true, name: true, unit_of_measure: true, cost_price: true, vat_rate: true, track_stock: true },
    orderBy: { name: 'asc' },
  });
}
