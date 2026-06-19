'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { requirePermission } from '@/shared/lib/permissions';
import { storageServer } from '@/shared/lib/storage-server';
import { supabaseServer } from '@/shared/lib/supabase/server';
import { CREDIT_NOTE_VOUCHER_TYPES } from '@/modules/purchasing/shared/types';
import {
  PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME,
  PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES,
} from '@/modules/purchasing/shared/validators';
import { revalidatePath } from 'next/cache';

const ALLOWED_MIME_SET = new Set<string>(PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME as readonly string[]);
const BUCKET = 'purchase_orders' as const;

function getExtensionFromMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'application/pdf') return 'pdf';
  return 'bin';
}

/**
 * Recalcula invoicing_status de una OC en base a cantidades facturadas por línea
 * y al monto total facturado (facturas confirmadas vinculadas por FK o por línea).
 * Mismo criterio que el alta de facturas.
 */
async function recalcInvoicingStatus(orderId: string) {
  const [lines, order, invoicedAgg] = await Promise.all([
    prisma.purchase_order_lines.findMany({ where: { order_id: orderId } }),
    prisma.purchase_orders.findUnique({ where: { id: orderId }, select: { total: true } }),
    prisma.purchase_invoices.aggregate({
      where: {
        status: 'CONFIRMED',
        OR: [
          { purchase_order_id: orderId },
          { lines: { some: { purchase_order_line: { order_id: orderId } } } },
        ],
      },
      _sum: { total: true },
    }),
  ]);

  const orderTotal = Number(order?.total ?? 0);
  const invoicedTotal = Number(invoicedAgg._sum.total ?? 0);
  const allQtyInvoiced = lines.length > 0 && lines.every((l) => Number(l.invoiced_qty) >= Number(l.quantity));
  const someInvoiced = lines.some((l) => Number(l.invoiced_qty) > 0);
  const amountFullyCovered = orderTotal > 0 && invoicedTotal >= orderTotal;

  const newStatus =
    allQtyInvoiced && amountFullyCovered
      ? 'FULLY_INVOICED'
      : someInvoiced || invoicedTotal > 0
        ? 'PARTIALLY_INVOICED'
        : 'NOT_INVOICED';

  await prisma.purchase_orders.update({ where: { id: orderId }, data: { invoicing_status: newStatus } });
}

async function getOrderOrThrow(orderId: string, companyId: string) {
  const order = await prisma.purchase_orders.findFirst({
    where: { id: orderId, company_id: companyId },
    select: { id: true, supplier_id: true, total: true },
  });
  if (!order) throw new Error('Orden de compra no encontrada');
  return order;
}

// ============================================================
// QUERIES — imputación
// ============================================================

/** Facturas del mismo proveedor, sin OC asignada, no notas de crédito. */
export async function getImputableInvoices(orderId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const order = await prisma.purchase_orders.findFirst({
    where: { id: orderId, company_id: companyId },
    select: { supplier_id: true },
  });
  if (!order) return [];

  const invoices = await prisma.purchase_invoices.findMany({
    where: {
      company_id: companyId,
      supplier_id: order.supplier_id,
      purchase_order_id: null,
      voucher_type: { notIn: [...CREDIT_NOTE_VOUCHER_TYPES] },
      original_invoice_id: null,
      status: { not: 'CANCELLED' },
    },
    select: { id: true, full_number: true, total: true, issue_date: true, status: true },
    orderBy: { issue_date: 'desc' },
  });

  return invoices.map((i) => ({ ...i, total: Number(i.total) }));
}

/** Gastos del mismo proveedor (o sin proveedor), sin OC asignada. */
export async function getImputableExpenses(orderId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const order = await prisma.purchase_orders.findFirst({
    where: { id: orderId, company_id: companyId },
    select: { supplier_id: true },
  });
  if (!order) return [];

  const expenses = await prisma.expenses.findMany({
    where: {
      company_id: companyId,
      purchase_order_id: null,
      status: { not: 'CANCELLED' },
      OR: [{ supplier_id: order.supplier_id }, { supplier_id: null }],
    },
    select: { id: true, full_number: true, description: true, amount: true, date: true, status: true },
    orderBy: { date: 'desc' },
  });

  return expenses.map((e) => ({ ...e, amount: Number(e.amount) }));
}

