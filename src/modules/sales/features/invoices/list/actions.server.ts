'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { requirePermission } from '@/shared/lib/permissions';
import type { DataTableSearchParams } from '@/shared/components/data-table/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildFiltersWhere,
  buildTextFiltersWhere,
  buildDateRangeFiltersWhere,
} from '@/shared/components/data-table/helpers';
import { computeSalesInvoiceTotals } from '@/modules/sales/shared/calc';
import { assignNextSalesNumber, formatSalesFullNumber } from '@/modules/sales/shared/numbering';
import { recalcSalesInvoiceStatus } from '@/modules/sales/shared/recalc-sales-invoice-status';
import { isNoteVoucherType, isInvoiceVoucherType } from '@/modules/sales/shared/types';
import { revalidatePath } from 'next/cache';

type SalesInvoiceInputData = {
  customer_id: string;
  point_of_sale_id: string;
  voucher_type: string;
  issue_date: string;
  due_date?: string;
  cae?: string;
  cae_expiry_date?: string;
  currency?: string;
  exchange_rate?: number;
  notes?: string;
  original_invoice_id?: string | null;
  global_discount_type?: 'PERCENTAGE' | 'FIXED' | null;
  global_discount_value?: number | null;
  lines: {
    product_id?: string;
    service_item_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
    discount_type?: 'PERCENTAGE' | 'FIXED' | null;
    discount_value?: number | null;
  }[];
  perceptions?: { tax_type_id: string; base_amount: number; rate: number; amount: number; notes?: string }[];
  other_charges?: { description: string; amount: number }[];
};

// ============================================================
// QUERIES
// ============================================================

