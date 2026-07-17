'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { isActiveUserOwner } from '@/shared/lib/permissions';
import { storageServer } from '@/shared/lib/storage-server';
import { supabaseServer } from '@/shared/lib/supabase/server';
import {
  PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME,
  PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES,
} from '@/modules/purchasing/shared/validators';
import { isCreditNoteVoucherType, CREDIT_NOTE_VOUCHER_TYPES } from '@/modules/purchasing/shared/types';
import type { DataTableSearchParams } from '@/shared/components/data-table/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildFiltersWhere,
  buildTextFiltersWhere,
  buildDateRangeFiltersWhere,
} from '@/shared/components/data-table/helpers';
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

    const textWhere = buildTextFiltersWhere(state.filters, ['full_number']);
    Object.assign(where, textWhere);

    const supplierFilter = state.filters.supplier?.[0];
    if (supplierFilter) {
      where.supplier = { business_name: { contains: supplierFilter, mode: 'insensitive' } };
    }

    const dateWhere = buildDateRangeFiltersWhere(state.filters, ['issue_date']);
    Object.assign(where, dateWhere);

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
  currency?: string;
  exchange_rate?: number;
  notes?: string;
  original_invoice_id?: string | null;
  purchase_order_id?: string;
  purchase_order_ids?: string[];
  global_discount_type?: 'PERCENTAGE' | 'FIXED' | null;
  global_discount_value?: number | null;
  lines: {
    product_id?: string;
    description: string;
    quantity: number;
    unit_cost: number;
    vat_rate: number;
    discount_type?: 'PERCENTAGE' | 'FIXED' | null;
    discount_value?: number | null;
    purchase_order_line_id?: string;
  }[];
  perceptions?: { tax_type_id: string; base_amount: number; rate: number; amount: number; notes?: string }[];
  other_charges?: { description: string; amount: number }[];
}) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  const r2 = (n: number) => Math.round(n * 100) / 100;

  try {
    const fullNumber = `${data.point_of_sale.padStart(5, '0')}-${data.number.padStart(8, '0')}`;

    // Paso 1: calcular líneas con descuento por línea
    const lines = data.lines.map((line) => {
      const subtotalBruto = line.quantity * line.unit_cost;
      const discountType = line.discount_type || null;
      const discountValue = line.discount_value ?? 0;
      const lineDiscount =
        discountType === 'PERCENTAGE'
          ? subtotalBruto * discountValue / 100
          : discountType === 'FIXED'
            ? discountValue
            : 0;
      const subtotal = r3(subtotalBruto - lineDiscount);
      const vatAmount = r3(subtotal * (line.vat_rate / 100));
      return {
        product_id: line.product_id || null,
        description: line.description,
        quantity: line.quantity,
        unit_cost: line.unit_cost,
        vat_rate: line.vat_rate,
        discount_type: discountType as any,
        discount_value: discountType ? discountValue : null,
        discount_amount: r3(lineDiscount),
        vat_amount: vatAmount,
        subtotal,
        total: r3(subtotal + vatAmount),
        purchase_order_line_id: line.purchase_order_line_id || null,
      };
    });

    // Paso 2: totales de líneas (ya con descuento por línea)
    const subtotalAfterLines = lines.reduce((s, l) => s + l.subtotal, 0);
    const lineDiscountsTotal = lines.reduce((s, l) => s + l.discount_amount, 0);

    // Paso 3: descuento global sobre subtotal neto
    const globalType = data.global_discount_type || null;
    const globalValue = data.global_discount_value ?? 0;
    const globalDiscountAmount =
      globalType === 'PERCENTAGE'
        ? r2(subtotalAfterLines * globalValue / 100)
        : globalType === 'FIXED'
          ? r2(globalValue)
          : 0;

    // Paso 4: recalcular IVA proporcional con descuento global
    let totalVat = 0;
    if (globalDiscountAmount > 0 && subtotalAfterLines > 0) {
      for (const l of lines) {
        const proportion = l.subtotal / subtotalAfterLines;
        const lineGlobalShare = globalDiscountAmount * proportion;
        const netAfterGlobal = l.subtotal - lineGlobalShare;
        totalVat += netAfterGlobal * (l.vat_rate / 100);
      }
      totalVat = r2(totalVat);
    } else {
      totalVat = r2(lines.reduce((s, l) => s + l.vat_amount, 0));
    }

    const invoiceSubtotal = r2(subtotalAfterLines - globalDiscountAmount);
    const totalDiscountAmount = r2(lineDiscountsTotal + globalDiscountAmount);

    // Percepciones
    const perceptions = (data.perceptions ?? []).map((p) => ({
      tax_type_id: p.tax_type_id,
      base_amount: r3(p.base_amount),
      rate: p.rate,
      amount: r3(p.amount),
      notes: p.notes?.trim() || null,
    }));
    const otherTaxes = perceptions.reduce((s, p) => s + p.amount, 0);

    // Otros gastos (flete, seguro, etc.) — suman al total pero NO afectan IVA
    const otherChargesItems = (data.other_charges ?? []).map((oc) => ({
      description: oc.description,
      amount: r3(oc.amount),
    }));
    const otherChargesTotal = r2(otherChargesItems.reduce((s, oc) => s + oc.amount, 0));

    const total = r2(invoiceSubtotal + totalVat + otherTaxes + otherChargesTotal);

    // Validar percepciones
    if (perceptions.length > 0) {
      const taxTypeIds = Array.from(new Set(perceptions.map((p) => p.tax_type_id)));
      const validTaxes = await prisma.tax_types.findMany({
        where: { id: { in: taxTypeIds }, company_id: companyId, kind: 'PERCEPTION' },
        select: { id: true },
      });
      if (validTaxes.length !== taxTypeIds.length) {
        return { data: null, error: 'Alguna percepción tiene un tipo inválido' };
      }
    }

    // Nota de crédito: debe asociarse a una factura del mismo proveedor (a la que descuenta saldo).
    let creditNoteOriginalId: string | null = null;
    if (isCreditNoteVoucherType(data.voucher_type)) {
      if (!data.original_invoice_id) {
        return { data: null, error: 'La nota de crédito debe indicar la factura que corrige' };
      }
      const original = await prisma.purchase_invoices.findFirst({
        where: { id: data.original_invoice_id, company_id: companyId, supplier_id: data.supplier_id },
        select: { id: true, voucher_type: true },
      });
      if (!original) {
        return { data: null, error: 'La factura a corregir no existe o no pertenece al proveedor' };
      }
      if (isCreditNoteVoucherType(original.voucher_type)) {
        return { data: null, error: 'No se puede asociar una nota de crédito a otra nota de crédito' };
      }
      creditNoteOriginalId = original.id;
    }

    // Derivar OC primaria
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
        currency: data.currency || 'ARS',
        exchange_rate: data.currency === 'ARS' ? 1 : (data.exchange_rate ?? 1),
        notes: data.notes || null,
        original_invoice_id: creditNoteOriginalId,
        purchase_order_id: primaryOrderId,
        global_discount_type: globalType as any,
        global_discount_value: globalType ? globalValue : null,
        discount_amount: totalDiscountAmount,
        subtotal: invoiceSubtotal,
        vat_amount: totalVat,
        other_taxes: otherTaxes,
        total,
        other_charges: otherChargesTotal,
        lines: { create: lines },
        ...(perceptions.length > 0 ? { perceptions: { create: perceptions } } : {}),
        ...(otherChargesItems.length > 0 ? { other_charges_items: { create: otherChargesItems } } : {}),
      },
    });

    revalidatePath('/dashboard/purchasing');
    return {
      data: { ...invoice, subtotal: Number(invoice.subtotal), vat_amount: Number(invoice.vat_amount), other_taxes: Number(invoice.other_taxes), other_charges: Number(invoice.other_charges), total: Number(invoice.total) },
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

// ============================================================
// Attachment helpers (COD-457)
// ============================================================

const ALLOWED_MIME_SET = new Set<string>(PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME as readonly string[]);

function getExtensionFromMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'application/pdf') return 'pdf';
  return 'bin';
}

