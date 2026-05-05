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
import {
  paymentOrderSchema,
  type PaymentOrderFormData,
} from '../../shared/payment-order-validators';
import { sendPaymentOrderPaidEmail } from './shared/email/sendPaymentOrderPaidEmail';

const columnMap: Record<string, string> = { status: 'status', supplier_id: 'supplier_id' };

export interface PaymentOrdersListFilters {
  status?: string | null;
  supplier_id?: string | null;
  scheduled_from?: string | null;
  scheduled_to?: string | null;
}

export async function getPaymentOrdersPaginated(
  searchParams: DataTableSearchParams,
  filters?: PaymentOrdersListFilters
) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);

    const where: Record<string, unknown> = { company_id: companyId };
    if (state.search) {
      where.OR = [
        { full_number: { contains: state.search, mode: 'insensitive' } },
        { notes: { contains: state.search, mode: 'insensitive' } },
        { supplier: { business_name: { contains: state.search, mode: 'insensitive' } } },
      ];
    }
    Object.assign(where, buildFiltersWhere(state.filters, columnMap));

    if (filters?.status) where.status = filters.status;
    if (filters?.supplier_id) where.supplier_id = filters.supplier_id;
    if (filters?.scheduled_from || filters?.scheduled_to) {
      const dateFilter: Record<string, Date> = {};
      if (filters.scheduled_from) dateFilter.gte = new Date(filters.scheduled_from);
      if (filters.scheduled_to) {
        const end = new Date(filters.scheduled_to);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.date = dateFilter;
    }

    const [data, total] = await Promise.all([
      prisma.payment_orders.findMany({
        where: where as any,
        include: { supplier: { select: { business_name: true, tax_id: true } } },
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      prisma.payment_orders.count({ where: where as any }),
    ]);

    const formatted = data.map((po) => ({ ...po, total_amount: Number(po.total_amount) }));
    return { data: formatted, total };
  } catch (error) {
    console.error('Error fetching payment orders:', error);
    return { data: [], total: 0 };
  }
}

export async function getPaymentOrderFacets() {
  const { companyId } = await getActionContext();
  if (!companyId) return {};

  try {
    const groups = await prisma.payment_orders.groupBy({
      by: ['status'],
      where: { company_id: companyId },
      _count: true,
    });
    return { status: groups.map((g) => ({ value: g.status, count: g._count })) };
  } catch (error) {
    console.error('Error fetching payment order facets:', error);
    return {};
  }
}

export async function getPaymentOrderById(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  const order = await prisma.payment_orders.findFirst({
    where: { id, company_id: companyId },
    include: {
      supplier: { select: { id: true, business_name: true, tax_id: true } },
      items: {
        include: {
          invoice: { select: { id: true, full_number: true, issue_date: true, total: true } },
        },
      },
      payments: {
        include: {
          cash_register: { select: { code: true, name: true } },
          bank_account: { select: { bank_name: true, account_number: true } },
          supplier_payment_method: {
            select: {
              id: true,
              type: true,
              bank_name: true,
              account_holder: true,
              account_type: true,
              cbu: true,
              alias: true,
              currency: true,
              is_default: true,
            },
          },
        },
      },
    },
  });

  if (!order) return null;
  return {
    ...order,
    total_amount: Number(order.total_amount),
    items: order.items.map((i) => ({
      ...i,
      amount: Number(i.amount),
      invoice: i.invoice ? { ...i.invoice, total: Number(i.invoice.total) } : null,
    })),
    payments: order.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
  };
}

export async function getSuppliersForOrder() {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  return prisma.suppliers.findMany({
    where: { company_id: companyId, status: 'ACTIVE' },
    select: { id: true, code: true, business_name: true, tax_id: true },
    orderBy: { business_name: 'asc' },
  });
}

export async function getSupplierPaymentMethodsForPaymentOrder(supplierId: string) {
  const { companyId } = await getActionContext();
  if (!companyId || !supplierId) return [];

  const methods = await prisma.supplier_payment_methods.findMany({
    where: { company_id: companyId, supplier_id: supplierId, status: 'ACTIVE' },
    select: {
      id: true,
      type: true,
      bank_name: true,
      account_holder: true,
      account_type: true,
      cbu: true,
      alias: true,
      currency: true,
      is_default: true,
    },
    orderBy: [{ is_default: 'desc' }, { created_at: 'asc' }],
  });

  return methods;
}

export async function getPendingPurchaseInvoices(supplierId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const invoices = await prisma.purchase_invoices.findMany({
    where: {
      company_id: companyId,
      supplier_id: supplierId,
      status: { notIn: ['CANCELLED'] },
    },
    select: {
      id: true,
      full_number: true,
      issue_date: true,
      due_date: true,
      total: true,
      payment_order_items: { select: { amount: true } },
    },
    orderBy: { issue_date: 'asc' },
  });

  return invoices
    .map((inv) => {
      const alreadyPaid = inv.payment_order_items.reduce(
        (acc, item) => acc + Number(item.amount),
        0
      );
      const total = Number(inv.total);
      const remaining = Math.round((total - alreadyPaid) * 100) / 100;
      return {
        id: inv.id,
        full_number: inv.full_number,
        issue_date: inv.issue_date,
        due_date: inv.due_date,
        total,
        already_paid: Math.round(alreadyPaid * 100) / 100,
        remaining,
      };
    })
    .filter((inv) => inv.remaining > 0);
}

export async function createPaymentOrder(data: PaymentOrderFormData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company selected' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { data: null, error: 'No autenticado' };

  const parsed = paymentOrderSchema.safeParse(data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { data: null, error: firstIssue?.message ?? 'Datos inválidos' };
  }

  try {
    const totalAmount = parsed.data.items.reduce((acc, i) => acc + parseFloat(i.amount), 0);

    // Validar que cada supplier_payment_method_id pertenezca al supplier de la OP
    const supplierMethodIds = parsed.data.payments
      .map((p) => p.supplier_payment_method_id)
      .filter((v): v is string => !!v);
    if (supplierMethodIds.length > 0) {
      if (!parsed.data.supplier_id) {
        return {
          data: null,
          error: 'No se puede asignar destino del proveedor sin proveedor',
        };
      }
      const found = await prisma.supplier_payment_methods.findMany({
        where: {
          id: { in: supplierMethodIds },
          company_id: companyId,
          supplier_id: parsed.data.supplier_id,
        },
        select: { id: true },
      });
      if (found.length !== new Set(supplierMethodIds).size) {
        return {
          data: null,
          error: 'Un destino del proveedor no pertenece al proveedor seleccionado',
        };
      }
    }

    const last = await prisma.payment_orders.findFirst({
      where: { company_id: companyId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    const nextNumber = (last?.number ?? 0) + 1;
    const fullNumber = `OP-${String(nextNumber).padStart(5, '0')}`;

    const order = await prisma.payment_orders.create({
      data: {
        company_id: companyId,
        supplier_id: parsed.data.supplier_id || null,
        number: nextNumber,
        full_number: fullNumber,
        date: new Date(parsed.data.date),
        scheduled_payment_date: parsed.data.scheduled_payment_date
          ? new Date(parsed.data.scheduled_payment_date)
          : null,
        total_amount: Math.round(totalAmount * 100) / 100,
        notes: parsed.data.notes || null,
        status: 'DRAFT',
        created_by: user.id,
        items: {
          create: parsed.data.items.map((i) => ({
            invoice_id: i.invoice_id || null,
            amount: parseFloat(i.amount),
          })),
        },
        payments: {
          create: parsed.data.payments.map((p) => ({
            payment_method: p.payment_method,
            amount: parseFloat(p.amount),
            cash_register_id: p.cash_register_id || null,
            bank_account_id: p.bank_account_id || null,
            supplier_payment_method_id: p.supplier_payment_method_id || null,
            check_number: p.check_number || null,
            card_last4: p.card_last4 || null,
            reference: p.reference || null,
          })),
        },
      },
    });

    revalidatePath('/dashboard/treasury');
    return { data: order, error: null };
  } catch (error) {
    console.error('Error creating payment order:', error);
    return { data: null, error: String(error) };
  }
}

export async function updatePaymentOrder(id: string, data: PaymentOrderFormData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company selected' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { data: null, error: 'No autenticado' };

  const existing = await prisma.payment_orders.findFirst({
    where: { id, company_id: companyId },
    select: { id: true, status: true },
  });
  if (!existing) return { data: null, error: 'Orden no encontrada' };
  if (existing.status !== 'DRAFT') {
    return { data: null, error: 'Solo se pueden editar OPs en borrador' };
  }

  const parsed = paymentOrderSchema.safeParse(data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { data: null, error: firstIssue?.message ?? 'Datos inválidos' };
  }

  try {
    const totalAmount = parsed.data.items.reduce((acc, i) => acc + parseFloat(i.amount), 0);

    const supplierMethodIds = parsed.data.payments
      .map((p) => p.supplier_payment_method_id)
      .filter((v): v is string => !!v);
    if (supplierMethodIds.length > 0) {
      if (!parsed.data.supplier_id) {
        return {
          data: null,
          error: 'No se puede asignar destino del proveedor sin proveedor',
        };
      }
      const found = await prisma.supplier_payment_methods.findMany({
        where: {
          id: { in: supplierMethodIds },
          company_id: companyId,
          supplier_id: parsed.data.supplier_id,
        },
        select: { id: true },
      });
      if (found.length !== new Set(supplierMethodIds).size) {
        return {
          data: null,
          error: 'Un destino del proveedor no pertenece al proveedor seleccionado',
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment_order_items.deleteMany({ where: { payment_order_id: id } });
      await tx.payment_order_payments.deleteMany({ where: { payment_order_id: id } });

      await tx.payment_orders.update({
        where: { id },
        data: {
          supplier_id: parsed.data.supplier_id || null,
          date: new Date(parsed.data.date),
          scheduled_payment_date: parsed.data.scheduled_payment_date
            ? new Date(parsed.data.scheduled_payment_date)
            : null,
          total_amount: Math.round(totalAmount * 100) / 100,
          notes: parsed.data.notes || null,
          items: {
            create: parsed.data.items.map((i) => ({
              invoice_id: i.invoice_id || null,
              amount: parseFloat(i.amount),
            })),
          },
          payments: {
            create: parsed.data.payments.map((p) => ({
              payment_method: p.payment_method,
              amount: parseFloat(p.amount),
              cash_register_id: p.cash_register_id || null,
              bank_account_id: p.bank_account_id || null,
              supplier_payment_method_id: p.supplier_payment_method_id || null,
              check_number: p.check_number || null,
              card_last4: p.card_last4 || null,
              reference: p.reference || null,
            })),
          },
        },
      });
    });

    revalidatePath('/dashboard/treasury');
    revalidatePath(`/dashboard/treasury/payment-orders/${id}`);
    return { data: { id }, error: null };
  } catch (error) {
    console.error('Error updating payment order:', error);
    return { data: null, error: String(error) };
  }
}

/**
 * Confirma una orden de pago. Por cada payment genera:
 *   - CASH → cash_movement tipo EXPENSE en la caja (requiere sesión abierta)
 *   - TRANSFER → bank_movement tipo TRANSFER_OUT + actualiza balance
 *   - DEBIT_CARD / CREDIT_CARD → bank_movement tipo DEBIT + actualiza balance
 *   - CHECK → solo queda registrado en payment_order_payments.check_number
 *     (el cheque propio se carga aparte desde el módulo de cheques)
 *   - ACCOUNT → no impacta tesorería (cuenta corriente con proveedor)
 * Todo en una transacción: si cualquier paso falla, aborta la confirmación.
 */
export async function confirmPaymentOrder(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { error: 'No autenticado' };

  try {
    const order = await prisma.payment_orders.findFirst({
      where: { id, company_id: companyId },
      include: { payments: true },
    });
    if (!order) return { error: 'Orden no encontrada' };
    if (order.status !== 'DRAFT') return { error: 'Solo se pueden confirmar órdenes en borrador' };

    // Validaciones previas (fallan fuera de transacción para mensajes claros)
    for (const p of order.payments) {
      if (p.payment_method === 'CASH') {
        if (!p.cash_register_id) {
          return { error: 'Hay un pago en efectivo sin caja asignada' };
        }
        const openSession = await prisma.cash_register_sessions.findFirst({
          where: { cash_register_id: p.cash_register_id, status: 'OPEN' },
          select: { id: true },
        });
        if (!openSession) {
          const register = await prisma.cash_registers.findUnique({
            where: { id: p.cash_register_id },
            select: { code: true },
          });
          return {
            error: `La caja ${register?.code ?? ''} no tiene sesión abierta. Abrila antes de confirmar.`,
          };
        }
      }
      if (
        (p.payment_method === 'TRANSFER' ||
          p.payment_method === 'DEBIT_CARD' ||
          p.payment_method === 'CREDIT_CARD') &&
        !p.bank_account_id
      ) {
        return { error: 'Hay un pago con tarjeta/transferencia sin cuenta bancaria asignada' };
      }
      if (p.bank_account_id) {
        const account = await prisma.bank_accounts.findUnique({
          where: { id: p.bank_account_id },
          select: { status: true },
        });
        if (account?.status === 'CLOSED') {
          return { error: 'Una de las cuentas bancarias del pago está cerrada' };
        }
      }
    }

    // Ejecutar en transacción: confirmar + generar movimientos
    await prisma.$transaction(async (tx) => {
      for (const p of order.payments) {
        const amount = Number(p.amount);

        if (p.payment_method === 'CASH' && p.cash_register_id) {
          const session = await tx.cash_register_sessions.findFirst({
            where: { cash_register_id: p.cash_register_id, status: 'OPEN' },
            select: { id: true },
          });
          if (!session) throw new Error('Sesión de caja cerrada durante la confirmación');

          await tx.cash_movements.create({
            data: {
              session_id: session.id,
              cash_register_id: p.cash_register_id,
              company_id: companyId,
              type: 'EXPENSE',
              amount,
              description: `Orden de pago ${order.full_number}`,
              reference: p.reference || order.full_number,
              created_by: user.id!,
            },
          });
        }

        if (
          (p.payment_method === 'TRANSFER' ||
            p.payment_method === 'DEBIT_CARD' ||
            p.payment_method === 'CREDIT_CARD') &&
          p.bank_account_id
        ) {
          const movementType =
            p.payment_method === 'TRANSFER' ? 'TRANSFER_OUT' : 'DEBIT';

          const account = await tx.bank_accounts.findUnique({
            where: { id: p.bank_account_id },
            select: { balance: true },
          });
          if (!account) throw new Error('Cuenta bancaria no encontrada');

          await tx.bank_movements.create({
            data: {
              bank_account_id: p.bank_account_id,
              company_id: companyId,
              type: movementType,
              amount,
              date: new Date(),
              description: `Orden de pago ${order.full_number}`,
              reference: p.reference || order.full_number,
              payment_order_id: order.id,
              created_by: user.id!,
            },
          });

          await tx.bank_accounts.update({
            where: { id: p.bank_account_id },
            data: { balance: Number(account.balance) - amount },
          });
        }

        // CHECK: no genera movimiento automático. El cheque propio se crea
        // manualmente desde el módulo de cheques y el bank_movement se emite
        // cuando el banco lo debita (status CASHED).
        // ACCOUNT: no impacta tesorería.
      }

      await tx.payment_orders.update({
        where: { id },
        data: { status: 'CONFIRMED', confirmed_at: new Date(), confirmed_by: user.id! },
      });
    });

    revalidatePath('/dashboard/treasury');
    revalidatePath(`/dashboard/treasury/payment-orders/${id}`);
    return { error: null };
  } catch (error) {
    console.error('Error confirming payment order:', error);
    return { error: String(error) };
  }
}

/**
 * Marca una OP en estado CONFIRMED como PAID, recalcula el estado de las
 * facturas asociadas y dispara el mail al proveedor con el PDF adjunto.
 * - Estado terminal: no se puede revertir.
 * - Si el mail falla, NO se revierte la transición.
 */
export async function markPaymentOrderAsPaid(id: string): Promise<{
  ok: boolean;
  error?: string;
  emailStatus?: 'SENT' | 'NO_EMAIL' | 'FAILED';
  errorMessage?: string;
}> {
  const { companyId } = await getActionContext();
  if (!companyId) return { ok: false, error: 'No company selected' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { ok: false, error: 'No autenticado' };

  try {
    const order = await prisma.payment_orders.findFirst({
      where: { id, company_id: companyId },
      select: { id: true, status: true, items: { select: { invoice_id: true } } },
    });
    if (!order) return { ok: false, error: 'Orden no encontrada' };
    if (order.status !== 'CONFIRMED') {
      return {
        ok: false,
        error: 'Solo se pueden marcar como pagadas las órdenes confirmadas',
      };
    }

    const invoiceIds = Array.from(
      new Set(order.items.map((i) => i.invoice_id).filter((v): v is string => !!v))
    );

    await prisma.$transaction(async (tx) => {
      await tx.payment_orders.update({
        where: { id },
        data: {
          status: 'PAID',
          paid_at: new Date(),
          paid_by: user.id!,
        },
      });

      for (const invoiceId of invoiceIds) {
        const invoice = await tx.purchase_invoices.findUnique({
          where: { id: invoiceId },
          select: { id: true, total: true, status: true },
        });
        if (!invoice) continue;
        if (invoice.status === 'CANCELLED') continue;

        const aggregate = await tx.payment_order_items.aggregate({
          where: {
            invoice_id: invoiceId,
            payment_order: { status: 'PAID' },
          },
          _sum: { amount: true },
        });
        const paidSum = Number(aggregate._sum.amount ?? 0);
        const total = Number(invoice.total);

        let nextStatus: 'PAID' | 'PARTIAL_PAID' | null = null;
        if (paidSum >= total - 0.005) nextStatus = 'PAID';
        else if (paidSum > 0) nextStatus = 'PARTIAL_PAID';

        if (nextStatus && invoice.status !== nextStatus) {
          await tx.purchase_invoices.update({
            where: { id: invoiceId },
            data: { status: nextStatus },
          });
        }
      }
    });

    // Mail al proveedor (fuera de la transacción)
    let emailStatus: 'SENT' | 'NO_EMAIL' | 'FAILED' = 'FAILED';
    let errorMessage: string | undefined;
    try {
      const result = await sendPaymentOrderPaidEmail(id, companyId);
      emailStatus = result.status;
      errorMessage = result.errorMessage;
    } catch (err) {
      console.error('Error enviando mail de OP pagada:', err);
      errorMessage = err instanceof Error ? err.message : 'Error inesperado';
    }

    revalidatePath('/dashboard/treasury');
    revalidatePath(`/dashboard/treasury/payment-orders/${id}`);
    for (const invId of invoiceIds) {
      revalidatePath(`/dashboard/purchasing/invoices/${invId}`);
    }

    return { ok: true, emailStatus, errorMessage };
  } catch (error) {
    console.error('Error marcando OP como pagada:', error);
    return { ok: false, error: String(error) };
  }
}

export async function cancelPaymentOrder(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  try {
    const order = await prisma.payment_orders.findFirst({
      where: { id, company_id: companyId },
      select: { id: true, status: true },
    });
    if (!order) return { error: 'Orden no encontrada' };
    if (order.status === 'CANCELLED') return { error: 'Ya está anulada' };

    await prisma.payment_orders.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    revalidatePath('/dashboard/treasury');
    revalidatePath(`/dashboard/treasury/payment-orders/${id}`);
    return { error: null };
  } catch (error) {
    console.error('Error cancelling payment order:', error);
    return { error: String(error) };
  }
}
