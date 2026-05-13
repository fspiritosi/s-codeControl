'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { storageServer } from '@/shared/lib/storage-server';
import { supabaseServer } from '@/shared/lib/supabase/server';
import {
  PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME,
  PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES,
} from '@/modules/purchasing/shared/validators';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildFiltersWhere,
  buildTextFiltersWhere,
  buildDateRangeFiltersWhere,
} from '@/shared/components/common/DataTable/helpers';
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
    const total = r2(invoiceSubtotal + totalVat + otherTaxes);

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
        notes: data.notes || null,
        purchase_order_id: primaryOrderId,
        global_discount_type: globalType as any,
        global_discount_value: globalType ? globalValue : null,
        discount_amount: totalDiscountAmount,
        subtotal: invoiceSubtotal,
        vat_amount: totalVat,
        other_taxes: otherTaxes,
        total,
        lines: { create: lines },
        ...(perceptions.length > 0 ? { perceptions: { create: perceptions } } : {}),
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
    where: { id: invoiceId, company_id: companyId, status: 'DRAFT' },
  });
  if (!invoice) return null;

  const [lines, perceptions] = await Promise.all([
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
    notes: invoice.notes || '',
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
    notes?: string;
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
  }
) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  const r2 = (n: number) => Math.round(n * 100) / 100;

  try {
    // Verificar que la factura existe y está en DRAFT
    const existing = await prisma.purchase_invoices.findFirst({
      where: { id: invoiceId, company_id: companyId, status: 'DRAFT' },
      select: { id: true, supplier_id: true },
    });
    if (!existing) return { data: null, error: 'Factura no encontrada o no está en borrador' };

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
    const total = r2(invoiceSubtotal + totalVat + otherTaxes);

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

    // Transacción: borrar líneas/percepciones existentes y recrear + actualizar cabecera
    await prisma.$transaction([
      prisma.purchase_invoice_lines.deleteMany({ where: { invoice_id: invoiceId } }),
      prisma.purchase_invoice_perceptions.deleteMany({ where: { invoice_id: invoiceId } }),
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
          notes: data.notes || null,
          purchase_order_id: primaryOrderId,
          global_discount_type: globalType as any,
          global_discount_value: globalType ? globalValue : null,
          discount_amount: totalDiscountAmount,
          subtotal: invoiceSubtotal,
          vat_amount: totalVat,
          other_taxes: otherTaxes,
          total,
          lines: { create: lines },
          ...(perceptions.length > 0 ? { perceptions: { create: perceptions } } : {}),
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
