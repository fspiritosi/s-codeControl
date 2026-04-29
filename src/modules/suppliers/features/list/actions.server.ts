'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildSearchWhere,
  buildFiltersWhere,
  buildTextFiltersWhere,
} from '@/shared/components/common/DataTable/helpers';
import { revalidatePath } from 'next/cache';

const supplierSearchFields = ['business_name', 'trade_name', 'tax_id'];

const supplierColumnMap: Record<string, string> = {
  status: 'status',
  tax_condition: 'tax_condition',
};

const supplierTextColumns = ['business_name', 'tax_id', 'email', 'phone'];

function buildSuppliersWhere(state: ReturnType<typeof parseSearchParams>, companyId: string) {
  const baseWhere: Record<string, unknown> = { company_id: companyId };

  if (state.search) {
    Object.assign(baseWhere, buildSearchWhere(state.search, supplierSearchFields));
  }

  const filtersWhere = buildFiltersWhere(state.filters, supplierColumnMap);
  Object.assign(baseWhere, filtersWhere);

  const textWhere = buildTextFiltersWhere(state.filters, supplierTextColumns);
  Object.assign(baseWhere, textWhere);

  return baseWhere;
}

export async function getSuppliersPaginated(searchParams: DataTableSearchParams) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);
    const where = buildSuppliersWhere(state, companyId);

    const [data, total] = await Promise.all([
      prisma.suppliers.findMany({
        where,
        skip,
        take,
        orderBy: [{ status: 'asc' }, { business_name: 'asc' }],
      }),
      prisma.suppliers.count({ where }),
    ]);

    const formatted = data.map((s) => ({
      ...s,
      credit_limit: s.credit_limit ? Number(s.credit_limit) : null,
    }));

    return { data: formatted, total };
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return { data: [], total: 0 };
  }
}

export async function getSupplierFacets(): Promise<Record<string, { value: string; count: number }[]>> {
  const { companyId } = await getActionContext();
  if (!companyId) return {};

  try {
    const [statusGroups, taxGroups] = await Promise.all([
      prisma.suppliers.groupBy({
        by: ['status'],
        where: { company_id: companyId },
        _count: true,
      }),
      prisma.suppliers.groupBy({
        by: ['tax_condition'],
        where: { company_id: companyId },
        _count: true,
      }),
    ]);

    return {
      status: statusGroups.map((g) => ({ value: g.status, count: g._count })),
      tax_condition: taxGroups.map((g) => ({ value: g.tax_condition, count: g._count })),
    };
  } catch (error) {
    console.error('Error fetching supplier facets:', error);
    return {};
  }
}

export async function getAllSuppliersForExport() {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const data = await prisma.suppliers.findMany({
    where: { company_id: companyId },
    orderBy: { business_name: 'asc' },
  });

  return data.map((s) => ({
    ...s,
    credit_limit: s.credit_limit ? Number(s.credit_limit) : null,
  }));
}

function formatCuit(taxId: string) {
  const clean = taxId.replace(/-/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
  }
  return taxId;
}

async function buildCuitConflictMessage(
  companyId: string,
  taxId: string,
  excludeId?: string
) {
  const normalized = taxId.replace(/-/g, '');
  const conflict = await prisma.suppliers.findFirst({
    where: {
      company_id: companyId,
      tax_id: normalized,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { code: true, business_name: true },
  });

  if (!conflict) {
    return `Ya existe un proveedor con el CUIT ${formatCuit(normalized)} en esta empresa`;
  }

  return `El CUIT ${formatCuit(normalized)} ya está registrado para el proveedor ${conflict.code} - ${conflict.business_name}`;
}

export async function createSupplier(data: Record<string, unknown>) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  const normalizedTaxId = (data.tax_id as string).replace(/-/g, '');

  try {
    const lastSupplier = await prisma.suppliers.findFirst({
      where: { company_id: companyId },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    const lastNum = lastSupplier?.code ? parseInt(lastSupplier.code.replace('PROV-', ''), 10) || 0 : 0;
    const code = `PROV-${String(lastNum + 1).padStart(4, '0')}`;

    const supplier = await prisma.suppliers.create({
      data: {
        company_id: companyId,
        code,
        business_name: data.business_name as string,
        trade_name: (data.trade_name as string) || null,
        tax_id: normalizedTaxId,
        tax_condition: data.tax_condition as any,
        email: (data.email as string) || null,
        phone: (data.phone as string) || null,
        website: (data.website as string) || null,
        address: (data.address as string) || null,
        city: (data.city as string) || null,
        province: (data.province as string) || null,
        zip_code: (data.zip_code as string) || null,
        country: (data.country as string) || 'Argentina',
        payment_term_days: Number(data.payment_term_days) || 0,
        credit_limit: data.credit_limit != null ? Number(data.credit_limit) : null,
        contact_name: (data.contact_name as string) || null,
        contact_phone: (data.contact_phone as string) || null,
        contact_email: (data.contact_email as string) || null,
        notes: (data.notes as string) || null,
      },
    });

    revalidatePath('/dashboard/purchasing');
    return { data: supplier, error: null };
  } catch (error: any) {
    if (error?.code === 'P2002') {
      const message = await buildCuitConflictMessage(companyId, normalizedTaxId);
      return { data: null, error: message };
    }
    console.error('Error creating supplier:', error);
    return { data: null, error: String(error) };
  }
}

export async function updateSupplier(id: string, data: Record<string, unknown>) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  const normalizedTaxId = (data.tax_id as string)?.replace(/-/g, '');

  try {
    const supplier = await prisma.suppliers.update({
      where: { id },
      data: {
        business_name: data.business_name as string,
        trade_name: (data.trade_name as string) || null,
        tax_id: normalizedTaxId,
        tax_condition: data.tax_condition as any,
        email: (data.email as string) || null,
        phone: (data.phone as string) || null,
        website: (data.website as string) || null,
        address: (data.address as string) || null,
        city: (data.city as string) || null,
        province: (data.province as string) || null,
        zip_code: (data.zip_code as string) || null,
        country: (data.country as string) || 'Argentina',
        payment_term_days: Number(data.payment_term_days) || 0,
        credit_limit: data.credit_limit != null ? Number(data.credit_limit) : null,
        contact_name: (data.contact_name as string) || null,
        contact_phone: (data.contact_phone as string) || null,
        contact_email: (data.contact_email as string) || null,
        notes: (data.notes as string) || null,
        status: data.status as any,
      },
    });

    revalidatePath('/dashboard/purchasing');
    revalidatePath(`/dashboard/suppliers/${id}`);
    return { data: supplier, error: null };
  } catch (error: any) {
    if (error?.code === 'P2002' && normalizedTaxId) {
      const message = await buildCuitConflictMessage(companyId, normalizedTaxId, id);
      return { data: null, error: message };
    }
    console.error('Error updating supplier:', error);
    return { data: null, error: String(error) };
  }
}

export async function getSupplierById(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  const supplier = await prisma.suppliers.findFirst({
    where: { id, company_id: companyId },
  });

  if (!supplier) return null;

  return {
    ...supplier,
    credit_limit: supplier.credit_limit ? Number(supplier.credit_limit) : null,
  };
}

export async function deleteSupplier(id: string) {
  try {
    await prisma.suppliers.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    revalidatePath('/dashboard/purchasing');
    return { error: null };
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return { error: String(error) };
  }
}

export async function getSuppliersByCompany() {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  return prisma.suppliers.findMany({
    where: { company_id: companyId, status: 'ACTIVE' },
    select: { id: true, code: true, business_name: true, tax_id: true },
    orderBy: { business_name: 'asc' },
  });
}