export async function getSalesInvoicesPaginated(searchParams: DataTableSearchParams) {
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

    const filtersWhere = buildFiltersWhere(state.filters, { status: 'status', voucher_type: 'voucher_type' });
    Object.assign(where, filtersWhere);

    const textWhere = buildTextFiltersWhere(state.filters, ['full_number']);
    Object.assign(where, textWhere);

    const customerFilter = state.filters.customer?.[0];
    if (customerFilter) {
      where.customer = { name: { contains: customerFilter, mode: 'insensitive' } };
    }

    const dateWhere = buildDateRangeFiltersWhere(state.filters, ['issue_date']);
    Object.assign(where, dateWhere);

    const [data, total] = await Promise.all([
      prisma.sales_invoices.findMany({
        where: where as any,
        include: { customer: { select: { name: true } } },
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      prisma.sales_invoices.count({ where: where as any }),
    ]);

    return {
      data: data.map((inv) => ({
        ...inv,
        subtotal: Number(inv.subtotal),
        vat_amount: Number(inv.vat_amount),
        other_taxes: Number(inv.other_taxes),
        other_charges: Number(inv.other_charges),
        total: Number(inv.total),
        exchange_rate: Number(inv.exchange_rate),
        discount_amount: Number(inv.discount_amount),
        global_discount_value:
          inv.global_discount_value !== null ? Number(inv.global_discount_value) : null,
      })),
      total,
    };
  } catch (error) {
    console.error('Error fetching sales invoices:', error);
    return { data: [], total: 0 };
  }
}

export async function getSalesInvoiceFacets(): Promise<Record<string, { value: string; count: number }[]>> {
  const { companyId } = await getActionContext();
  if (!companyId) return {};
  try {
    const [statusGroups, typeGroups] = await Promise.all([
      prisma.sales_invoices.groupBy({ by: ['status'], where: { company_id: companyId }, _count: true }),
      prisma.sales_invoices.groupBy({ by: ['voucher_type'], where: { company_id: companyId }, _count: true }),
    ]);
    return {
      status: statusGroups.map((g) => ({ value: g.status, count: g._count })),
      voucher_type: typeGroups.map((g) => ({ value: g.voucher_type, count: g._count })),
    };
  } catch {
    return {};
  }
}

/** Detalle completo de una factura de venta (para vista de detalle). */
export async function getSalesInvoiceById(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  const inv = await prisma.sales_invoices.findFirst({
    where: { id, company_id: companyId },
    include: {
      customer: true,
      point_of_sale_rel: true,
      original_invoice: { select: { id: true, full_number: true, voucher_type: true } },
      credit_debit_notes: { select: { id: true, full_number: true, voucher_type: true, total: true, status: true } },
      lines: { include: { product: { select: { name: true, code: true } } } },
      perceptions: { include: { tax_type: { select: { name: true, code: true } } } },
      other_charges_items: true,
      receipt_items: {
        include: { receipt: { select: { id: true, full_number: true, date: true, status: true } } },
      },
    },
  });
  if (!inv) return null;

  const num = (v: any) => (v !== null && v !== undefined ? Number(v) : v);
  return {
    ...inv,
    subtotal: num(inv.subtotal),
    vat_amount: num(inv.vat_amount),
    other_taxes: num(inv.other_taxes),
    other_charges: num(inv.other_charges),
    total: num(inv.total),
    exchange_rate: num(inv.exchange_rate),
    discount_amount: num(inv.discount_amount),
    global_discount_value: num(inv.global_discount_value),
    lines: inv.lines.map((l) => ({
      ...l,
      quantity: num(l.quantity),
      unit_price: num(l.unit_price),
      vat_rate: num(l.vat_rate),
      vat_amount: num(l.vat_amount),
      subtotal: num(l.subtotal),
      total: num(l.total),
      discount_value: num(l.discount_value),
      discount_amount: num(l.discount_amount),
    })),
    perceptions: inv.perceptions.map((p) => ({
      ...p,
      base_amount: num(p.base_amount),
      rate: num(p.rate),
      amount: num(p.amount),
    })),
    other_charges_items: inv.other_charges_items.map((oc) => ({ ...oc, amount: num(oc.amount) })),
    credit_debit_notes: inv.credit_debit_notes.map((n) => ({ ...n, total: num(n.total) })),
    receipt_items: inv.receipt_items.map((ri) => ({ ...ri, amount: num(ri.amount) })),
  };
}

/** Facturas confirmadas del cliente (para asociar una NC/ND). */
export async function getCustomerInvoicesForNote(customerId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const invoices = await prisma.sales_invoices.findMany({
    where: {
      company_id: companyId,
      customer_id: customerId,
      voucher_type: { in: ['FACTURA_A', 'FACTURA_B'] },
      status: { in: ['CONFIRMED', 'PARTIAL_PAID', 'PAID'] },
    },
    select: { id: true, full_number: true, voucher_type: true, total: true, issue_date: true },
    orderBy: { issue_date: 'desc' },
  });
  return invoices.map((i) => ({ ...i, total: Number(i.total) }));
}

// ============================================================
// MUTATIONS
// ============================================================

async function validateNote(companyId: string, customerId: string, originalInvoiceId?: string | null) {
  const original = await prisma.sales_invoices.findFirst({
    where: { id: originalInvoiceId ?? '', company_id: companyId },
    select: { id: true, customer_id: true, voucher_type: true, status: true },
  });
  if (!original) return 'La factura asociada no existe';
  if (original.customer_id !== customerId) return 'La nota debe ser del mismo cliente que la factura';
  if (!isInvoiceVoucherType(original.voucher_type)) return 'Solo se pueden asociar notas a una factura';
  if (!['CONFIRMED', 'PARTIAL_PAID', 'PAID'].includes(original.status)) {
    return 'La factura asociada debe estar confirmada';
  }
  return null;
}

async function validatePerceptions(
  companyId: string,
  perceptions: { tax_type_id: string }[]
): Promise<string | null> {
  if (!perceptions.length) return null;
  const ids = Array.from(new Set(perceptions.map((p) => p.tax_type_id)));
  const valid = await prisma.tax_types.findMany({
    where: { id: { in: ids }, company_id: companyId, kind: 'PERCEPTION' },
    select: { id: true },
  });
  return valid.length !== ids.length ? 'Alguna percepción tiene un tipo inválido' : null;
}

export async function createSalesInvoice(data: SalesInvoiceInputData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No hay empresa seleccionada' };

  try {
    await requirePermission('ventas.create');

    if (isNoteVoucherType(data.voucher_type)) {
      const noteError = await validateNote(companyId, data.customer_id, data.original_invoice_id);
      if (noteError) return { data: null, error: noteError };
    }
    const percError = await validatePerceptions(companyId, data.perceptions ?? []);
    if (percError) return { data: null, error: percError };

    const totals = computeSalesInvoiceTotals(data);

    const invoice = await prisma.sales_invoices.create({
      data: {
        company_id: companyId,
        customer_id: data.customer_id,
        point_of_sale_id: data.point_of_sale_id,
        voucher_type: data.voucher_type as any,
        issue_date: new Date(data.issue_date),
        due_date: data.due_date ? new Date(data.due_date) : null,
        cae: data.cae || null,
        cae_expiry_date: data.cae_expiry_date ? new Date(data.cae_expiry_date) : null,
        currency: data.currency || 'ARS',
        exchange_rate: data.currency === 'USD' ? (data.exchange_rate ?? 1) : 1,
        notes: data.notes || null,
        original_invoice_id: data.original_invoice_id || null,
        global_discount_type: (data.global_discount_type as any) || null,
        global_discount_value: data.global_discount_type ? (data.global_discount_value ?? 0) : null,
        discount_amount: totals.discount_amount,
        subtotal: totals.subtotal,
        vat_amount: totals.vat_amount,
        other_taxes: totals.other_taxes,
        other_charges: totals.other_charges,
        total: totals.total,
        status: 'DRAFT',
        lines: { create: totals.lines as any },
        ...(totals.perceptions.length > 0 ? { perceptions: { create: totals.perceptions as any } } : {}),
        ...(totals.otherChargesItems.length > 0
          ? { other_charges_items: { create: totals.otherChargesItems } }
          : {}),
      },
    });

    revalidatePath('/dashboard/sales');
    return { data: { id: invoice.id }, error: null };
  } catch (error: any) {
    console.error('Error creando factura de venta:', error);
    return { data: null, error: error?.message || String(error) };
  }
}

export async function updateSalesInvoice(invoiceId: string, data: SalesInvoiceInputData) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No hay empresa seleccionada' };

  try {
    await requirePermission('ventas.update');

    const existing = await prisma.sales_invoices.findFirst({
      where: { id: invoiceId, company_id: companyId },
      select: { id: true, status: true },
    });
    if (!existing) return { data: null, error: 'Factura no encontrada' };
    if (existing.status !== 'DRAFT') {
      return { data: null, error: 'Solo se pueden editar facturas en borrador' };
    }

    if (isNoteVoucherType(data.voucher_type)) {
      const noteError = await validateNote(companyId, data.customer_id, data.original_invoice_id);
      if (noteError) return { data: null, error: noteError };
    }
    const percError = await validatePerceptions(companyId, data.perceptions ?? []);
    if (percError) return { data: null, error: percError };

    const totals = computeSalesInvoiceTotals(data);

    await prisma.$transaction([
      prisma.sales_invoice_lines.deleteMany({ where: { invoice_id: invoiceId } }),
      prisma.sales_invoice_perceptions.deleteMany({ where: { invoice_id: invoiceId } }),
      prisma.sales_invoice_other_charges.deleteMany({ where: { invoice_id: invoiceId } }),
      prisma.sales_invoices.update({
        where: { id: invoiceId },
        data: {
          customer_id: data.customer_id,
          point_of_sale_id: data.point_of_sale_id,
          voucher_type: data.voucher_type as any,
          issue_date: new Date(data.issue_date),
          due_date: data.due_date ? new Date(data.due_date) : null,
          cae: data.cae || null,
          cae_expiry_date: data.cae_expiry_date ? new Date(data.cae_expiry_date) : null,
          currency: data.currency || 'ARS',
          exchange_rate: data.currency === 'USD' ? (data.exchange_rate ?? 1) : 1,
          notes: data.notes || null,
          original_invoice_id: data.original_invoice_id || null,
          global_discount_type: (data.global_discount_type as any) || null,
          global_discount_value: data.global_discount_type ? (data.global_discount_value ?? 0) : null,
          discount_amount: totals.discount_amount,
          subtotal: totals.subtotal,
          vat_amount: totals.vat_amount,
          other_taxes: totals.other_taxes,
          other_charges: totals.other_charges,
          total: totals.total,
          lines: { create: totals.lines as any },
          ...(totals.perceptions.length > 0 ? { perceptions: { create: totals.perceptions as any } } : {}),
          ...(totals.otherChargesItems.length > 0
            ? { other_charges_items: { create: totals.otherChargesItems } }
            : {}),
        },
      }),
    ]);

    revalidatePath('/dashboard/sales');
    revalidatePath(`/dashboard/sales/invoices/${invoiceId}`);
    return { data: { id: invoiceId }, error: null };
  } catch (error: any) {
    console.error('Error actualizando factura de venta:', error);
    return { data: null, error: error?.message || String(error) };
  }
}

