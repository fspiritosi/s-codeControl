'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { requirePermission } from '@/shared/lib/permissions';
import { fetchCurrentUser } from '@/shared/actions/auth';
import { revalidatePath } from 'next/cache';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildFiltersWhere,
  buildTextFiltersWhere,
  buildDateRangeFiltersWhere,
} from '@/shared/components/common/DataTable/helpers';
import type { ExpenseFormInput, ExpenseCategoryFormInput } from './validators';

// ============================================
// HELPERS
// ============================================

const REVALIDATE_PATH = '/dashboard/purchasing';

/**
 * Normaliza una fecha @db.Date (medianoche UTC) a mediodia UTC
 * para evitar desplazamiento de dia por timezone del cliente.
 */
function normalizeDbDate(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

function normalizeDbDateNullable(date: Date | null): Date | null {
  return date ? normalizeDbDate(date) : null;
}

// ============================================
// CATEGORIAS DE GASTOS
// ============================================

/**
 * Obtiene las categorias de gastos activas de la empresa (para selects)
 */
export async function getExpenseCategories() {
  await requirePermission('compras.gastos.view');
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  return prisma.expense_categories.findMany({
    where: { company_id: companyId, is_active: true },
    select: {
      id: true,
      name: true,
      description: true,
      is_active: true,
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Obtiene todas las categorias (incluye inactivas + count de gastos) para gestion
 */
export async function getAllExpenseCategories() {
  await requirePermission('compras.gastos.view');
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  return prisma.expense_categories.findMany({
    where: { company_id: companyId },
    select: {
      id: true,
      name: true,
      description: true,
      is_active: true,
      _count: { select: { expenses: true } },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Crea una nueva categoria de gastos
 */
export async function createExpenseCategory(data: ExpenseCategoryFormInput) {
  await requirePermission('compras.gastos.create');
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No hay empresa activa');

  try {
    const category = await prisma.expense_categories.create({
      data: {
        company_id: companyId,
        name: data.name,
        description: data.description || null,
      },
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true, id: category.id };
  } catch (error) {
    if ((error as any)?.code === 'P2002') {
      throw new Error('Ya existe una categoria con ese nombre');
    }
    console.error('Error al crear categoria de gasto:', error);
    throw new Error('Error al crear categoria de gasto');
  }
}

/**
 * Actualiza una categoria de gastos
 */
export async function updateExpenseCategory(id: string, data: ExpenseCategoryFormInput) {
  await requirePermission('compras.gastos.update');
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No hay empresa activa');

  try {
    const result = await prisma.expense_categories.updateMany({
      where: { id, company_id: companyId },
      data: {
        name: data.name,
        description: data.description || null,
      },
    });

    if (result.count === 0) throw new Error('Categoria no encontrada');

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error) {
    if ((error as any)?.code === 'P2002') {
      throw new Error('Ya existe una categoria con ese nombre');
    }
    if (error instanceof Error) throw error;
    console.error('Error al actualizar categoria de gasto:', error);
    throw new Error('Error al actualizar categoria de gasto');
  }
}

/**
 * Activa/desactiva una categoria de gastos
 */
export async function toggleExpenseCategory(id: string) {
  await requirePermission('compras.gastos.update');
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No hay empresa activa');

  try {
    const category = await prisma.expense_categories.findFirst({
      where: { id, company_id: companyId },
      select: { is_active: true },
    });

    if (!category) throw new Error('Categoria no encontrada');

    await prisma.expense_categories.updateMany({
      where: { id, company_id: companyId },
      data: { is_active: !category.is_active },
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error('Error al cambiar estado de categoria:', error);
    throw new Error('Error al cambiar estado de categoria');
  }
}

// ============================================
// GASTOS - CRUD
// ============================================

/**
 * Obtiene gastos con paginacion server-side para DataTable
 */
export async function getExpensesPaginated(searchParams: DataTableSearchParams) {
  await requirePermission('compras.gastos.view');
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);

    const where: Record<string, unknown> = { company_id: companyId };

    // Global search
    if (state.search) {
      where.OR = [
        { full_number: { contains: state.search, mode: 'insensitive' } },
        { description: { contains: state.search, mode: 'insensitive' } },
        { supplier: { business_name: { contains: state.search, mode: 'insensitive' } } },
        { category: { name: { contains: state.search, mode: 'insensitive' } } },
      ];
    }

    // Faceted filters: status, category_id
    const filtersWhere = buildFiltersWhere(state.filters, {
      status: 'status',
      category_id: 'category_id',
    });
    Object.assign(where, filtersWhere);

    // Text filters: full_number
    const textWhere = buildTextFiltersWhere(state.filters, ['full_number']);
    Object.assign(where, textWhere);

    // Text filter for supplier (nested relation)
    const supplierFilter = state.filters.supplier?.[0];
    if (supplierFilter) {
      where.supplier = {
        business_name: { contains: supplierFilter, mode: 'insensitive' },
      };
    }

    // Date range filters: date, due_date
    const dateWhere = buildDateRangeFiltersWhere(state.filters, ['date', 'due_date']);
    Object.assign(where, dateWhere);

    // Sorting
    const sortByField = state.sortBy;
    let orderBy: any;

    if (sortByField === 'supplier' || sortByField === 'supplier_name') {
      orderBy = { supplier: { business_name: state.sortOrder } };
    } else if (sortByField === 'category' || sortByField === 'category_name') {
      orderBy = { category: { name: state.sortOrder } };
    } else if (sortByField) {
      orderBy = { [sortByField]: state.sortOrder };
    } else {
      orderBy = { number: 'desc' as const };
    }

    const [data, total] = await Promise.all([
      prisma.expenses.findMany({
        where: where as any,
        select: {
          id: true,
          number: true,
          full_number: true,
          description: true,
          amount: true,
          date: true,
          due_date: true,
          status: true,
          created_at: true,
          category: {
            select: { id: true, name: true },
          },
          supplier: {
            select: { id: true, business_name: true },
          },
          _count: {
            select: { expense_attachments: true, payment_order_items: true },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.expenses.count({ where: where as any }),
    ]);

    return {
      data: data.map((expense) => ({
        ...expense,
        amount: Number(expense.amount),
        date: normalizeDbDate(expense.date),
        due_date: normalizeDbDateNullable(expense.due_date),
      })),
      total,
    };
  } catch (error) {
    console.error('Error al obtener gastos paginados:', error);
    return { data: [], total: 0 };
  }
}

/**
 * Facet counts por status y category_id para filtros faceted del DataTable
 */
export async function getExpenseFacetCounts(): Promise<Record<string, { value: string; count: number }[]>> {
  await requirePermission('compras.gastos.view');
  const { companyId } = await getActionContext();
  if (!companyId) return {};

  try {
    const [statusGroups, categoryGroups] = await Promise.all([
      prisma.expenses.groupBy({
        by: ['status'],
        where: { company_id: companyId },
        _count: true,
      }),
      prisma.expenses.groupBy({
        by: ['category_id'],
        where: { company_id: companyId },
        _count: true,
      }),
    ]);

    return {
      status: statusGroups.map((g) => ({ value: g.status, count: g._count })),
      category_id: categoryGroups.map((g) => ({ value: g.category_id, count: g._count })),
    };
  } catch (error) {
    return {};
  }
}

/**
 * Obtiene el detalle de un gasto con adjuntos e items de OP
 */
export async function getExpenseById(id: string) {
  await requirePermission('compras.gastos.view');
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No hay empresa activa');

  try {
    const expense = await prisma.expenses.findFirst({
      where: { id, company_id: companyId },
      select: {
        id: true,
        number: true,
        full_number: true,
        description: true,
        amount: true,
        date: true,
        due_date: true,
        status: true,
        notes: true,
        created_by: true,
        created_at: true,
        category: {
          select: { id: true, name: true },
        },
        supplier: {
          select: { id: true, business_name: true, tax_id: true },
        },
        expense_attachments: {
          select: {
            id: true,
            file_name: true,
            file_size: true,
            mime_type: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
        },
        payment_order_items: {
          select: {
            id: true,
            amount: true,
            payment_order: {
              select: {
                id: true,
                full_number: true,
                date: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!expense) throw new Error('Gasto no encontrado');

    // Calcular monto pagado (solo items de OPs confirmadas/pagadas)
    const paidAmount = expense.payment_order_items
      .filter((item) => item.payment_order.status === 'CONFIRMED')
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      ...expense,
      amount: Number(expense.amount),
      date: normalizeDbDate(expense.date),
      due_date: normalizeDbDateNullable(expense.due_date),
      paidAmount,
      pendingAmount: Number(expense.amount) - paidAmount,
      payment_order_items: expense.payment_order_items.map((item) => ({
        ...item,
        amount: Number(item.amount),
      })),
    };
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error('Error al obtener gasto:', error);
    throw new Error('Error al obtener gasto');
  }
}

/**
 * Crea un nuevo gasto (borrador) con numeracion secuencial GTO-XXXXX
 */
export async function createExpense(data: ExpenseFormInput) {
  await requirePermission('compras.gastos.create');
  const user = await fetchCurrentUser();
  if (!user?.id) throw new Error('No autenticado');

  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No hay empresa activa');

  try {
    const lastExpense = await prisma.expenses.findFirst({
      where: { company_id: companyId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    const nextNumber = (lastExpense?.number ?? 0) + 1;
    const fullNumber = `GTO-${String(nextNumber).padStart(5, '0')}`;

    const expense = await prisma.expenses.create({
      data: {
        company_id: companyId,
        number: nextNumber,
        full_number: fullNumber,
        description: data.description,
        amount: parseFloat(data.amount),
        date: data.date,
        due_date: data.due_date || null,
        category_id: data.category_id,
        supplier_id: data.supplier_id || null,
        notes: data.notes || null,
        status: 'DRAFT',
        created_by: user.id,
      },
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true, id: expense.id };
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error('Error al crear gasto:', error);
    throw new Error('Error al crear gasto');
  }
}

/**
 * Actualiza un gasto (solo si esta en DRAFT)
 */
export async function updateExpense(id: string, data: ExpenseFormInput) {
  await requirePermission('compras.gastos.update');
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No hay empresa activa');

  try {
    const existing = await prisma.expenses.findFirst({
      where: { id, company_id: companyId, status: 'DRAFT' },
      select: { id: true },
    });

    if (!existing) throw new Error('Gasto no encontrado o no esta en estado borrador');

    await prisma.expenses.update({
      where: { id },
      data: {
        description: data.description,
        amount: parseFloat(data.amount),
        date: data.date,
        due_date: data.due_date || null,
        category_id: data.category_id,
        supplier_id: data.supplier_id || null,
        notes: data.notes || null,
      },
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error('Error al actualizar gasto:', error);
    throw new Error('Error al actualizar gasto');
  }
}

/**
 * Confirma un gasto: DRAFT -> CONFIRMED
 */
export async function confirmExpense(id: string) {
  await requirePermission('compras.gastos.confirm');
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No hay empresa activa');

  try {
    const expense = await prisma.expenses.findFirst({
      where: { id, company_id: companyId, status: 'DRAFT' },
      select: { id: true },
    });

    if (!expense) throw new Error('Gasto no encontrado o ya confirmado');

    await prisma.expenses.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error('Error al confirmar gasto:', error);
    throw new Error('Error al confirmar gasto');
  }
}

/**
 * Cancela un gasto (solo DRAFT o CONFIRMED sin pagos confirmados)
 */
export async function cancelExpense(id: string) {
  await requirePermission('compras.gastos.delete');
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No hay empresa activa');

  try {
    const expense = await prisma.expenses.findFirst({
      where: {
        id,
        company_id: companyId,
        status: { in: ['DRAFT', 'CONFIRMED'] },
      },
      select: {
        id: true,
        status: true,
        payment_order_items: {
          where: { payment_order: { status: 'CONFIRMED' } },
          select: { id: true },
        },
      },
    });

    if (!expense) throw new Error('Gasto no encontrado o no se puede cancelar');

    if (expense.payment_order_items.length > 0) {
      throw new Error('No se puede cancelar un gasto con pagos confirmados');
    }

    await prisma.expenses.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error('Error al cancelar gasto:', error);
    throw new Error('Error al cancelar gasto');
  }
}

/**
 * Elimina un gasto (solo DRAFT, hard delete)
 */
export async function deleteExpense(id: string) {
  await requirePermission('compras.gastos.delete');
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No hay empresa activa');

  try {
    const expense = await prisma.expenses.findFirst({
      where: { id, company_id: companyId, status: 'DRAFT' },
      select: { id: true },
    });

    if (!expense) throw new Error('Gasto no encontrado o no esta en estado borrador');

    await prisma.expenses.delete({ where: { id } });

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) throw error;
    console.error('Error al eliminar gasto:', error);
    throw new Error('Error al eliminar gasto');
  }
}

// ============================================
// GASTOS PENDIENTES (para Ordenes de Pago)
// ============================================

/**
 * Obtiene gastos pendientes de pago (CONFIRMED / PARTIAL_PAID).
 * Si se pasa supplierId, filtra por proveedor; si no, devuelve todos los de la empresa.
 */
export async function getPendingExpenses(supplierId?: string) {
  await requirePermission('compras.gastos.view');
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const expenses = await prisma.expenses.findMany({
      where: {
        company_id: companyId,
        status: { in: ['CONFIRMED', 'PARTIAL_PAID'] },
        ...(supplierId ? { supplier_id: supplierId } : {}),
      },
      select: {
        id: true,
        full_number: true,
        description: true,
        amount: true,
        date: true,
        due_date: true,
        status: true,
        category: { select: { name: true } },
        supplier: { select: { business_name: true } },
        payment_order_items: {
          where: { payment_order: { status: 'CONFIRMED' } },
          select: { amount: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    return expenses.map((expense) => {
      const paidAmount = expense.payment_order_items.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
      );
      const total = Number(expense.amount);
      return {
        id: expense.id,
        full_number: expense.full_number,
        description: expense.description,
        category_name: expense.category.name,
        supplier_name: expense.supplier?.business_name || null,
        date: normalizeDbDate(expense.date),
        due_date: normalizeDbDateNullable(expense.due_date),
        total,
        paid_amount: paidAmount,
        pending_amount: total - paidAmount,
        status: expense.status,
      };
    });
  } catch (error) {
    console.error('Error al obtener gastos pendientes:', error);
    throw new Error('Error al obtener gastos pendientes');
  }
}

// ============================================
// EXPORT PARA EXCEL
// ============================================

/**
 * Obtiene todos los gastos de la empresa para exportar a Excel
 */
export async function getAllExpensesForExport() {
  await requirePermission('compras.gastos.view');
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const expenses = await prisma.expenses.findMany({
    where: { company_id: companyId },
    select: {
      full_number: true,
      description: true,
      amount: true,
      date: true,
      due_date: true,
      status: true,
      notes: true,
      category: { select: { name: true } },
      supplier: { select: { business_name: true } },
    },
    orderBy: { number: 'desc' },
  });

  return expenses.map((e) => ({
    ...e,
    amount: Number(e.amount),
    date: normalizeDbDate(e.date),
    due_date: normalizeDbDateNullable(e.due_date),
  }));
}

// ============================================
// PROVEEDORES (query local al modulo)
// ============================================

/**
 * Obtiene proveedores activos para el select del formulario de gastos
 */
export async function getSuppliersForExpenses() {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  return prisma.suppliers.findMany({
    where: { company_id: companyId },
    select: {
      id: true,
      code: true,
      business_name: true,
      tax_id: true,
    },
    orderBy: { business_name: 'asc' },
  });
}
