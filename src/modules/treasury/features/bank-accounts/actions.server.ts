'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import { revalidatePath } from 'next/cache';
import { bankAccountSchema, type BankAccountFormData } from '../../shared/bank-validators';

export async function getAllBankAccounts() {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const data = await prisma.bank_accounts.findMany({
    where: { company_id: companyId },
    orderBy: [{ status: 'asc' }, { bank_name: 'asc' }],
  });

  return data.map((a) => ({ ...a, balance: Number(a.balance) }));
}

export async function getBankAccountById(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  const account = await prisma.bank_accounts.findFirst({
    where: { id, company_id: companyId },
  });
  if (!account) return null;

  return { ...account, balance: Number(account.balance) };
}

export async function createBankAccount(data: BankAccountFormData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company selected' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { data: null, error: 'No autenticado' };

  const parsed = bankAccountSchema.safeParse(data);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  try {
    const existing = await prisma.bank_accounts.findFirst({
      where: { company_id: companyId, account_number: parsed.data.account_number },
      select: { id: true },
    });
    if (existing) return { data: null, error: 'Ya existe una cuenta con ese número' };

    const account = await prisma.bank_accounts.create({
      data: {
        company_id: companyId,
        bank_name: parsed.data.bank_name,
        account_number: parsed.data.account_number,
        account_type: parsed.data.account_type,
        cbu: parsed.data.cbu || null,
        alias: parsed.data.alias || null,
        currency: parsed.data.currency,
        balance: parseFloat(parsed.data.balance),
        created_by: user.id,
      },
    });

    revalidatePath('/dashboard/treasury');
    return { data: { ...account, balance: Number(account.balance) }, error: null };
  } catch (error) {
    console.error('Error creating bank account:', error);
    return { data: null, error: String(error) };
  }
}

export async function updateBankAccount(id: string, data: BankAccountFormData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company selected' };

  const parsed = bankAccountSchema.safeParse(data);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  try {
    const current = await prisma.bank_accounts.findFirst({
      where: { id, company_id: companyId },
      select: { id: true, account_number: true },
    });
    if (!current) return { data: null, error: 'Cuenta no encontrada' };

    if (parsed.data.account_number !== current.account_number) {
      const dup = await prisma.bank_accounts.findFirst({
        where: {
          company_id: companyId,
          account_number: parsed.data.account_number,
          NOT: { id },
        },
        select: { id: true },
      });
      if (dup) return { data: null, error: 'Ya existe una cuenta con ese número' };
    }

    const updated = await prisma.bank_accounts.update({
      where: { id },
      data: {
        bank_name: parsed.data.bank_name,
        account_number: parsed.data.account_number,
        account_type: parsed.data.account_type,
        cbu: parsed.data.cbu || null,
        alias: parsed.data.alias || null,
        currency: parsed.data.currency,
      },
    });

    revalidatePath('/dashboard/treasury');
    revalidatePath(`/dashboard/treasury/bank-accounts/${id}`);
    return { data: { ...updated, balance: Number(updated.balance) }, error: null };
  } catch (error) {
    console.error('Error updating bank account:', error);
    return { data: null, error: String(error) };
  }
}

export async function setBankAccountStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'CLOSED') {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  try {
    const current = await prisma.bank_accounts.findFirst({
      where: { id, company_id: companyId },
      select: { id: true },
    });
    if (!current) return { error: 'Cuenta no encontrada' };

    await prisma.bank_accounts.update({ where: { id }, data: { status } });
    revalidatePath('/dashboard/treasury');
    revalidatePath(`/dashboard/treasury/bank-accounts/${id}`);
    return { error: null };
  } catch (error) {
    console.error('Error setting bank account status:', error);
    return { error: String(error) };
  }
}
