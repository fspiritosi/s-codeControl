'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import { revalidatePath } from 'next/cache';
import {
  bankMovementSchema,
  isIncomingMovement,
  type BankMovementFormData,
} from '../../shared/bank-validators';

export async function getMovementsByBankAccount(bankAccountId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const movements = await prisma.bank_movements.findMany({
    where: { bank_account_id: bankAccountId, company_id: companyId },
    orderBy: { date: 'desc' },
  });

  return movements.map((m) => ({ ...m, amount: Number(m.amount) }));
}

export async function createBankMovement(data: BankMovementFormData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company selected' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { data: null, error: 'No autenticado' };

  const parsed = bankMovementSchema.safeParse(data);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  try {
    const account = await prisma.bank_accounts.findFirst({
      where: { id: parsed.data.bank_account_id, company_id: companyId },
      select: { id: true, balance: true, status: true },
    });
    if (!account) return { data: null, error: 'Cuenta no encontrada' };
    if (account.status === 'CLOSED') return { data: null, error: 'La cuenta está cerrada' };

    const amount = parseFloat(parsed.data.amount);
    const delta = isIncomingMovement(parsed.data.type) ? amount : -amount;

    const [movement] = await prisma.$transaction([
      prisma.bank_movements.create({
        data: {
          bank_account_id: parsed.data.bank_account_id,
          company_id: companyId,
          type: parsed.data.type,
          amount,
          date: new Date(parsed.data.date),
          description: parsed.data.description,
          reference: parsed.data.reference || null,
          statement_number: parsed.data.statement_number || null,
          created_by: user.id,
        },
      }),
      prisma.bank_accounts.update({
        where: { id: parsed.data.bank_account_id },
        data: { balance: Number(account.balance) + delta },
      }),
    ]);

    revalidatePath(`/dashboard/treasury/bank-accounts/${parsed.data.bank_account_id}`);
    return { data: { ...movement, amount: Number(movement.amount) }, error: null };
  } catch (error) {
    console.error('Error creating bank movement:', error);
    return { data: null, error: String(error) };
  }
}

export async function toggleMovementReconciled(movementId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { error: 'No autenticado' };

  try {
    const current = await prisma.bank_movements.findFirst({
      where: { id: movementId, company_id: companyId },
      select: { id: true, reconciled: true, bank_account_id: true },
    });
    if (!current) return { error: 'Movimiento no encontrado' };

    const nextReconciled = !current.reconciled;
    await prisma.bank_movements.update({
      where: { id: movementId },
      data: {
        reconciled: nextReconciled,
        reconciled_at: nextReconciled ? new Date() : null,
        reconciled_by: nextReconciled ? user.id : null,
      },
    });

    revalidatePath(`/dashboard/treasury/bank-accounts/${current.bank_account_id}`);
    return { error: null };
  } catch (error) {
    console.error('Error toggling reconciled:', error);
    return { error: String(error) };
  }
}
