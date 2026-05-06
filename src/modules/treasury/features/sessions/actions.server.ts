'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import { revalidatePath } from 'next/cache';
import {
  openSessionSchema,
  closeSessionSchema,
  type OpenSessionFormData,
  type CloseSessionFormData,
} from '../../shared/validators';

export async function getSessionsByCashRegister(cashRegisterId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const sessions = await prisma.cash_register_sessions.findMany({
    where: { cash_register_id: cashRegisterId, company_id: companyId },
    orderBy: { session_number: 'desc' },
  });

  return sessions.map((s) => ({
    ...s,
    opening_balance: Number(s.opening_balance),
    expected_balance: Number(s.expected_balance),
    actual_balance: s.actual_balance !== null ? Number(s.actual_balance) : null,
    difference: s.difference !== null ? Number(s.difference) : null,
  }));
}

export async function getActiveSession(cashRegisterId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  const session = await prisma.cash_register_sessions.findFirst({
    where: { cash_register_id: cashRegisterId, company_id: companyId, status: 'OPEN' },
  });
  if (!session) return null;
  return {
    ...session,
    opening_balance: Number(session.opening_balance),
    expected_balance: Number(session.expected_balance),
    actual_balance: session.actual_balance !== null ? Number(session.actual_balance) : null,
    difference: session.difference !== null ? Number(session.difference) : null,
  };
}

export async function openSession(data: OpenSessionFormData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company selected' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { data: null, error: 'No autenticado' };

  const parsed = openSessionSchema.safeParse(data);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  try {
    const register = await prisma.cash_registers.findFirst({
      where: { id: parsed.data.cash_register_id, company_id: companyId },
      select: { id: true, status: true },
    });
    if (!register) return { data: null, error: 'Caja no encontrada' };
    if (register.status !== 'ACTIVE') return { data: null, error: 'La caja está inactiva' };

    const existingOpen = await prisma.cash_register_sessions.findFirst({
      where: { cash_register_id: parsed.data.cash_register_id, status: 'OPEN' },
      select: { id: true },
    });
    if (existingOpen) return { data: null, error: 'Ya hay una sesión abierta' };

    const last = await prisma.cash_register_sessions.findFirst({
      where: { cash_register_id: parsed.data.cash_register_id },
      orderBy: { session_number: 'desc' },
      select: { session_number: true },
    });
    const nextNumber = (last?.session_number ?? 0) + 1;
    const openingBalance = parseFloat(parsed.data.opening_balance);

    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.cash_register_sessions.create({
        data: {
          cash_register_id: parsed.data.cash_register_id,
          company_id: companyId,
          session_number: nextNumber,
          status: 'OPEN',
          opening_balance: openingBalance,
          expected_balance: openingBalance,
          opening_notes: parsed.data.opening_notes || null,
          opened_by: user.id!,
        },
      });

      await tx.cash_movements.create({
        data: {
          session_id: created.id,
          cash_register_id: parsed.data.cash_register_id,
          company_id: companyId,
          type: 'OPENING',
          amount: openingBalance,
          description: 'Apertura de sesión',
          created_by: user.id!,
        },
      });

      return created;
    });

    revalidatePath(`/dashboard/treasury/cash-registers/${parsed.data.cash_register_id}`);
    // También invalida la lista de cajas y el form de OP (que filtran por has_open_session).
    revalidatePath('/dashboard/treasury', 'layout');
    return { data: session, error: null };
  } catch (error) {
    console.error('Error opening session:', error);
    return { data: null, error: String(error) };
  }
}

export async function closeSession(data: CloseSessionFormData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company selected' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { data: null, error: 'No autenticado' };

  const parsed = closeSessionSchema.safeParse(data);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  try {
    const session = await prisma.cash_register_sessions.findFirst({
      where: { id: parsed.data.session_id, company_id: companyId, status: 'OPEN' },
    });
    if (!session) return { data: null, error: 'Sesión abierta no encontrada' };

    const movements = await prisma.cash_movements.findMany({
      where: { session_id: session.id, type: { in: ['INCOME', 'EXPENSE', 'ADJUSTMENT'] } },
      select: { type: true, amount: true },
    });

    const income = movements
      .filter((m) => m.type === 'INCOME')
      .reduce((acc, m) => acc + Number(m.amount), 0);
    const expense = movements
      .filter((m) => m.type === 'EXPENSE')
      .reduce((acc, m) => acc + Number(m.amount), 0);
    const adjustment = movements
      .filter((m) => m.type === 'ADJUSTMENT')
      .reduce((acc, m) => acc + Number(m.amount), 0);

    const expected = Number(session.opening_balance) + income - expense + adjustment;
    const actual = parseFloat(parsed.data.actual_balance);
    const difference = Math.round((actual - expected) * 100) / 100;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.cash_movements.create({
        data: {
          session_id: session.id,
          cash_register_id: session.cash_register_id,
          company_id: companyId,
          type: 'CLOSING',
          amount: actual,
          description: 'Cierre de sesión',
          created_by: user.id!,
        },
      });

      return tx.cash_register_sessions.update({
        where: { id: session.id },
        data: {
          status: 'CLOSED',
          expected_balance: expected,
          actual_balance: actual,
          difference,
          closing_notes: parsed.data.closing_notes || null,
          closed_by: user.id!,
          closed_at: new Date(),
        },
      });
    });

    revalidatePath(`/dashboard/treasury/cash-registers/${session.cash_register_id}`);
    revalidatePath('/dashboard/treasury', 'layout');
    return { data: updated, error: null };
  } catch (error) {
    console.error('Error closing session:', error);
    return { data: null, error: String(error) };
  }
}