/** Confirma la factura: asigna número correlativo (secuencia) y pasa a CONFIRMED. */
export async function confirmSalesInvoice(invoiceId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    await requirePermission('ventas.confirm');

    const invoice = await prisma.sales_invoices.findFirst({
      where: { id: invoiceId, company_id: companyId },
      select: {
        id: true,
        status: true,
        voucher_type: true,
        point_of_sale_id: true,
        original_invoice_id: true,
        point_of_sale_rel: { select: { number: true } },
      },
    });
    if (!invoice) return { error: 'Factura no encontrada' };
    if (invoice.status !== 'DRAFT') return { error: 'La factura no está en borrador' };
    if (!invoice.point_of_sale_id || !invoice.point_of_sale_rel) {
      return { error: 'La factura no tiene punto de venta asignado' };
    }

    await prisma.$transaction(async (tx) => {
      const number = await assignNextSalesNumber(tx, invoice.point_of_sale_id!, invoice.voucher_type);
      const fullNumber = formatSalesFullNumber(invoice.point_of_sale_rel!.number, number);
      await tx.sales_invoices.update({
        where: { id: invoiceId },
        data: { status: 'CONFIRMED', number, full_number: fullNumber, confirmed_at: new Date() },
      });
    });

    // Si es NC/ND, recalcular el estado de cobro de la factura asociada.
    if (isNoteVoucherType(invoice.voucher_type) && invoice.original_invoice_id) {
      await recalcSalesInvoiceStatus(invoice.original_invoice_id);
    }

    revalidatePath('/dashboard/sales');
    revalidatePath(`/dashboard/sales/invoices/${invoiceId}`);
    return { error: null };
  } catch (error: any) {
    console.error('Error confirmando factura de venta:', error);
    return { error: error?.message || String(error) };
  }
}

