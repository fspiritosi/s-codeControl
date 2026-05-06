'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildFiltersWhere,
} from '@/shared/components/common/DataTable/helpers';
import { revalidatePath } from 'next/cache';
import { cashRegisterSchema, type CashRegisterFormData } from '../../shared/validators';

const cashRegistersColumnMap: Record<string, string> = { status: 'status' };

export async function getCashRegistersPaginated(searchParams: DataTableSearchParams) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);

    const where: Record<string, unknown> = { company_id: companyId };
    if (state.search) {
      where.OR = [
        { code: { contains: state.search, mode: 'insensitive' } },
        { name: { contains: state.search, mode: 'insensitive' } },
        { location: { contains: state.search, mode: 'insensitive' } },
      ];
    }
    Object.assign(where, buildFiltersWhere(state.filters, cashRegistersColumnMap));

    const [data, total] = await Promise.all([
      prisma.cash_registers.findMany({
        where: where as any,
        skip,
        take,
        orderBy: [{ status: 'asc' }, { code: 'asc' }],
      }),
      prisma.cash_registers.count({ where: where as any }),
    ]);

    return { data, total };
  } catch (error) {
    console.error('Error fetching cash registers:', error);
    return { data: [], total: 0 };
  }
}

export async function getCashRegisterFacets(): Promise<
  Record<string, { value: string; count: number }[]>
> {
  const { companyId } = await getActionContext();
  if (!companyId) return {};

  try {
    const groups = await prisma.cash_registers.groupBy({
      by: ['status'],
      where: { company_id: companyId },
      _count: true,
    });
    return { status: groups.map((g) => ({ value: g.status, count: g._count })) };
  } catch (error) {
    console.error('Error fetching cash register facets:', error);
    return {};
  }
}

export async function getAllCashRegisters() {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const registers = await prisma.cash_registers.findMany({
    where: { company_id: companyId, status: 'ACTIVE' },
    orderBy: { code: 'asc' },
  });

  if (registers.length === 0) return [];

  // Cajas con sesión abierta (para que la UI pueda deshabilitar las que no).
  const openSessions = await prisma.cash_register_sessions.findMany({
    where: {
      company_id: companyId,
      cash_register_id: { in: registers.map((r) => r.id) },
      status: 'OPEN',
    },
    select: { cash_register_id: true },
  });
  const openSet = new Set(openSessions.map((s) => s.cash_register_id));

  return registers.map((r) => ({ ...r, has_open_session: openSet.has(r.id) }));
}

export async function getCashRegisterById(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return null;
  return prisma.cash_registers.findFirst({ where: { id, company_id: companyId } });
}

export async function createCashRegister(data: CashRegisterFormData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company selected' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { data: null, error: 'No autenticado' };

  const parsed = cashRegisterSchema.safeParse(data);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  try {
    const existing = await prisma.cash_registers.findFirst({
      where: { company_id: companyId, code: parsed.data.code },
      select: { id: true },
    });
    if (existing) return { data: null, error: 'Ya existe una caja con ese código' };

    if (parsed.data.is_default) {
      await prisma.cash_registers.updateMany({
        where: { company_id: companyId, is_default: true },
        data: { is_default: false },
      });
    }

    const cashRegister = await prisma.cash_registers.create({
      data: {
        company_id: companyId,
        code: parsed.data.code,
        name: parsed.data.name,
        location: parsed.data.location || null,
        is_default: parsed.data.is_default,
        created_by: user.id,
      },
    });

    revalidatePath('/dashboard/treasury');
    return { data: cashRegister, error: null };
  } catch (error) {
    console.error('Error creating cash register:', error);
    return { data: null, error: String(error) };
  }
}

export async function updateCashRegister(id: string, data: CashRegisterFormData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company selected' };

  const parsed = cashRegisterSchema.safeParse(data);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  try {
    const current = await prisma.cash_registers.findFirst({
      where: { id, company_id: companyId },
      select: { id: true, code: true },
    });
    if (!current) return { data: null, error: 'Caja no encontrada' };

    if (parsed.data.code !== current.code) {
      const dup = await prisma.cash_registers.findFirst({
        where: { company_id: companyId, code: parsed.data.code, NOT: { id } },
        select: { id: true },
      });
      if (dup) return { data: null, error: 'Ya existe una caja con ese código' };
    }

    if (parsed.data.is_default) {
      await prisma.cash_registers.updateMany({
        where: { company_id: companyId, is_default: true, NOT: { id } },
        data: { is_default: false },
      });
    }

    const updated = await prisma.cash_registers.update({
      where: { id },
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        location: parsed.data.location || null,
        is_default: parsed.data.is_default,
      },
    });

    revalidatePath('/dashboard/treasury');
    revalidatePath(`/dashboard/treasury/cash-registers/${id}`);
    return { data: updated, error: null };
  } catch (error) {
    console.error('Error updating cash register:', error);
    return { data: null, error: String(error) };
  }
}

export async function toggleCashRegisterActive(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  try {
    const current = await prisma.cash_registers.findFirst({
      where: { id, company_id: companyId },
      select: { status: true },
    });
    if (!current) return { error: 'Caja no encontrada' };

    const nextStatus = current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    if (nextStatus === 'INACTIVE') {
      const openSession = await prisma.cash_register_sessions.findFirst({
        where: { cash_register_id: id, status: 'OPEN' },
        select: { id: true },
      });
      if (openSession) return { error: 'No se puede desactivar: tiene una sesión abierta' };
    }

    await prisma.cash_registers.update({ where: { id }, data: { status: nextStatus } });
    revalidatePath('/dashboard/treasury');
    return { error: null };
  } catch (error) {
    console.error('Error toggling cash register:', error);
    return { error: String(error) };
  }
}