/**
 * Paso 1: valida la factura y el archivo, calcula el path en storage,
 * y borra el adjunto previo si existía. El cliente sube el archivo directo a Supabase.
 */
export async function preparePurchaseInvoiceAttachmentUpload(input: {
  invoiceId: string;
  fileName: string;
  mime: string;
  size: number;
}) {
  const { companyId } = await getActionContext();
  if (!companyId) return { ok: false as const, error: 'No company selected' };

  const { invoiceId, fileName, mime, size } = input;
  if (!invoiceId) return { ok: false as const, error: 'invoiceId requerido' };
  if (!ALLOWED_MIME_SET.has(mime)) {
    return { ok: false as const, error: 'Tipo de archivo no permitido. Solo se aceptan JPG, PNG o PDF.' };
  }
  if (size > PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES) {
    return { ok: false as const, error: 'El archivo supera los 10 MB permitidos.' };
  }

  const invoice = await prisma.purchase_invoices.findFirst({
    where: { id: invoiceId, company_id: companyId },
    select: { id: true, document_key: true },
  });
  if (!invoice) return { ok: false as const, error: 'Factura no encontrada' };

  if (invoice.document_key) {
    try {
      await storageServer.remove('purchase_invoices', [invoice.document_key]);
    } catch (e) {
      console.warn('Error removing previous attachment:', e);
    }
  }

  const ext = getExtensionFromMime(mime) || (fileName.split('.').pop() || 'bin').toLowerCase();
  const path = `${companyId}/${invoiceId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  return { ok: true as const, path, bucket: 'purchase_invoices' as const };
}

/**
 * Paso 2: confirma el upload del adjunto y actualiza la factura con la URL pública.
 */
export async function confirmPurchaseInvoiceAttachmentUpload(input: {
  invoiceId: string;
  path: string;
}) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  const { invoiceId, path } = input;
  if (!invoiceId || !path) return { error: 'Datos incompletos' };

  try {
    const invoice = await prisma.purchase_invoices.findFirst({
      where: { id: invoiceId, company_id: companyId },
      select: { id: true },
    });
    if (!invoice) return { error: 'Factura no encontrada' };

    const publicUrl = await storageServer.getPublicUrl('purchase_invoices', path);

    await prisma.purchase_invoices.update({
      where: { id: invoiceId },
      data: { document_url: publicUrl, document_key: path },
    });

    revalidatePath('/dashboard/purchasing');
    revalidatePath(`/dashboard/purchasing/invoices/${invoiceId}`);
    return { error: null };
  } catch (error: any) {
    console.error('Error confirming invoice attachment:', error);
    return { error: error?.message || String(error) };
  }
}

export async function removePurchaseInvoiceDocument(invoiceId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  try {
    const invoice = await prisma.purchase_invoices.findFirst({
      where: { id: invoiceId, company_id: companyId },
      select: { id: true, document_key: true },
    });
    if (!invoice) return { error: 'Factura no encontrada' };

    if (invoice.document_key) {
      try {
        await storageServer.remove('purchase_invoices', [invoice.document_key]);
      } catch (e) {
        console.warn('Error removing attachment from storage:', e);
      }
    }

    await prisma.purchase_invoices.update({
      where: { id: invoiceId },
      data: { document_url: null, document_key: null },
    });

    revalidatePath('/dashboard/purchasing');
    revalidatePath(`/dashboard/purchasing/invoices/${invoiceId}`);
    return { error: null };
  } catch (error: any) {
    console.error('Error removing invoice document:', error);
    return { error: error?.message || String(error) };
  }
}

export async function getPurchaseInvoiceAttachmentSignedUrl(invoiceId: string, expiresInSec = 300) {
  const { companyId } = await getActionContext();
  if (!companyId) return { url: null, error: 'No company selected' };

  const invoice = await prisma.purchase_invoices.findFirst({
    where: { id: invoiceId, company_id: companyId },
    select: { document_key: true },
  });
  if (!invoice?.document_key) return { url: null, error: 'Sin adjunto' };

  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.storage
      .from('purchase_invoices')
      .createSignedUrl(invoice.document_key, expiresInSec);
    if (error) return { url: null, error: error.message };
    return { url: data.signedUrl, error: null };
  } catch (error: any) {
    return { url: null, error: error?.message || String(error) };
  }
}

export async function getPurchaseInvoiceForEdit(invoiceId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  const invoice = await prisma.purchase_invoices.findFirst({
    where: { id: invoiceId, company_id: companyId },
  });
  if (!invoice) return null;

  // DRAFT es editable por cualquiera con acceso; CONFIRMED solo por el owner de la empresa.
  const editable =
    invoice.status === 'DRAFT' || (invoice.status === 'CONFIRMED' && (await isActiveUserOwner()));
  if (!editable) return null;

  const [lines, perceptions, otherChargesItems] = await Promise.all([
    prisma.purchase_invoice_lines.findMany({
      where: { invoice_id: invoiceId },
      include: {
        purchase_order_line: {
          select: { id: true, order_id: true, order: { select: { full_number: true } } },
        },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.purchase_invoice_perceptions.findMany({
      where: { invoice_id: invoiceId },
      orderBy: { id: 'asc' },
    }),
    prisma.purchase_invoice_other_charges.findMany({
      where: { invoice_id: invoiceId },
      orderBy: { created_at: 'asc' },
    }),
  ]);

  // Derivar OC ids únicos desde las líneas
  const orderIds = Array.from(
    new Set(
      lines
        .map((l) => l.purchase_order_line?.order_id)
        .filter(Boolean) as string[]
    )
  );

  return {
    id: invoice.id,
    supplier_id: invoice.supplier_id,
    voucher_type: invoice.voucher_type,
    point_of_sale: invoice.point_of_sale,
    number: invoice.number,
    issue_date: invoice.issue_date.toISOString().split('T')[0],
    due_date: invoice.due_date ? invoice.due_date.toISOString().split('T')[0] : '',
    cae: invoice.cae || '',
    currency: invoice.currency || 'ARS',
    exchange_rate: invoice.exchange_rate != null ? Number(invoice.exchange_rate) : 1,
    notes: invoice.notes || '',
    original_invoice_id: invoice.original_invoice_id ?? null,
    purchase_order_ids: orderIds,
    global_discount_type: invoice.global_discount_type as 'PERCENTAGE' | 'FIXED' | null,
    global_discount_value: invoice.global_discount_value != null ? Number(invoice.global_discount_value) : null,
    lines: lines.map((l) => ({
      product_id: l.product_id || '',
      description: l.description,
      quantity: Number(l.quantity),
      unit_cost: Number(l.unit_cost),
      vat_rate: Number(l.vat_rate),
      discount_type: l.discount_type as 'PERCENTAGE' | 'FIXED' | null,
      discount_value: l.discount_value != null ? Number(l.discount_value) : null,
      purchase_order_line_id: l.purchase_order_line_id || '',
      order_id: l.purchase_order_line?.order_id || '',
      order_full_number: l.purchase_order_line?.order?.full_number || '',
    })),
    perceptions: perceptions.map((p) => ({
      tax_type_id: p.tax_type_id,
      base_amount: Number(p.base_amount),
      rate: Number(p.rate),
      amount: Number(p.amount),
      notes: p.notes || '',
    })),
    other_charges: otherChargesItems.map((oc) => ({
      description: oc.description,
      amount: Number(oc.amount),
    })),
  };
}

export async function updatePurchaseInvoice(
  invoiceId: string,
  data: {
    voucher_type: string;
    point_of_sale: string;
    number: string;
    issue_date: string;
    due_date?: string;
    cae?: string;
    currency?: string;
    exchange_rate?: number;
    notes?: string;
    original_invoice_id?: string | null;
    purchase_order_ids?: string[];
    global_discount_type?: 'PERCENTAGE' | 'FIXED' | null;
    global_discount_value?: number | null;
    lines: {
      product_id?: string;
      description: string;
      quantity: number;
      unit_cost: number;
      vat_rate: number;
      discount_type?: 'PERCENTAGE' | 'FIXED' | null;
      discount_value?: number | null;
      purchase_order_line_id?: string;
    }[];
    perceptions?: { tax_type_id: string; base_amount: number; rate: number; amount: number; notes?: string }[];
    other_charges?: { description: string; amount: number }[];
  }
) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  const r2 = (n: number) => Math.round(n * 100) / 100;

  try {
    // Verificar que la factura existe y es editable.
    // DRAFT: editable por cualquiera con acceso. CONFIRMED: solo el owner de la empresa.
    const existing = await prisma.purchase_invoices.findFirst({
      where: { id: invoiceId, company_id: companyId },
      select: { id: true, supplier_id: true, status: true },
    });
    if (!existing) return { data: null, error: 'Factura no encontrada' };
    const editable =
      existing.status === 'DRAFT' ||
      (existing.status === 'CONFIRMED' && (await isActiveUserOwner()));
    if (!editable) {
      return {
        data: null,
        error:
          existing.status === 'CONFIRMED'
            ? 'Solo el dueño de la empresa puede editar una factura confirmada'
            : 'La factura no está en un estado editable',
      };
    }

    const fullNumber = `${data.point_of_sale.padStart(5, '0')}-${data.number.padStart(8, '0')}`;

    // Calcular líneas (misma lógica que createPurchaseInvoice)
    const lines = data.lines.map((line) => {
      const subtotalBruto = line.quantity * line.unit_cost;
      const discountType = line.discount_type || null;
      const discountValue = line.discount_value ?? 0;
      const lineDiscount =
        discountType === 'PERCENTAGE'
          ? subtotalBruto * discountValue / 100
          : discountType === 'FIXED'
            ? discountValue
            : 0;
      const subtotal = r3(subtotalBruto - lineDiscount);
      const vatAmount = r3(subtotal * (line.vat_rate / 100));
      return {
        product_id: line.product_id || null,
        description: line.description,
        quantity: line.quantity,
        unit_cost: line.unit_cost,
        vat_rate: line.vat_rate,
        discount_type: discountType as any,
        discount_value: discountType ? discountValue : null,
        discount_amount: r3(lineDiscount),
        vat_amount: vatAmount,
        subtotal,
        total: r3(subtotal + vatAmount),
        purchase_order_line_id: line.purchase_order_line_id || null,
      };
    });

    const subtotalAfterLines = lines.reduce((s, l) => s + l.subtotal, 0);
    const lineDiscountsTotal = lines.reduce((s, l) => s + l.discount_amount, 0);

    const globalType = data.global_discount_type || null;
    const globalValue = data.global_discount_value ?? 0;
    const globalDiscountAmount =
      globalType === 'PERCENTAGE'
        ? r2(subtotalAfterLines * globalValue / 100)
        : globalType === 'FIXED'
          ? r2(globalValue)
          : 0;

    let totalVat = 0;
    if (globalDiscountAmount > 0 && subtotalAfterLines > 0) {
      for (const l of lines) {
        const proportion = l.subtotal / subtotalAfterLines;
        const lineGlobalShare = globalDiscountAmount * proportion;
        const netAfterGlobal = l.subtotal - lineGlobalShare;
        totalVat += netAfterGlobal * (l.vat_rate / 100);
      }
      totalVat = r2(totalVat);
    } else {
      totalVat = r2(lines.reduce((s, l) => s + l.vat_amount, 0));
    }

    const invoiceSubtotal = r2(subtotalAfterLines - globalDiscountAmount);
    const totalDiscountAmount = r2(lineDiscountsTotal + globalDiscountAmount);

    const perceptions = (data.perceptions ?? []).map((p) => ({
      tax_type_id: p.tax_type_id,
      base_amount: r3(p.base_amount),
      rate: p.rate,
      amount: r3(p.amount),
      notes: p.notes?.trim() || null,
    }));
    const otherTaxes = perceptions.reduce((s, p) => s + p.amount, 0);

    // Otros gastos (flete, seguro, etc.) — suman al total pero NO afectan IVA
    const otherChargesItems = (data.other_charges ?? []).map((oc) => ({
      description: oc.description,
      amount: r3(oc.amount),
    }));
    const otherChargesTotal = r2(otherChargesItems.reduce((s, oc) => s + oc.amount, 0));

    const total = r2(invoiceSubtotal + totalVat + otherTaxes + otherChargesTotal);

    if (perceptions.length > 0) {
      const taxTypeIds = Array.from(new Set(perceptions.map((p) => p.tax_type_id)));
      const validTaxes = await prisma.tax_types.findMany({
        where: { id: { in: taxTypeIds }, company_id: companyId, kind: 'PERCEPTION' },
        select: { id: true },
      });
      if (validTaxes.length !== taxTypeIds.length) {
        return { data: null, error: 'Alguna percepción tiene un tipo inválido' };
      }
    }

    let primaryOrderId: string | null = null;
    if (Array.isArray(data.purchase_order_ids)) {
      primaryOrderId = data.purchase_order_ids.length === 1 ? data.purchase_order_ids[0] : null;
    }

    // Nota de crédito: validar/actualizar la factura que corrige (mismo proveedor).
    let creditNoteOriginalId: string | null = null;
    if (isCreditNoteVoucherType(data.voucher_type)) {
      if (!data.original_invoice_id) {
        return { data: null, error: 'La nota de crédito debe indicar la factura que corrige' };
      }
      const original = await prisma.purchase_invoices.findFirst({
        where: {
          id: data.original_invoice_id,
          company_id: companyId,
          supplier_id: existing.supplier_id,
        },
        select: { id: true, voucher_type: true },
      });
      if (!original) {
        return { data: null, error: 'La factura a corregir no existe o no pertenece al proveedor' };
      }
      if (original.id === invoiceId || isCreditNoteVoucherType(original.voucher_type)) {
        return { data: null, error: 'La factura a corregir no es válida' };
      }
      creditNoteOriginalId = original.id;
    }

    // Transacción: borrar líneas/percepciones/other_charges existentes y recrear + actualizar cabecera
    await prisma.$transaction([
      prisma.purchase_invoice_lines.deleteMany({ where: { invoice_id: invoiceId } }),
      prisma.purchase_invoice_perceptions.deleteMany({ where: { invoice_id: invoiceId } }),
      prisma.purchase_invoice_other_charges.deleteMany({ where: { invoice_id: invoiceId } }),
      prisma.purchase_invoices.update({
        where: { id: invoiceId },
        data: {
          voucher_type: data.voucher_type as any,
          point_of_sale: data.point_of_sale,
          number: data.number,
          full_number: fullNumber,
          issue_date: new Date(data.issue_date),
          due_date: data.due_date ? new Date(data.due_date) : null,
          cae: data.cae || null,
          currency: data.currency || 'ARS',
          exchange_rate: data.currency === 'ARS' ? 1 : (data.exchange_rate ?? 1),
          notes: data.notes || null,
          original_invoice_id: creditNoteOriginalId,
          purchase_order_id: primaryOrderId,
          global_discount_type: globalType as any,
          global_discount_value: globalType ? globalValue : null,
          discount_amount: totalDiscountAmount,
          subtotal: invoiceSubtotal,
          vat_amount: totalVat,
          other_taxes: otherTaxes,
          other_charges: otherChargesTotal,
          total,
          lines: { create: lines },
          ...(perceptions.length > 0 ? { perceptions: { create: perceptions } } : {}),
          ...(otherChargesItems.length > 0 ? { other_charges_items: { create: otherChargesItems } } : {}),
        },
      }),
    ]);

    revalidatePath('/dashboard/purchasing');
    revalidatePath(`/dashboard/purchasing/invoices/${invoiceId}`);
    return { data: { id: invoiceId }, error: null };
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { data: null, error: 'Ya existe una factura con ese número para este proveedor' };
    }
    console.error('Error updating invoice:', error);
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
    // Verifica cantidades por línea Y montos totales facturados vs OC.
    if (affectedOrderIds.size > 0) {
      const orderIds = Array.from(affectedOrderIds);
      const [linesByOrder, orders, invoicedTotalsByOrder] = await Promise.all([
        Promise.all(
          orderIds.map((orderId) =>
            prisma.purchase_order_lines.findMany({ where: { order_id: orderId } })
          )
        ),
        Promise.all(
          orderIds.map((orderId) =>
            prisma.purchase_orders.findUnique({ where: { id: orderId }, select: { total: true } })
          )
        ),
        Promise.all(
          orderIds.map((orderId) =>
            prisma.purchase_invoices.aggregate({
              where: {
                status: 'CONFIRMED',
                OR: [
                  { purchase_order_id: orderId },
                  { lines: { some: { purchase_order_line: { order_id: orderId } } } },
                ],
              },
              _sum: { total: true },
            })
          )
        ),
      ]);

      const statusOps = orderIds.map((orderId, idx) => {
        const updatedLines = linesByOrder[idx];
        const orderTotal = Number(orders[idx]?.total ?? 0);
        const invoicedTotal = Number(invoicedTotalsByOrder[idx]._sum.total ?? 0);

        const allQtyInvoiced = updatedLines.every((l) => Number(l.invoiced_qty) >= Number(l.quantity));
        const someInvoiced = updatedLines.some((l) => Number(l.invoiced_qty) > 0);
        const amountFullyCovered = invoicedTotal >= orderTotal;

        const newStatus =
          allQtyInvoiced && amountFullyCovered
            ? 'FULLY_INVOICED'
            : someInvoiced || invoicedTotal > 0
              ? 'PARTIALLY_INVOICED'
              : 'NOT_INVOICED';

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

/**
 * Facturas (no notas de crédito) de un proveedor que una NC puede corregir.
 * Excluye notas de crédito y comprobantes anulados.
 */
export async function getInvoicesForCreditNote(supplierId: string) {
  const { companyId } = await getActionContext();
  if (!companyId || !supplierId) return [];

  const invoices = await prisma.purchase_invoices.findMany({
    where: {
      company_id: companyId,
      supplier_id: supplierId,
      voucher_type: { notIn: [...CREDIT_NOTE_VOUCHER_TYPES] as any },
      status: { notIn: ['CANCELLED'] },
    },
    select: { id: true, full_number: true, voucher_type: true, total: true, issue_date: true },
    orderBy: { issue_date: 'desc' },
  });

  return invoices.map((i) => ({ ...i, total: Number(i.total) }));
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

/**
 * Elimina (borrado físico) una factura de compra, incluso confirmada.
 * Restricciones:
 *  - Solo el OWNER de la empresa puede hacerlo.
 *  - Se bloquea si la factura tiene pagos imputados en una OP no anulada o
 *    movimientos de caja asociados, para no dejar tesorería inconsistente.
 * Las líneas/percepciones/otros cargos se borran en cascada (FK ON DELETE CASCADE);
 * remitos de recepción y cuotas quedan desvinculados (ON DELETE SET NULL).
 */
export async function deletePurchaseInvoice(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  const isOwner = await isActiveUserOwner();
  if (!isOwner) {
    return { error: 'Solo el dueño de la empresa puede eliminar facturas de compra' };
  }

  try {
    const invoice = await prisma.purchase_invoices.findFirst({
      where: { id, company_id: companyId },
      select: { id: true, full_number: true },
    });
    if (!invoice) return { error: 'Factura no encontrada' };

    // Bloqueo: pagos imputados (en OP no anulada) o movimientos de caja.
    const [activePayment, cashMovement] = await Promise.all([
      prisma.payment_order_items.findFirst({
        where: { invoice_id: id, payment_order: { status: { not: 'CANCELLED' } } },
        select: { payment_order: { select: { full_number: true } } },
      }),
      prisma.cash_movements.findFirst({
        where: { purchase_invoice_id: id },
        select: { id: true },
      }),
    ]);
    if (activePayment) {
      return {
        error: `No se puede eliminar: la factura está imputada a la orden de pago ${activePayment.payment_order?.full_number ?? ''}. Anulá esa OP primero.`,
      };
    }
    if (cashMovement) {
      return { error: 'No se puede eliminar: la factura tiene movimientos de caja asociados.' };
    }

    await prisma.purchase_invoices.delete({ where: { id } });

    revalidatePath('/dashboard/purchasing');
    return { error: null };
  } catch (error) {
    console.error('Error deleting purchase invoice:', error);
    return { error: String(error) };
  }
}