/** Anula una factura confirmada (→ CANCELLED). Recalcula la factura asociada si es NC/ND. */
export async function cancelSalesInvoice(invoiceId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    await requirePermission('ventas.confirm');

    const invoice = await prisma.sales_invoices.findFirst({
      where: { id: invoiceId, company_id: companyId },
      select: { id: true, status: true, voucher_type: true, original_invoice_id: true },
    });
    if (!invoice) return { error: 'Factura no encontrada' };
    if (invoice.status === 'CANCELLED') return { error: 'La factura ya está anulada' };
    if (invoice.status === 'DRAFT') return { error: 'Un borrador se elimina, no se anula' };

    // No permitir anular una factura con cobros aplicados.
    const applied = await prisma.receipt_items.aggregate({
      where: { invoice_id: invoiceId, receipt: { status: 'CONFIRMED' } },
      _sum: { amount: true },
    });
    if (Number(applied._sum.amount ?? 0) > 0) {
      return { error: 'No se puede anular: la factura tiene recibos aplicados. Anulá los recibos primero.' };
    }

    await prisma.sales_invoices.update({ where: { id: invoiceId }, data: { status: 'CANCELLED' } });

    if (isNoteVoucherType(invoice.voucher_type) && invoice.original_invoice_id) {
      await recalcSalesInvoiceStatus(invoice.original_invoice_id);
    }

    revalidatePath('/dashboard/sales');
    revalidatePath(`/dashboard/sales/invoices/${invoiceId}`);
    return { error: null };
  } catch (error: any) {
    console.error('Error anulando factura de venta:', error);
    return { error: error?.message || String(error) };
  }
}

/** Elimina una factura en borrador (borrado físico). */
export async function deleteSalesInvoice(invoiceId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    await requirePermission('ventas.delete');

    const invoice = await prisma.sales_invoices.findFirst({
      where: { id: invoiceId, company_id: companyId },
      select: { id: true, status: true },
    });
    if (!invoice) return { error: 'Factura no encontrada' };
    if (invoice.status !== 'DRAFT') {
      return { error: 'Solo se pueden eliminar borradores. Una factura confirmada se anula.' };
    }

    await prisma.sales_invoices.delete({ where: { id: invoiceId } });
    revalidatePath('/dashboard/sales');
    return { error: null };
  } catch (error: any) {
    console.error('Error eliminando factura de venta:', error);
    return { error: error?.message || String(error) };
  }
}
