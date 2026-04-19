'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import { parseSearchParams, stateToPrismaParams, buildFiltersWhere } from '@/shared/components/common/DataTable/helpers';
import { revalidatePath } from 'next/cache';

export async function getPurchaseInvoicesPaginated(searchParams: DataTableSearchParams) {
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

    const filtersWhere = buildFiltersWhere(state.filters, { status: 'status', voucher_type: 'voucher_type', receiving_status: 'receiving_status' });
    Object.assign(where, filtersWhere);

    const [data, total] = await Promise.all([
      prisma.purchase_invoices.findMany({
        where: where as any,
        include: { supplier: { select: { business_name: true } } },
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      prisma.purchase_invoices.count({ where: where as any }),
    ]);

    return {
      data: data.map((inv) => ({ ...inv, subtotal: Number(inv.subtotal), vat_amount: Number(inv.vat_amount), other_taxes: Number(inv.other_taxes), total: Number(inv.total) })),
      total,
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return { data: [], total: 0 };
  }
}

export async function getInvoiceFacets(): Promise<Record<string, { value: string; count: number }[]>> {
  const { companyId } = await getActionContext();
  if (!companyId) return {};

  try {
    const [statusGroups, typeGroups, receivingGroups] = await Promise.all([
      prisma.purchase_invoices.groupBy({ by: ['status'], where: { company_id: companyId }, _count: true }),
      prisma.purchase_invoices.groupBy({ by: ['voucher_type'], where: { company_id: companyId }, _count: true }),
      prisma.purchase_invoices.groupBy({ by: ['receiving_status'], where: { company_id: companyId }, _count: true }),
    ]);

    return {
      status: statusGroups.map((g) => ({ value: g.status, count: g._count })),
      voucher_type: typeGroups.map((g) => ({ value: g.voucher_type, count: g._count })),
      receiving_status: receivingGroups.map((g) => ({ value: g.receiving_status, count: g._count })),
    };
  } catch (error) {
    return {};
  }
}

export async function createPurchaseInvoice(data: {
  supplier_id: string;
  voucher_type: string;
  point_of_sale: string;
  number: string;
  issue_date: string;
  due_date?: string;
  cae?: string;
  notes?: string;
  purchase_order_id?: string;
  purchase_order_ids?: string[];
  lines: { product_id?: string; description: string; quantity: number; unit_cost: number; vat_rate: number; purchase_order_line_id?: string }[];
}) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  try {
    const fullNumber = `${data.point_of_sale.padStart(4, '0')}-${data.number.padStart(8, '0')}`;

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
        purchase_order_line_id: line.purchase_order_line_id || null,
      };
    });

    const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
    const vatAmount = lines.reduce((s, l) => s + l.vat_amount, 0);
    const total = lines.reduce((s, l) => s + l.total, 0);

    // Derivar la OC primaria:
    // - Si viene purchase_order_ids: usarlo (null si hay 0 o >1)
    // - Si no, fallback al legacy purchase_order_id
    let primaryOrderId: string | null = null;
    if (Array.isArray(data.purchase_order_ids)) {
      primaryOrderId = data.purchase_order_ids.length === 1 ? data.purchase_order_ids[0] : null;
    } else if (data.purchase_order_id) {
      primaryOrderId = data.purchase_order_id;
    }

    const invoice = await prisma.purchase_invoices.create({
      data: {
        company_id: companyId,
        supplier_id: data.supplier_id,
        voucher_type: data.voucher_type as any,
        point_of_sale: data.point_of_sale,
        number: data.number,
        full_number: fullNumber,
        issue_date: new Date(data.issue_date),
        due_date: data.due_date ? new Date(data.due_date) : null,
        cae: data.cae || null,
        notes: data.notes || null,
        purchase_order_id: primaryOrderId,
        subtotal,
        vat_amount: vatAmount,
        total,
        lines: { create: lines },
      },
    });

    revalidatePath('/dashboard/purchasing');
    return {
      data: { ...invoice, subtotal: Number(invoice.subtotal), vat_amount: Number(invoice.vat_amount), other_taxes: Number(invoice.other_taxes), total: Number(invoice.total) },
      error: null,
    };
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { data: null, error: 'Ya existe una factura con ese número para este proveedor' };
    }
    console.error('Error creating invoice:', error);
    return { data: null, error: String(error) };
  }
}

