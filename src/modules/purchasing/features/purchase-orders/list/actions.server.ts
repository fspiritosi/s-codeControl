'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import { parseSearchParams, stateToPrismaParams, buildFiltersWhere } from '@/shared/components/common/DataTable/helpers';
import { revalidatePath } from 'next/cache';

// ============================================================
// QUERIES
// ============================================================

export async function getPurchaseOrdersPaginated(searchParams: DataTableSearchParams) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);

    const where: Record<string, unknown> = { company_id: companyId };

    if (state.search) {
      where.OR = [
        { full_number: { contains: state.search, mode: 'insensitive' } },
        { supplier: { business_name: { contains: state.search, mode: 'insensitive' } } },
      ];
    }

    const filtersWhere = buildFiltersWhere(state.filters, { status: 'status', invoicing_status: 'invoicing_status' });
    Object.assign(where, filtersWhere);

    const [data, total] = await Promise.all([
      prisma.purchase_orders.findMany({
        where: where as any,
        include: { supplier: { select: { business_name: true, tax_id: true } } },
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      prisma.purchase_orders.count({ where: where as any }),
    ]);

    const formatted = data.map((po) => ({
      ...po,
      subtotal: Number(po.subtotal),
      vat_amount: Number(po.vat_amount),
      total: Number(po.total),
    }));

    return { data: formatted, total };
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return { data: [], total: 0 };
  }
}

export async function getPurchaseOrderFacets(): Promise<Record<string, { value: string; count: number }[]>> {
  const { companyId } = await getActionContext();
  if (!companyId) return {};

  try {
    const [statusGroups, invGroups] = await Promise.all([
      prisma.purchase_orders.groupBy({ by: ['status'], where: { company_id: companyId }, _count: true }),
      prisma.purchase_orders.groupBy({ by: ['invoicing_status'], where: { company_id: companyId }, _count: true }),
    ]);

    return {
      status: statusGroups.map((g) => ({ value: g.status, count: g._count })),
      invoicing_status: invGroups.map((g) => ({ value: g.invoicing_status, count: g._count })),
    };
  } catch (error) {
    console.error('Error fetching PO facets:', error);
    return {};
  }
}

export async function getPurchaseOrderById(id: string) {
  const order = await prisma.purchase_orders.findUnique({
    where: { id },
    include: {
      supplier: true,
      lines: { include: { product: { select: { code: true, name: true, unit_of_measure: true } } } },
      installments: true,
      receiving_notes: { select: { id: true, full_number: true, status: true, reception_date: true } },
    },
  });

  if (!order) return null;

  // Merge facturas: FK legacy + derivadas por líneas (multi-OC)
  const linkedInvoices = await getInvoicesByOrderId(id);

  return {
    ...order,
    subtotal: Number(order.subtotal),
    vat_amount: Number(order.vat_amount),
    total: Number(order.total),
    supplier: order.supplier
      ? { ...order.supplier, credit_limit: order.supplier.credit_limit ? Number(order.supplier.credit_limit) : null }
      : null,
    lines: order.lines.map((l) => ({
      ...l,
      quantity: Number(l.quantity),
      unit_cost: Number(l.unit_cost),
      vat_rate: Number(l.vat_rate),
      vat_amount: Number(l.vat_amount),
      subtotal: Number(l.subtotal),
      total: Number(l.total),
      received_qty: Number(l.received_qty),
      invoiced_qty: Number(l.invoiced_qty),
    })),
    purchase_invoices: linkedInvoices,
  };
}

export async function getPurchaseOrderLinesForReceiving(orderId: string) {
  const lines = await prisma.purchase_order_lines.findMany({
    where: { order_id: orderId },
    include: { product: { select: { id: true, code: true, name: true, unit_of_measure: true, track_stock: true } } },
  });

  return lines
    .filter((l) => l.product?.track_stock)
    .map((l) => ({
      ...l,
      quantity: Number(l.quantity),
      received_qty: Number(l.received_qty),
      pending_qty: Number(l.quantity) - Number(l.received_qty),
      unit_cost: Number(l.unit_cost),
      vat_rate: Number(l.vat_rate),
    }))
    .filter((l) => l.pending_qty > 0);
}