/** Resumen de imputación: total OC vs total imputado (facturas + gastos) y excedente. */
export async function getOrderImputationSummary(orderId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  const order = await prisma.purchase_orders.findFirst({
    where: { id: orderId, company_id: companyId },
    select: { id: true, total: true },
  });
  if (!order) return null;

  const [invAgg, expAgg] = await Promise.all([
    prisma.purchase_invoices.aggregate({
      where: { purchase_order_id: orderId, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    }),
    prisma.expenses.aggregate({
      where: { purchase_order_id: orderId, status: { not: 'CANCELLED' } },
      _sum: { amount: true },
    }),
  ]);

  const orderTotal = Number(order.total);
  const invoicesTotal = Number(invAgg._sum.total ?? 0);
  const expensesTotal = Number(expAgg._sum.amount ?? 0);
  const imputedTotal = invoicesTotal + expensesTotal;

  return {
    orderTotal,
    invoicesTotal,
    expensesTotal,
    imputedTotal,
    over: Math.max(0, imputedTotal - orderTotal),
  };
}

// ============================================================
// MUTATIONS — imputación
// ============================================================

export async function imputeInvoicesToOrder(orderId: string, invoiceIds: string[]) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };
  if (!invoiceIds?.length) return { error: 'Sin facturas para imputar' };

  try {
    await requirePermission('compras.update');
    const order = await getOrderOrThrow(orderId, companyId);

    // Validar que todas pertenezcan al mismo proveedor y estén libres.
    const invoices = await prisma.purchase_invoices.findMany({
      where: { id: { in: invoiceIds }, company_id: companyId },
      select: { id: true, supplier_id: true, purchase_order_id: true },
    });
    if (invoices.length !== invoiceIds.length) return { error: 'Alguna factura no existe' };
    const invalidSupplier = invoices.some((i) => i.supplier_id !== order.supplier_id);
    if (invalidSupplier) return { error: 'Todas las facturas deben ser del mismo proveedor que la OC' };
    const alreadyImputed = invoices.some((i) => i.purchase_order_id && i.purchase_order_id !== orderId);
    if (alreadyImputed) return { error: 'Alguna factura ya está imputada a otra OC' };

    await prisma.purchase_invoices.updateMany({
      where: { id: { in: invoiceIds }, company_id: companyId },
      data: { purchase_order_id: orderId },
    });

    await recalcInvoicingStatus(orderId);

    revalidatePath('/dashboard/purchasing');
    revalidatePath(`/dashboard/purchasing/purchase-orders/${orderId}`);
    const summary = await getOrderImputationSummary(orderId);
    return { error: null, summary };
  } catch (error: any) {
    console.error('Error imputando facturas a OC:', error);
    return { error: error?.message || String(error) };
  }
}

export async function removeInvoiceFromOrder(orderId: string, invoiceId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  try {
    await requirePermission('compras.update');
    await getOrderOrThrow(orderId, companyId);

    await prisma.purchase_invoices.updateMany({
      where: { id: invoiceId, company_id: companyId, purchase_order_id: orderId },
      data: { purchase_order_id: null },
    });

    await recalcInvoicingStatus(orderId);

    revalidatePath('/dashboard/purchasing');
    revalidatePath(`/dashboard/purchasing/purchase-orders/${orderId}`);
    return { error: null };
  } catch (error: any) {
    console.error('Error desimputando factura de OC:', error);
    return { error: error?.message || String(error) };
  }
}

export async function imputeExpensesToOrder(orderId: string, expenseIds: string[]) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };
  if (!expenseIds?.length) return { error: 'Sin gastos para imputar' };

  try {
    await requirePermission('compras.update');
    const order = await getOrderOrThrow(orderId, companyId);

    const expenses = await prisma.expenses.findMany({
      where: { id: { in: expenseIds }, company_id: companyId },
      select: { id: true, supplier_id: true, purchase_order_id: true },
    });
    if (expenses.length !== expenseIds.length) return { error: 'Algún gasto no existe' };
    // Gasto con proveedor debe coincidir; sin proveedor se permite.
    const invalidSupplier = expenses.some((e) => e.supplier_id && e.supplier_id !== order.supplier_id);
    if (invalidSupplier) return { error: 'Los gastos con proveedor deben coincidir con el de la OC' };
    const alreadyImputed = expenses.some((e) => e.purchase_order_id && e.purchase_order_id !== orderId);
    if (alreadyImputed) return { error: 'Algún gasto ya está imputado a otra OC' };

    await prisma.expenses.updateMany({
      where: { id: { in: expenseIds }, company_id: companyId },
      data: { purchase_order_id: orderId },
    });

    revalidatePath('/dashboard/purchasing');
    revalidatePath(`/dashboard/purchasing/purchase-orders/${orderId}`);
    const summary = await getOrderImputationSummary(orderId);
    return { error: null, summary };
  } catch (error: any) {
    console.error('Error imputando gastos a OC:', error);
    return { error: error?.message || String(error) };
  }
}

export async function removeExpenseFromOrder(orderId: string, expenseId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  try {
    await requirePermission('compras.update');
    await getOrderOrThrow(orderId, companyId);

    await prisma.expenses.updateMany({
      where: { id: expenseId, company_id: companyId, purchase_order_id: orderId },
      data: { purchase_order_id: null },
    });

    revalidatePath('/dashboard/purchasing');
    revalidatePath(`/dashboard/purchasing/purchase-orders/${orderId}`);
    return { error: null };
  } catch (error: any) {
    console.error('Error desimputando gasto de OC:', error);
    return { error: error?.message || String(error) };
  }
}

