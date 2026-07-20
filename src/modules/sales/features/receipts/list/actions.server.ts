'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { requirePermission } from '@/shared/lib/permissions';
import type { DataTableSearchParams } from '@/shared/components/data-table/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildFiltersWhere,
  buildDateRangeFiltersWhere,
} from '@/shared/components/data-table/helpers';
import { recalcSalesInvoiceStatusMany } from '@/modules/sales/shared/recalc-sales-invoice-status';
import { isCreditNoteVoucherType, isDebitNoteVoucherType } from '@/modules/sales/shared/types';
import { revalidatePath } from 'next/cache';

const EPS = 0.01;

type ReceiptInputData = {
  customer_id: string;
  date: string;
  notes?: string;
  items: { invoice_id: string; amount: number }[];
  payments?: {
    payment_method: string;
    amount: number;
    reference?: string;
    check_number?: string;
    check_bank?: string;
    check_due_date?: string;
    notes?: string;
  }[];
  withholdings?: { tax_type: string; rate?: number | null; amount: number; certificate_number?: string }[];
};

// ============================================================
// QUERIES
// ============================================================

export async function getReceiptsPaginated(searchParams: DataTableSearchParams) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);

    const where: Record<string, unknown> = { company_id: companyId };
    if (state.search) {
      where.OR = [
        { full_number: { contains: state.search, mode: 'insensitive' } },
        { customer: { name: { contains: state.search, mode: 'insensitive' } } },
      ];
    }
    Object.assign(where, buildFiltersWhere(state.filters, { status: 'status' }));
    Object.assign(where, buildDateRangeFiltersWhere(state.filters, ['date']));

    const [data, total] = await Promise.all([
      prisma.receipts.findMany({
        where: where as any,
        include: { customer: { select: { name: true } }, _count: { select: { items: true } } },
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      prisma.receipts.count({ where: where as any }),
    ]);

    return {
      data: data.map((r) => ({
        ...r,
        total_amount: Number(r.total_amount),
        items_count: r._count.items,
      })),
      total,
    };
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return { data: [], total: 0 };
  }
}

export async function getReceiptFacets(): Promise<Record<string, { value: string; count: number }[]>> {
  const { companyId } = await getActionContext();
  if (!companyId) return {};
  try {
    const statusGroups = await prisma.receipts.groupBy({
      by: ['status'],
      where: { company_id: companyId },
      _count: true,
    });
    return { status: statusGroups.map((g) => ({ value: g.status, count: g._count })) };
  } catch {
    return {};
  }
}

export async function getReceiptById(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  const receipt = await prisma.receipts.findFirst({
    where: { id, company_id: companyId },
    include: {
      customer: true,
      items: { include: { invoice: { select: { id: true, full_number: true, voucher_type: true, total: true } } } },
      payments: true,
      withholdings: true,
    },
  });
  if (!receipt) return null;

  const num = (v: any) => (v !== null && v !== undefined ? Number(v) : v);
  return {
    ...receipt,
    total_amount: num(receipt.total_amount),
    items: receipt.items.map((it) => ({
      ...it,
      amount: num(it.amount),
      invoice: it.invoice ? { ...it.invoice, total: num(it.invoice.total) } : null,
    })),
    payments: receipt.payments.map((p) => ({ ...p, amount: num(p.amount) })),
    withholdings: receipt.withholdings.map((w) => ({ ...w, amount: num(w.amount), rate: num(w.rate) })),
  };
}

/** Saldo pendiente de una factura (excluyendo opcionalmente un recibo, p.ej. al editar). */
async function computeInvoiceOutstanding(invoiceId: string, excludeReceiptId?: string): Promise<number> {
  const invoice = await prisma.sales_invoices.findUnique({
    where: { id: invoiceId },
    select: { total: true },
  });
  if (!invoice) return 0;

  const [receiptAgg, notes] = await Promise.all([
    prisma.receipt_items.aggregate({
      where: {
        invoice_id: invoiceId,
        receipt: { status: 'CONFIRMED', ...(excludeReceiptId ? { id: { not: excludeReceiptId } } : {}) },
      },
      _sum: { amount: true },
    }),
    prisma.sales_invoices.findMany({
      where: { original_invoice_id: invoiceId, status: { in: ['CONFIRMED', 'PARTIAL_PAID', 'PAID'] } },
      select: { voucher_type: true, total: true },
    }),
  ]);

  const total = Number(invoice.total);
  const receiptsApplied = Number(receiptAgg._sum.amount ?? 0);
  let creditNotes = 0;
  let debitNotes = 0;
  for (const n of notes) {
    if (isCreditNoteVoucherType(n.voucher_type)) creditNotes += Number(n.total);
    else if (isDebitNoteVoucherType(n.voucher_type)) debitNotes += Number(n.total);
  }
  const pending = total + debitNotes - receiptsApplied - creditNotes;
  return pending < EPS ? 0 : pending;
}

