'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import { revalidatePath } from 'next/cache';
import {
  checkSchema,
  getNextStatuses,
  type CheckFormData,
  type CheckStatusValue,
  type CheckTypeValue,
} from '../../shared/check-validators';

interface ChecksFilter {
  type?: CheckTypeValue;
  status?: CheckStatusValue;
}

export async function getChecks(filter: ChecksFilter = {}) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const where: Record<string, unknown> = { company_id: companyId };
  if (filter.type) where.type = filter.type;
  if (filter.status) where.status = filter.status;

  const checks = await prisma.checks.findMany({
    where: where as any,
    orderBy: [{ status: 'asc' }, { due_date: 'asc' }],
    include: {
      customer: { select: { name: true } },
      supplier: { select: { business_name: true } },
    },
  });

  return checks.map((c) => ({ ...c, amount: Number(c.amount) }));
}

export async function createCheck(data: CheckFormData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company selected' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { data: null, error: 'No autenticado' };

  const parsed = checkSchema.safeParse(data);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  try {
    const check = await prisma.checks.create({
      data: {
        company_id: companyId,
        type: parsed.data.type,
        status: 'PORTFOLIO',
        check_number: parsed.data.check_number,
        bank_name: parsed.data.bank_name,
        branch: parsed.data.branch || null,
        account_number: parsed.data.account_number || null,
        amount: parseFloat(parsed.data.amount),
        issue_date: new Date(parsed.data.issue_date),
        due_date: new Date(parsed.data.due_date),
        drawer_name: parsed.data.drawer_name,
        drawer_tax_id: parsed.data.drawer_tax_id || null,
        payee_name: parsed.data.payee_name || null,
        customer_id: parsed.data.customer_id || null,
        supplier_id: parsed.data.supplier_id || null,
        notes: parsed.data.notes || null,
        created_by: user.id,
      },
    });

    revalidatePath('/dashboard/treasury');
    return { data: { ...check, amount: Number(check.amount) }, error: null };
  } catch (error) {
    console.error('Error creating check:', error);
    return { data: null, error: String(error) };
  }
}

interface ChangeStatusPayload {
  status: CheckStatusValue;
  bank_account_id?: string | null;
  endorsed_to_name?: string | null;
  endorsed_to_tax_id?: string | null;
  rejection_reason?: string | null;
}

export async function changeCheckStatus(id: string, payload: ChangeStatusPayload) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  try {
    const current = await prisma.checks.findFirst({
      where: { id, company_id: companyId },
      select: { id: true, type: true, status: true },
    });
    if (!current) return { error: 'Cheque no encontrado' };

    const next = payload.status;
    const allowed = getNextStatuses(current.type as CheckTypeValue, current.status as CheckStatusValue);
    if (!allowed.includes(next)) {
      return { error: `Transición ${current.status} → ${next} no permitida para cheques ${current.type}` };
    }

    const now = new Date();
    const updates: Record<string, unknown> = { status: next };

    switch (next) {
      case 'DEPOSITED':
        updates.deposited_at = now;
        if (payload.bank_account_id) updates.bank_account_id = payload.bank_account_id;
        break;
      case 'CLEARED':
        updates.cleared_at = now;
        break;
      case 'REJECTED':
        updates.rejected_at = now;
        updates.rejection_reason = payload.rejection_reason || null;
        break;
      case 'ENDORSED':
        updates.endorsed_at = now;
        updates.endorsed_to_name = payload.endorsed_to_name || null;
        updates.endorsed_to_tax_id = payload.endorsed_to_tax_id || null;
        break;
      case 'DELIVERED':
      case 'CASHED':
      case 'VOIDED':
        // no extra fields
        break;
    }

    await prisma.checks.update({ where: { id }, data: updates });
    revalidatePath('/dashboard/treasury');
    return { error: null };
  } catch (error) {
    console.error('Error changing check status:', error);
    return { error: String(error) };
  }
}