/** Gastos imputados a una OC (para la sección del detalle). */
export async function getExpensesByOrderId(orderId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const expenses = await prisma.expenses.findMany({
    where: { purchase_order_id: orderId, company_id: companyId },
    select: { id: true, full_number: true, description: true, amount: true, date: true, status: true },
    orderBy: { date: 'desc' },
  });
  return expenses.map((e) => ({ ...e, amount: Number(e.amount) }));
}

// ============================================================
// ADJUNTOS de la OC (1-N)
// ============================================================

/** Paso 1: valida archivo y devuelve el path de subida. */
export async function preparePurchaseOrderAttachmentUpload(input: {
  orderId: string;
  fileName: string;
  mime: string;
  size: number;
}) {
  const { companyId } = await getActionContext();
  if (!companyId) return { ok: false as const, error: 'No company selected' };

  const { orderId, fileName, mime, size } = input;
  if (!orderId) return { ok: false as const, error: 'orderId requerido' };
  if (!ALLOWED_MIME_SET.has(mime)) {
    return { ok: false as const, error: 'Tipo de archivo no permitido. Solo se aceptan JPG, PNG o PDF.' };
  }
  if (size > PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES) {
    return { ok: false as const, error: 'El archivo supera los 10 MB permitidos.' };
  }

  const order = await prisma.purchase_orders.findFirst({
    where: { id: orderId, company_id: companyId },
    select: { id: true },
  });
  if (!order) return { ok: false as const, error: 'Orden de compra no encontrada' };

  const ext = getExtensionFromMime(mime) || (fileName.split('.').pop() || 'bin').toLowerCase();
  const path = `${companyId}/${orderId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  return { ok: true as const, path, bucket: BUCKET };
}

/** Paso 2: confirma la subida creando el registro del adjunto. */
export async function confirmPurchaseOrderAttachmentUpload(input: {
  orderId: string;
  path: string;
  fileName: string;
  size?: number;
  mime?: string;
}) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  const { orderId, path, fileName, size, mime } = input;
  if (!orderId || !path) return { error: 'Datos incompletos' };

  try {
    const order = await prisma.purchase_orders.findFirst({
      where: { id: orderId, company_id: companyId },
      select: { id: true },
    });
    if (!order) return { error: 'Orden de compra no encontrada' };

    await prisma.purchase_order_attachments.create({
      data: {
        purchase_order_id: orderId,
        file_name: fileName,
        file_key: path,
        file_size: size ?? null,
        mime_type: mime ?? null,
      },
    });

    revalidatePath(`/dashboard/purchasing/purchase-orders/${orderId}`);
    return { error: null };
  } catch (error: any) {
    console.error('Error confirmando adjunto de OC:', error);
    return { error: error?.message || String(error) };
  }
}

export async function listPurchaseOrderAttachments(orderId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const order = await prisma.purchase_orders.findFirst({
    where: { id: orderId, company_id: companyId },
    select: { id: true },
  });
  if (!order) return [];

  return prisma.purchase_order_attachments.findMany({
    where: { purchase_order_id: orderId },
    select: { id: true, file_name: true, file_size: true, mime_type: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
}

export async function deletePurchaseOrderAttachment(attachmentId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company selected' };

  try {
    await requirePermission('compras.update');
    const attachment = await prisma.purchase_order_attachments.findFirst({
      where: { id: attachmentId, purchase_order: { company_id: companyId } },
      select: { id: true, file_key: true, purchase_order_id: true },
    });
    if (!attachment) return { error: 'Adjunto no encontrado' };

    try {
      await storageServer.remove(BUCKET, [attachment.file_key]);
    } catch (e) {
      console.warn('Error removing attachment from storage:', e);
    }

    await prisma.purchase_order_attachments.delete({ where: { id: attachmentId } });

    revalidatePath(`/dashboard/purchasing/purchase-orders/${attachment.purchase_order_id}`);
    return { error: null };
  } catch (error: any) {
    console.error('Error eliminando adjunto de OC:', error);
    return { error: error?.message || String(error) };
  }
}

export async function getPurchaseOrderAttachmentSignedUrl(attachmentId: string, expiresInSec = 300) {
  const { companyId } = await getActionContext();
  if (!companyId) return { url: null, error: 'No company selected' };

  const attachment = await prisma.purchase_order_attachments.findFirst({
    where: { id: attachmentId, purchase_order: { company_id: companyId } },
    select: { file_key: true },
  });
  if (!attachment?.file_key) return { url: null, error: 'Adjunto no encontrado' };

  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(attachment.file_key, expiresInSec);
    if (error) return { url: null, error: error.message };
    return { url: data.signedUrl, error: null };
  } catch (error: any) {
    return { url: null, error: error?.message || String(error) };
  }
}