/** Facturas del cliente con saldo pendiente (para aplicar un recibo). */
export async function getPendingInvoicesForCustomer(customerId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const invoices = await prisma.sales_invoices.findMany({
    where: {
      company_id: companyId,
      customer_id: customerId,
      voucher_type: { in: ['FACTURA_A', 'FACTURA_B'] },
      status: { in: ['CONFIRMED', 'PARTIAL_PAID'] },
    },
    select: { id: true, full_number: true, voucher_type: true, total: true, issue_date: true, due_date: true },
    orderBy: { issue_date: 'asc' },
  });

  const withOutstanding = await Promise.all(
    invoices.map(async (inv) => ({
      ...inv,
      total: Number(inv.total),
      outstanding: await computeInvoiceOutstanding(inv.id),
    }))
  );
  return withOutstanding.filter((i) => i.outstanding > 0);
}

// ============================================================
// MUTATIONS
// ============================================================

function sanitizeReceiptRelations(data: ReceiptInputData) {
  const items = data.items.map((it) => ({ invoice_id: it.invoice_id, amount: Number(it.amount) }));
  const payments = (data.payments ?? []).map((p) => ({
    payment_method: p.payment_method as any,
    amount: Number(p.amount),
    reference: p.reference?.trim() || null,
    check_number: p.check_number?.trim() || null,
    check_bank: p.check_bank?.trim() || null,
    check_due_date: p.check_due_date ? new Date(p.check_due_date) : null,
    notes: p.notes?.trim() || null,
  }));
  const withholdings = (data.withholdings ?? []).map((w) => ({
    tax_type: w.tax_type as any,
    rate: w.rate ?? null,
    amount: Number(w.amount),
    certificate_number: w.certificate_number?.trim() || null,
  }));
  const total = items.reduce((s, it) => s + it.amount, 0);
  return { items, payments, withholdings, total: Math.round(total * 100) / 100 };
}

/** Valida que los importes aplicados no superen el saldo de cada factura. */
async function validateItemsOutstanding(
  companyId: string,
  customerId: string,
  items: { invoice_id: string; amount: number }[],
  excludeReceiptId?: string
): Promise<string | null> {
  for (const item of items) {
    const invoice = await prisma.sales_invoices.findFirst({
      where: { id: item.invoice_id, company_id: companyId, customer_id: customerId },
      select: { id: true, full_number: true, voucher_type: true, status: true },
    });
    if (!invoice) return 'Alguna factura no existe o no pertenece al cliente';
    if (!['FACTURA_A', 'FACTURA_B'].includes(invoice.voucher_type)) {
      return 'Solo se pueden cobrar facturas (no notas)';
    }
    if (!['CONFIRMED', 'PARTIAL_PAID', 'PAID'].includes(invoice.status)) {
      return 'Solo se pueden cobrar facturas confirmadas';
    }
    const outstanding = await computeInvoiceOutstanding(item.invoice_id, excludeReceiptId);
    if (item.amount > outstanding + EPS) {
      return `El importe aplicado a ${invoice.full_number ?? 'la factura'} supera su saldo pendiente (${outstanding.toFixed(2)})`;
    }
  }
  return null;
}

export async function createReceipt(data: ReceiptInputData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No hay empresa seleccionada' };

  try {
    await requirePermission('ventas.create');
    if (!data.items?.length) return { data: null, error: 'Debe aplicar el recibo a al menos una factura' };

    const rel = sanitizeReceiptRelations(data);
    const validationError = await validateItemsOutstanding(companyId, data.customer_id, rel.items);
    if (validationError) return { data: null, error: validationError };

    // Numeración correlativa por empresa: R-00000001
    const last = await prisma.receipts.aggregate({
      where: { company_id: companyId },
      _max: { number: true },
    });
    const number = (last._max.number ?? 0) + 1;
    const fullNumber = `R-${String(number).padStart(8, '0')}`;

    const receipt = await prisma.receipts.create({
      data: {
        company_id: companyId,
        customer_id: data.customer_id,
        number,
        full_number: fullNumber,
        date: new Date(data.date),
        total_amount: rel.total,
        notes: data.notes || null,
        status: 'DRAFT',
        items: { create: rel.items },
        ...(rel.payments.length > 0 ? { payments: { create: rel.payments } } : {}),
        ...(rel.withholdings.length > 0 ? { withholdings: { create: rel.withholdings } } : {}),
      },
    });

    revalidatePath('/dashboard/sales/receipts');
    return { data: { id: receipt.id }, error: null };
  } catch (error: any) {
    if (error?.code === 'P2002') return { data: null, error: 'Conflicto de numeración, reintentá' };
    console.error('Error creando recibo:', error);
    return { data: null, error: error?.message || String(error) };
  }
}