export async function getOrdersForReceiving(supplierId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const orders = await prisma.purchase_orders.findMany({
    where: {
      company_id: companyId,
      supplier_id: supplierId,
      status: { in: ['APPROVED', 'PARTIALLY_RECEIVED'] },
    },
    select: { id: true, full_number: true, total: true, issue_date: true },
    orderBy: { created_at: 'desc' },
  });

  return orders.map((o) => ({ ...o, total: Number(o.total) }));
}

export async function getOrdersForInvoicing(supplierId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const orders = await prisma.purchase_orders.findMany({
    where: {
      company_id: companyId,
      supplier_id: supplierId,
      status: { in: ['APPROVED', 'PARTIALLY_RECEIVED', 'COMPLETED'] },
      invoicing_status: { in: ['NOT_INVOICED', 'PARTIALLY_INVOICED'] },
    },
    select: { id: true, full_number: true, total: true, issue_date: true, status: true, invoicing_status: true },
    orderBy: { created_at: 'desc' },
  });

  return orders.map((o) => ({ ...o, total: Number(o.total) }));
}

export async function getPurchaseOrderLinesForInvoicing(orderId: string) {
  const lines = await prisma.purchase_order_lines.findMany({
    where: { order_id: orderId },
    include: { product: { select: { id: true, code: true, name: true } } },
  });

  return lines
    .map((l) => ({
      ...l,
      quantity: Number(l.quantity),
      invoiced_qty: Number(l.invoiced_qty),
      pending_qty: Number(l.quantity) - Number(l.invoiced_qty),
      unit_cost: Number(l.unit_cost),
      vat_rate: Number(l.vat_rate),
      vat_amount: Number(l.vat_amount),
      subtotal: Number(l.subtotal),
      total: Number(l.total),
    }))
    .filter((l) => l.pending_qty > 0);
}

export async function getPurchaseOrderLinesForInvoicingBulk(orderIds: string[]) {
  if (orderIds.length === 0) return [];

  const lines = await prisma.purchase_order_lines.findMany({
    where: { order_id: { in: orderIds } },
    include: {
      product: { select: { id: true, code: true, name: true } },
      order: { select: { id: true, full_number: true } },
    },
  });

  return lines
    .map((l) => ({
      ...l,
      quantity: Number(l.quantity),
      invoiced_qty: Number(l.invoiced_qty),
      pending_qty: Number(l.quantity) - Number(l.invoiced_qty),
      unit_cost: Number(l.unit_cost),
      vat_rate: Number(l.vat_rate),
      vat_amount: Number(l.vat_amount),
      subtotal: Number(l.subtotal),
      total: Number(l.total),
      order_id: l.order_id,
      order_full_number: l.order?.full_number ?? '',
    }))
    .filter((l) => l.pending_qty > 0);
}

/**
 * Devuelve las facturas asociadas a una OC, uniendo:
 *  - Las que tienen la FK legacy `purchase_order_id = orderId`
 *  - Las multi-OC que tienen líneas con `purchase_order_line.order_id = orderId`
 */
export async function getInvoicesByOrderId(orderId: string) {
  const invoices = await prisma.purchase_invoices.findMany({
    where: {
      OR: [
        { purchase_order_id: orderId },
        { lines: { some: { purchase_order_line: { order_id: orderId } } } },
      ],
    },
    select: { id: true, full_number: true, status: true, total: true },
    distinct: ['id'],
    orderBy: { created_at: 'desc' },
  });

  return invoices.map((inv) => ({ ...inv, total: Number(inv.total) }));
}

// ============================================================
// MUTATIONS
// ============================================================

