/**
 * Internal helpers for managing supplier_payment_methods within a Prisma
 * transaction. Used by both this feature's server actions and by
 * createSupplier/updateSupplier in the list feature.
 *
 * NOTE: This file is intentionally NOT a server-action module
 * ('use server' is forbidden here): it exports synchronous helpers and a
 * non-action async function that takes a TransactionClient as argument.
 */

import type { Prisma } from '@/generated/prisma/client';
import type { SupplierPaymentMethodInput } from '@/modules/suppliers/shared/validators';

type Tx = Prisma.TransactionClient;

export async function applyDefaultExclusivity(
  tx: Tx,
  supplierId: string,
  excludeId?: string,
) {
  await tx.supplier_payment_methods.updateMany({
    where: {
      supplier_id: supplierId,
      is_default: true,
      status: 'ACTIVE',
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    data: { is_default: false },
  });
}

export function buildCreateData(
  input: SupplierPaymentMethodInput,
  supplierId: string,
  companyId: string,
  userId: string | null,
) {
  const base = {
    supplier_id: supplierId,
    company_id: companyId,
    type: input.type as 'CHECK' | 'ACCOUNT',
    is_default: input.is_default ?? false,
    status: 'ACTIVE' as const,
    created_by: userId,
    updated_by: userId,
  };

  if (input.type === 'ACCOUNT') {
    return {
      ...base,
      bank_name: input.bank_name,
      account_holder: input.account_holder,
      account_holder_tax_id: input.account_holder_tax_id.replace(/-/g, ''),
      account_type: input.account_type,
      cbu: input.cbu,
      alias: input.alias && input.alias.length > 0 ? input.alias : null,
      currency: input.currency ?? 'ARS',
    };
  }

  return base;
}

export function buildUpdateData(
  input: SupplierPaymentMethodInput,
  userId: string | null,
) {
  if (input.type === 'ACCOUNT') {
    return {
      type: 'ACCOUNT' as const,
      bank_name: input.bank_name,
      account_holder: input.account_holder,
      account_holder_tax_id: input.account_holder_tax_id.replace(/-/g, ''),
      account_type: input.account_type,
      cbu: input.cbu,
      alias: input.alias && input.alias.length > 0 ? input.alias : null,
      currency: input.currency ?? 'ARS',
      is_default: input.is_default ?? false,
      updated_by: userId,
    };
  }

  return {
    type: 'CHECK' as const,
    is_default: input.is_default ?? false,
    updated_by: userId,
  };
}

/**
 * Sync the full array of payment methods for a supplier.
 * - Items with id and present in input → update.
 * - Items without id → create.
 * - Existing active items not present in input → soft delete (status=INACTIVE).
 * Runs inside the provided transaction.
 */
export async function syncSupplierPaymentMethodsTx(
  tx: Tx,
  supplierId: string,
  companyId: string,
  userId: string | null,
  inputs: SupplierPaymentMethodInput[],
) {
  const existing = await tx.supplier_payment_methods.findMany({
    where: { supplier_id: supplierId, company_id: companyId, status: 'ACTIVE' },
    select: { id: true },
  });
  const existingIds = new Set<string>(existing.map((e: { id: string }) => e.id));
  const incomingIds = new Set<string>(
    inputs.filter((i): i is SupplierPaymentMethodInput & { id: string } => Boolean(i.id)).map((i) => i.id),
  );

  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    await tx.supplier_payment_methods.updateMany({
      where: { id: { in: toDelete } },
      data: { status: 'INACTIVE', is_default: false, updated_by: userId },
    });
  }

  const hasDefault = inputs.some((i) => i.is_default);
  if (hasDefault) {
    await applyDefaultExclusivity(tx, supplierId);
  }

  for (const input of inputs) {
    if (input.id && existingIds.has(input.id)) {
      await tx.supplier_payment_methods.update({
        where: { id: input.id },
        data: buildUpdateData(input, userId),
      });
    } else {
      await tx.supplier_payment_methods.create({
        data: buildCreateData(input, supplierId, companyId, userId),
      });
    }
  }
}
