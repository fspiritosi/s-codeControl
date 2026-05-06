'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { requirePermission } from '@/shared/lib/permissions';
import { revalidatePath } from 'next/cache';
import type { TaxTypeData } from './types';

const CODE_RE = /^[A-Z0-9_]+$/;

function serialize(t: {
  id: string;
  code: string;
  name: string;
  kind: 'RETENTION' | 'PERCEPTION';
  scope: 'NATIONAL' | 'PROVINCIAL' | 'MUNICIPAL';
  jurisdiction: string | null;
  calculation_base: 'NET' | 'TOTAL' | 'VAT';
  default_rate: { toString(): string };
  min_taxable_amount: { toString(): string } | null;
  is_active: boolean;
  notes: string | null;
}): TaxTypeData {
  return {
    id: t.id,
    code: t.code,
    name: t.name,
    kind: t.kind,
    scope: t.scope,
    jurisdiction: t.jurisdiction,
    calculation_base: t.calculation_base,
    default_rate: Number(t.default_rate),
    min_taxable_amount: t.min_taxable_amount !== null ? Number(t.min_taxable_amount) : null,
    is_active: t.is_active,
    notes: t.notes,
  };
}

export async function listTaxTypes(kind?: 'RETENTION' | 'PERCEPTION'): Promise<TaxTypeData[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const rows = await prisma.tax_types.findMany({
    where: { company_id: companyId, ...(kind ? { kind } : {}) },
    orderBy: [{ kind: 'asc' }, { name: 'asc' }],
  });
  return rows.map(serialize);
}

interface UpsertInput {
  id?: string;
  code: string;
  name: string;
  kind: 'RETENTION' | 'PERCEPTION';
  scope: 'NATIONAL' | 'PROVINCIAL' | 'MUNICIPAL';
  jurisdiction?: string | null;
  calculation_base: 'NET' | 'TOTAL' | 'VAT';
  default_rate: number;
  min_taxable_amount?: number | null;
  is_active: boolean;
  notes?: string | null;
}

export async function upsertTaxType(input: UpsertInput) {
  try {
    await requirePermission('empresa.update');
    const { companyId } = await getActionContext();
    if (!companyId) return { error: 'No company selected' };

    const code = input.code.trim().toUpperCase();
    if (!code) return { error: 'El código es requerido' };
    if (!CODE_RE.test(code)) {
      return { error: 'Código inválido: solo mayúsculas, números y guion bajo' };
    }
    if (!input.name.trim()) return { error: 'El nombre es requerido' };
    if (input.default_rate < 0 || input.default_rate > 100) {
      return { error: 'La alícuota debe estar entre 0 y 100' };
    }
    if (
      input.min_taxable_amount !== null &&
      input.min_taxable_amount !== undefined &&
      input.min_taxable_amount < 0
    ) {
      return { error: 'El mínimo no puede ser negativo' };
    }

    // Validar unicidad de code dentro de la empresa
    const collision = await prisma.tax_types.findFirst({
      where: {
        company_id: companyId,
        code,
        ...(input.id ? { id: { not: input.id } } : {}),
      },
      select: { id: true },
    });
    if (collision) return { error: `Ya existe un tipo con el código "${code}"` };

    const data = {
      code,
      name: input.name.trim(),
      kind: input.kind,
      scope: input.scope,
      jurisdiction: input.jurisdiction?.trim() || null,
      calculation_base: input.calculation_base,
      default_rate: input.default_rate,
      min_taxable_amount:
        input.min_taxable_amount === null || input.min_taxable_amount === undefined
          ? null
          : input.min_taxable_amount,
      is_active: input.is_active,
      notes: input.notes?.trim() || null,
    };

    if (input.id) {
      await prisma.tax_types.update({ where: { id: input.id }, data });
    } else {
      await prisma.tax_types.create({ data: { ...data, company_id: companyId } });
    }

    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error upserting tax_type:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function toggleTaxTypeActive(id: string) {
  try {
    await requirePermission('empresa.update');
    const { companyId } = await getActionContext();
    if (!companyId) return { error: 'No company selected' };

    const current = await prisma.tax_types.findFirst({
      where: { id, company_id: companyId },
      select: { id: true, is_active: true },
    });
    if (!current) return { error: 'Tipo no encontrado' };

    await prisma.tax_types.update({
      where: { id },
      data: { is_active: !current.is_active },
    });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error toggling tax_type:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteTaxType(id: string) {
  try {
    await requirePermission('empresa.update');
    const { companyId } = await getActionContext();
    if (!companyId) return { error: 'No company selected' };

    const current = await prisma.tax_types.findFirst({
      where: { id, company_id: companyId },
      select: {
        id: true,
        _count: { select: { invoice_perceptions: true, order_retentions: true } },
      },
    });
    if (!current) return { error: 'Tipo no encontrado' };

    const used = current._count.invoice_perceptions + current._count.order_retentions;
    if (used > 0) {
      return {
        error: `No se puede eliminar: ya fue usado en ${used} comprobante(s). Desactivalo en su lugar.`,
      };
    }

    await prisma.tax_types.delete({ where: { id } });
    revalidatePath('/dashboard/settings');
    return { error: null };
  } catch (error) {
    console.error('Error deleting tax_type:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