export async function confirmPurchaseInvoice(id: string) {
  try {
    // Traer factura con líneas + relación a línea de OC (para conocer order_id)
    const invoice = await prisma.purchase_invoices.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            purchase_order_line: { select: { id: true, order_id: true, quantity: true, invoiced_qty: true } },
          },
        },
      },
    });

    if (!invoice) {
      return { error: 'Factura no encontrada' };
    }
    if (invoice.status !== 'DRAFT') {
      return { error: 'La factura no está en estado borrador' };
    }

    // Derivar todas las OCs afectadas a partir de las líneas
    const affectedOrderIds = new Set<string>();
    for (const l of invoice.lines) {
      if (l.purchase_order_line?.order_id) {
        affectedOrderIds.add(l.purchase_order_line.order_id);
      }
    }

    // Transacción 1: marcar CONFIRMED + incrementar invoiced_qty con CLAMP defensivo
    const ops: any[] = [
      prisma.purchase_invoices.update({
        where: { id, status: 'DRAFT' },
        data: { status: 'CONFIRMED' },
      }),
    ];

    for (const invLine of invoice.lines) {
      const pol = invLine.purchase_order_line;
      if (!pol) continue;

      const ordered = Number(pol.quantity);
      const alreadyInvoiced = Number(pol.invoiced_qty);
      const pending = Math.max(0, ordered - alreadyInvoiced);
      const wanted = Number(invLine.quantity);
      const increment = Math.max(0, Math.min(wanted, pending));

      if (increment < wanted) {
        console.warn(
          `[confirmPurchaseInvoice] Clamp applied on PO line ${pol.id}: wanted=${wanted}, pending=${pending}, increment=${increment}`
        );
      }

      if (increment > 0) {
        ops.push(
          prisma.purchase_order_lines.update({
            where: { id: pol.id },
            data: { invoiced_qty: { increment } },
          })
        );
      }
    }

    await prisma.$transaction(ops);

    // Recalcular invoicing_status de todas las OCs afectadas
    // Primero leemos los valores actualizados (queries read-only en paralelo),
    // luego construimos las updates como PrismaPromise[] para la transacción.
    if (affectedOrderIds.size > 0) {
      const orderIds = Array.from(affectedOrderIds);
      const linesByOrder = await Promise.all(
        orderIds.map((orderId) =>
          prisma.purchase_order_lines.findMany({ where: { order_id: orderId } })
        )
      );

      const statusOps = orderIds.map((orderId, idx) => {
        const updatedLines = linesByOrder[idx];
        const allInvoiced = updatedLines.every((l) => Number(l.invoiced_qty) >= Number(l.quantity));
        const someInvoiced = updatedLines.some((l) => Number(l.invoiced_qty) > 0);
        const newStatus = allInvoiced ? 'FULLY_INVOICED' : someInvoiced ? 'PARTIALLY_INVOICED' : 'NOT_INVOICED';
        return prisma.purchase_orders.update({
          where: { id: orderId },
          data: { invoicing_status: newStatus },
        });
      });

      await prisma.$transaction(statusOps);
    }

    revalidatePath('/dashboard/purchasing');
    return { error: null };
  } catch (error) {
    console.error('Error confirming invoice:', error);
    return { error: String(error) };
  }
}

// ============================================================
// Receiving support — queries para remitos de recepción
// ============================================================

export async function getInvoicesForReceiving(supplierId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const invoices = await prisma.purchase_invoices.findMany({
    where: {
      company_id: companyId,
      supplier_id: supplierId,
      status: 'CONFIRMED',
      receiving_status: { in: ['NOT_RECEIVED', 'PARTIALLY_RECEIVED'] },
      voucher_type: {
        in: ['FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'NOTA_DEBITO_A', 'NOTA_DEBITO_B', 'NOTA_DEBITO_C'] as any,
      },
    },
    select: {
      id: true,
      full_number: true,
      total: true,
      issue_date: true,
      voucher_type: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return invoices.map((inv) => ({ ...inv, total: Number(inv.total) }));
}

export async function getInvoiceLinesForReceiving(invoiceId: string) {
  const lines = await prisma.purchase_invoice_lines.findMany({
    where: { invoice_id: invoiceId },
    include: {
      product: {
        select: { id: true, code: true, name: true, unit_of_measure: true, track_stock: true },
      },
    },
  });

  return lines
    .filter((l) => l.product?.track_stock)
    .map((l) => ({
      id: l.id,
      product_id: l.product_id,
      product: l.product,
      description: l.description,
      quantity: Number(l.quantity),
      received_qty: Number(l.received_qty),
      pending_qty: Number(l.quantity) - Number(l.received_qty),
      unit_cost: Number(l.unit_cost),
      vat_rate: Number(l.vat_rate),
      purchase_order_line_id: l.purchase_order_line_id,
    }))
    .filter((l) => l.pending_qty > 0);
}

export async function updatePurchaseInvoiceReceivingStatus(invoiceId: string) {
  const lines = await prisma.purchase_invoice_lines.findMany({
    where: { invoice_id: invoiceId },
    include: { product: { select: { track_stock: true } } },
  });

  const trackableLines = lines.filter((l) => l.product?.track_stock);
  if (trackableLines.length === 0) return;

  const allReceived = trackableLines.every(
    (l) => Number(l.received_qty) >= Number(l.quantity)
  );
  const someReceived = trackableLines.some(
    (l) => Number(l.received_qty) > 0
  );

  let newStatus: 'NOT_RECEIVED' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' = 'NOT_RECEIVED';
  if (allReceived) newStatus = 'FULLY_RECEIVED';
  else if (someReceived) newStatus = 'PARTIALLY_RECEIVED';

  await prisma.purchase_invoices.update({
    where: { id: invoiceId },
    data: { receiving_status: newStatus },
  });
}
