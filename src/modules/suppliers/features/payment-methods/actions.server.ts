'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import { revalidatePath } from 'next/cache';
import { supplierPaymentMethodSchema } from '@/modules/suppliers/shared/validators';
import {
  applyDefaultExclusivity,
  buildCreateData,
  buildUpdateData,
} from './sync';

export async function listSupplierPaymentMethods(supplierId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  return prisma.supplier_payment_methods.findMany({
    where: { supplier_id: supplierId, company_id: companyId, status: 'ACTIVE' },
    orderBy: [{ is_default: 'desc' }, { created_at: 'asc' }],
  });
}

export async function createSupplierPaymentMethod(
  supplierId: string,
  rawInput: unknown,
) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company selected' };

  const parsed = supplierPaymentMethodSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const user = await fetchCurrentUser();
  const userId = user?.id ?? null;

  try {
    const created = await prisma.$transaction(async (tx) => {
      if (parsed.data.is_default) {
        await applyDefaultExclusivity(tx, supplierId);
      }
      return tx.supplier_payment_methods.create({
        data: buildCreateData(parsed.data, supplierId, companyId, userId),
      });
    });

    revalidatePath('/dashboard/purchasing');
    revalidatePath(`/dashboard/suppliers/${supplierId}`);
    return { data: created, error: null };
  } catch (error) {
    console.error('Error creating supplier payment method:', error);
    return { data: null, error: String(error) };
  }
}

export async function updateSupplierPaymentMethod(id: string, rawInput: unknown) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company selected' };

  const parsed = supplierPaymentMethodSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const existing = await prisma.supplier_payment_methods.findFirst({
    where: { id, company_id: companyId },
    select: { supplier_id: true },
  });
  if (!existing) return { data: null, error: 'Método de pago no encontrado' };

  const user = await fetchCurrentUser();
  const userId = user?.id ?? null;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (parsed.data.is_default) {
        await applyDefaultExclusivity(tx, existing.supplier_id, id);
      }
      return tx.supplier_payment_methods.update({
        where: { id },
        data: buildUpdateData(parsed.data, userId),
      });
    });

    revalidatePath('/dashboard/purchasing');
    revalidatePath(`/dashboard/suppliers/${existing.supplier_id}`);
    return { data: updated, error: null };
  } catch (error) {
    console.error('Error updating supplier payment method:', error);
    return { data: null, error: String(error) };
  }
}

export async function deleteSupplierPaymentMethod(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  const existing = await prisma.supplier_payment_methods.findFirst({
    where: { id, company_id: companyId },
    select: { supplier_id: true },
  });
  if (!existing) return { error: 'Método de pago no encontrado' };

  const user = await fetchCurrentUser();
  const userId = user?.id ?? null;

  try {
    await prisma.supplier_payment_methods.update({
      where: { id },
      data: { status: 'INACTIVE', is_default: false, updated_by: userId },
    });
    revalidatePath('/dashboard/purchasing');
    revalidatePath(`/dashboard/suppliers/${existing.supplier_id}`);
    return { error: null };
  } catch (error) {
    console.error('Error deleting supplier payment method:', error);
    return { error: String(error) };
  }
}
