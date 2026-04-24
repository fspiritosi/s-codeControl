'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import { revalidatePath } from 'next/cache';
import { cashMovementSchema, type CashMovementFormData } from '../../shared/validators';

export async function getMovementsBySession(sessionId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const movements = await prisma.cash_movements.findMany({
    where: { session_id: sessionId, company_id: companyId },
    orderBy: { date: 'asc' },
  });

  return movements.map((m) => ({ ...m, amount: Number(m.amount) }));
}

export async function createCashMovement(data: CashMovementFormData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company selected' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { data: null, error: 'No autenticado' };

  const parsed = cashMovementSchema.safeParse(data);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  try {
    const session = await prisma.cash_register_sessions.findFirst({
      where: { id: parsed.data.session_id, company_id: companyId },
      select: { id: true, status: true, cash_register_id: true },
    });
    if (!session) return { data: null, error: 'Sesión no encontrada' };
    if (session.status !== 'OPEN') return { data: null, error: 'La sesión está cerrada' };
    if (session.cash_register_id !== parsed.data.cash_register_id) {
      return { data: null, error: 'Caja no coincide con la sesión' };
    }

    const movement = await prisma.cash_movements.create({
      data: {
        session_id: parsed.data.session_id,
        cash_register_id: parsed.data.cash_register_id,
        company_id: companyId,
        type: parsed.data.type,
        amount: parseFloat(parsed.data.amount),
        description: parsed.data.description,
        reference: parsed.data.reference || null,
        purchase_invoice_id: parsed.data.purchase_invoice_id || null,
        created_by: user.id,
      },
    });

    revalidatePath(`/dashboard/treasury/cash-registers/${session.cash_register_id}`);
    return { data: { ...movement, amount: Number(movement.amount) }, error: null };
  } catch (error) {
    console.error('Error creating cash movement:', error);
    return { data: null, error: String(error) };
  }
}