export async function updateReceipt(receiptId: string, data: ReceiptInputData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No hay empresa seleccionada' };

  try {
    await requirePermission('ventas.update');

    const existing = await prisma.receipts.findFirst({
      where: { id: receiptId, company_id: companyId },
      select: { id: true, status: true },
    });
    if (!existing) return { data: null, error: 'Recibo no encontrado' };
    if (existing.status !== 'DRAFT') return { data: null, error: 'Solo se pueden editar recibos en borrador' };

    const rel = sanitizeReceiptRelations(data);
    const validationError = await validateItemsOutstanding(companyId, data.customer_id, rel.items, receiptId);
    if (validationError) return { data: null, error: validationError };

    await prisma.$transaction([
      prisma.receipt_items.deleteMany({ where: { receipt_id: receiptId } }),
      prisma.receipt_payments.deleteMany({ where: { receipt_id: receiptId } }),
      prisma.receipt_withholdings.deleteMany({ where: { receipt_id: receiptId } }),
      prisma.receipts.update({
        where: { id: receiptId },
        data: {
          customer_id: data.customer_id,
          date: new Date(data.date),
          total_amount: rel.total,
          notes: data.notes || null,
          items: { create: rel.items },
          ...(rel.payments.length > 0 ? { payments: { create: rel.payments } } : {}),
          ...(rel.withholdings.length > 0 ? { withholdings: { create: rel.withholdings } } : {}),
        },
      }),
    ]);

    revalidatePath('/dashboard/sales/receipts');
    return { data: { id: receiptId }, error: null };
  } catch (error: any) {
    console.error('Error actualizando recibo:', error);
    return { data: null, error: error?.message || String(error) };
  }
}

/** Confirma el recibo (DRAFT→CONFIRMED) y recalcula el cobro de las facturas. No toca tesorería. */
export async function confirmReceipt(receiptId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    await requirePermission('ventas.confirm');

    const receipt = await prisma.receipts.findFirst({
      where: { id: receiptId, company_id: companyId },
      select: { id: true, status: true, customer_id: true, items: { select: { invoice_id: true, amount: true } } },
    });
    if (!receipt) return { error: 'Recibo no encontrado' };
    if (receipt.status !== 'DRAFT') return { error: 'El recibo no está en borrador' };

    // Revalidar saldos antes de confirmar (evita sobre-aplicación por drafts concurrentes).
    const validationError = await validateItemsOutstanding(
      companyId,
      receipt.customer_id,
      receipt.items.map((i) => ({ invoice_id: i.invoice_id, amount: Number(i.amount) })),
      receiptId
    );
    if (validationError) return { error: validationError };

    await prisma.receipts.update({
      where: { id: receiptId },
      data: { status: 'CONFIRMED', confirmed_at: new Date() },
    });

    await recalcSalesInvoiceStatusMany(receipt.items.map((i) => i.invoice_id));

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/sales/receipts');
    return { error: null };
  } catch (error: any) {
    console.error('Error confirmando recibo:', error);
    return { error: error?.message || String(error) };
  }
}

/** Anula un recibo confirmado y recalcula las facturas que cobraba. */
export async function cancelReceipt(receiptId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    await requirePermission('ventas.confirm');

    const receipt = await prisma.receipts.findFirst({
      where: { id: receiptId, company_id: companyId },
      select: { id: true, status: true, items: { select: { invoice_id: true } } },
    });
    if (!receipt) return { error: 'Recibo no encontrado' };
    if (receipt.status !== 'CONFIRMED') return { error: 'Solo se pueden anular recibos confirmados' };

    await prisma.receipts.update({ where: { id: receiptId }, data: { status: 'CANCELLED' } });
    await recalcSalesInvoiceStatusMany(receipt.items.map((i) => i.invoice_id));

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/sales/receipts');
    return { error: null };
  } catch (error: any) {
    console.error('Error anulando recibo:', error);
    return { error: error?.message || String(error) };
  }
}

/** Elimina un recibo en borrador. */
export async function deleteReceipt(receiptId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    await requirePermission('ventas.delete');

    const receipt = await prisma.receipts.findFirst({
      where: { id: receiptId, company_id: companyId },
      select: { id: true, status: true },
    });
    if (!receipt) return { error: 'Recibo no encontrado' };
    if (receipt.status !== 'DRAFT') return { error: 'Solo se pueden eliminar borradores. Un recibo confirmado se anula.' };

    await prisma.receipts.delete({ where: { id: receiptId } });
    revalidatePath('/dashboard/sales/receipts');
    return { error: null };
  } catch (error: any) {
    console.error('Error eliminando recibo:', error);
    return { error: error?.message || String(error) };
  }
}
