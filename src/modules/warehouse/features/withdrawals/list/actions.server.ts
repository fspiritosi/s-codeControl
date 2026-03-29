'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import { parseSearchParams, stateToPrismaParams, buildFiltersWhere } from '@/shared/components/common/DataTable/helpers';
import { revalidatePath } from 'next/cache';

const WO_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente',
  APPROVED: 'Aprobada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export async function getWithdrawalOrdersPaginated(searchParams: DataTableSearchParams) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);

    const where: Record<string, unknown> = { company_id: companyId };
    if (state.search) {
      where.OR = [
        { full_number: { contains: state.search, mode: 'insensitive' } },
        { employee: { firstname: { contains: state.search, mode: 'insensitive' } } },
        { employee: { lastname: { contains: state.search, mode: 'insensitive' } } },
      ];
    }
    const filtersWhere = buildFiltersWhere(state.filters, { status: 'status' });
    Object.assign(where, filtersWhere);

    const [data, total] = await Promise.all([
      prisma.withdrawal_orders.findMany({
        where: where as any,
        include: {
          warehouse: { select: { name: true, code: true } },
          employee: { select: { firstname: true, lastname: true } },
          vehicle: { select: { domain: true, intern_number: true } },
          _count: { select: { lines: true } },
        },
        skip, take,
        orderBy: { created_at: 'desc' },
      }),
      prisma.withdrawal_orders.count({ where: where as any }),
    ]);

    return { data, total };
  } catch (error) {
    console.error('Error fetching withdrawal orders:', error);
    return { data: [], total: 0 };
  }
}

export async function getWithdrawalOrderFacets(): Promise<Record<string, { value: string; count: number }[]>> {
  const { companyId } = await getActionContext();
  if (!companyId) return {};
  try {
    const groups = await prisma.withdrawal_orders.groupBy({ by: ['status'], where: { company_id: companyId }, _count: true });
    return { status: groups.map((g) => ({ value: g.status, count: g._count })) };
  } catch { return {}; }
}

export async function getWithdrawalOrderById(id: string) {
  return prisma.withdrawal_orders.findUnique({
    where: { id },
    include: {
      warehouse: { select: { name: true, code: true } },
      employee: { select: { firstname: true, lastname: true } },
      vehicle: { select: { domain: true, intern_number: true } },
      lines: { include: { product: { select: { code: true, name: true, unit_of_measure: true } } } },
    },
  });
}

export async function createWithdrawalOrder(data: {
  warehouse_id: string;
  request_date: string;
  employee_id?: string;
  vehicle_id?: string;
  notes?: string;
  lines: { product_id: string; description: string; quantity: number; notes?: string }[];
}) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  try {
    const last = await prisma.withdrawal_orders.findFirst({
      where: { company_id: companyId }, orderBy: { number: 'desc' }, select: { number: true },
    });
    const nextNumber = (last?.number || 0) + 1;
    const fullNumber = `ORM-${String(nextNumber).padStart(5, '0')}`;

    const order = await prisma.withdrawal_orders.create({
      data: {
        company_id: companyId,
        warehouse_id: data.warehouse_id,
        number: nextNumber,
        full_number: fullNumber,
        request_date: new Date(data.request_date),
        employee_id: data.employee_id || null,
        vehicle_id: data.vehicle_id || null,
        notes: data.notes || null,
        lines: { create: data.lines.map((l) => ({
          product_id: l.product_id, description: l.description,
          quantity: l.quantity, notes: l.notes || null,
        })) },
      },
    });

    revalidatePath('/dashboard/warehouse');
    return { data: { id: order.id, full_number: order.full_number }, error: null };
  } catch (error) {
    console.error('Error creating withdrawal order:', error);
    return { data: null, error: String(error) };
  }
}

export async function submitWithdrawalForApproval(id: string) {
  try {
    await prisma.withdrawal_orders.update({ where: { id, status: 'DRAFT' }, data: { status: 'PENDING_APPROVAL' } });
    revalidatePath('/dashboard/warehouse');
    return { error: null };
  } catch (error) { return { error: String(error) }; }
}

export async function approveWithdrawalOrder(id: string) {
  try {
    await prisma.withdrawal_orders.update({
      where: { id, status: 'PENDING_APPROVAL' },
      data: { status: 'APPROVED', approved_at: new Date() },
    });
    revalidatePath('/dashboard/warehouse');
    return { error: null };
  } catch (error) { return { error: String(error) }; }
}

export async function rejectWithdrawalOrder(id: string) {
  try {
    await prisma.withdrawal_orders.update({
      where: { id, status: 'PENDING_APPROVAL' },
      data: { status: 'DRAFT', approved_by: null, approved_at: null },
    });
    revalidatePath('/dashboard/warehouse');
    return { error: null };
  } catch (error) { return { error: String(error) }; }
}

export async function cancelWithdrawalOrder(id: string) {
  try {
    await prisma.withdrawal_orders.update({ where: { id }, data: { status: 'CANCELLED' } });
    revalidatePath('/dashboard/warehouse');
    return { error: null };
  } catch (error) { return { error: String(error) }; }
}

/**
 * Confirmar retiro — DECREMENTA stock del almacén
 * Solo se puede completar si está APPROVED y hay stock suficiente.
 */
export async function completeWithdrawalOrder(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  try {
    const order = await prisma.withdrawal_orders.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!order || order.status !== 'APPROVED') {
      return { error: 'La orden debe estar aprobada para completarla' };
    }

    // Validar stock suficiente para cada línea
    for (const line of order.lines) {
      const stock = await prisma.warehouse_stocks.findUnique({
        where: { warehouse_id_product_id: { warehouse_id: order.warehouse_id, product_id: line.product_id } },
      });
      if (!stock || Number(stock.available_qty) < Number(line.quantity)) {
        return { error: `Stock insuficiente para el producto (línea: ${line.description})` };
      }
    }

    const operations: any[] = [
      prisma.withdrawal_orders.update({
        where: { id },
        data: { status: 'COMPLETED', completed_at: new Date() },
      }),
    ];

    for (const line of order.lines) {
      // Decrementar stock
      operations.push(
        prisma.warehouse_stocks.update({
          where: { warehouse_id_product_id: { warehouse_id: order.warehouse_id, product_id: line.product_id } },
          data: {
            quantity: { decrement: Number(line.quantity) },
            available_qty: { decrement: Number(line.quantity) },
          },
        })
      );

      // Crear movimiento
      operations.push(
        prisma.stock_movements.create({
          data: {
            company_id: companyId,
            warehouse_id: order.warehouse_id,
            product_id: line.product_id,
            type: 'WITHDRAWAL',
            quantity: -Number(line.quantity),
            reference_type: 'withdrawal_order',
            reference_id: order.id,
            notes: order.employee_id
              ? `Retiro ORM ${order.full_number}`
              : `Retiro ORM ${order.full_number}`,
            date: new Date(),
          },
        })
      );
    }

    await prisma.$transaction(operations);

    revalidatePath('/dashboard/warehouse');
    return { error: null };
  } catch (error) {
    console.error('Error completing withdrawal order:', error);
    return { error: String(error) };
  }
}