export async function createPurchaseOrder(data: {
  supplier_id: string;
  issue_date: string;
  expected_delivery_date?: string;
  payment_conditions?: string;
  delivery_address?: string;
  delivery_notes?: string;
  notes?: string;
  lines: { product_id?: string; description: string; quantity: number; unit_cost: number; vat_rate: number }[];
}) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  try {
    // Auto-generate number
    const lastOrder = await prisma.purchase_orders.findFirst({
      where: { company_id: companyId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    const nextNumber = (lastOrder?.number || 0) + 1;
    const fullNumber = `OC-${String(nextNumber).padStart(5, '0')}`;

    // Calculate line totals
    const lines = data.lines.map((line) => {
      const subtotal = line.quantity * line.unit_cost;
      const vatAmount = subtotal * (line.vat_rate / 100);
      return {
        product_id: line.product_id || null,
        description: line.description,
        quantity: line.quantity,
        unit_cost: line.unit_cost,
        vat_rate: line.vat_rate,
        vat_amount: Math.round(vatAmount * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        total: Math.round((subtotal + vatAmount) * 100) / 100,
      };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
    const vatAmount = lines.reduce((sum, l) => sum + l.vat_amount, 0);
    const total = lines.reduce((sum, l) => sum + l.total, 0);

    const order = await prisma.purchase_orders.create({
      data: {
        company_id: companyId,
        supplier_id: data.supplier_id,
        number: nextNumber,
        full_number: fullNumber,
        issue_date: new Date(data.issue_date),
        expected_delivery_date: data.expected_delivery_date ? new Date(data.expected_delivery_date) : null,
        payment_conditions: data.payment_conditions || null,
        delivery_address: data.delivery_address || null,
        delivery_notes: data.delivery_notes || null,
        notes: data.notes || null,
        subtotal,
        vat_amount: vatAmount,
        total,
        lines: { create: lines },
      },
    });

    revalidatePath('/dashboard/purchasing');
    return { data: order, error: null };
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return { data: null, error: String(error) };
  }
}

export async function submitForApproval(id: string) {
  try {
    await prisma.purchase_orders.update({
      where: { id, status: 'DRAFT' },
      data: { status: 'PENDING_APPROVAL' },
    });
    revalidatePath('/dashboard/purchasing');
    return { error: null };
  } catch (error) {
    console.error('Error submitting for approval:', error);
    return { error: String(error) };
  }
}

export async function approvePurchaseOrder(id: string) {
  try {
    await prisma.purchase_orders.update({
      where: { id, status: 'PENDING_APPROVAL' },
      data: { status: 'APPROVED', approved_at: new Date() },
    });
    revalidatePath('/dashboard/purchasing');
    return { error: null };
  } catch (error) {
    console.error('Error approving PO:', error);
    return { error: String(error) };
  }
}

export async function rejectPurchaseOrder(id: string) {
  try {
    await prisma.purchase_orders.update({
      where: { id, status: 'PENDING_APPROVAL' },
      data: { status: 'DRAFT', approved_by: null, approved_at: null },
    });
    revalidatePath('/dashboard/purchasing');
    return { error: null };
  } catch (error) {
    console.error('Error rejecting PO:', error);
    return { error: String(error) };
  }
}

export async function cancelPurchaseOrder(id: string) {
  try {
    await prisma.purchase_orders.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    revalidatePath('/dashboard/purchasing');
    return { error: null };
  } catch (error) {
    console.error('Error cancelling PO:', error);
    return { error: String(error) };
  }
}

export async function deletePurchaseOrder(id: string) {
  try {
    await prisma.purchase_orders.delete({ where: { id } });
    revalidatePath('/dashboard/purchasing');
    return { error: null };
  } catch (error) {
    console.error('Error deleting PO:', error);
    return { error: String(error) };
  }
}

// Helper: update PO status based on received quantities
export async function updatePurchaseOrderStatus(orderId: string) {
  const lines = await prisma.purchase_order_lines.findMany({ where: { order_id: orderId } });

  const allReceived = lines.every((l) => Number(l.received_qty) >= Number(l.quantity));
  const someReceived = lines.some((l) => Number(l.received_qty) > 0);

  let newStatus: 'APPROVED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' = 'APPROVED';
  if (allReceived) newStatus = 'COMPLETED';
  else if (someReceived) newStatus = 'PARTIALLY_RECEIVED';

  await prisma.purchase_orders.update({
    where: { id: orderId },
    data: { status: newStatus },
  });
}
