import { prisma } from '@/shared/lib/prisma';
import {
  ACTIVE_CREDIT_NOTE_STATUSES,
  derivePurchaseInvoiceStatus,
  isCreditNoteVoucherType,
} from '@/shared/lib/purchase-invoice-balance';

/**
 * Persistencia del estado de pago de las facturas de compra.
 *
 * Espejo de `recalcSalesInvoiceStatus` (ventas). Hasta ahora el estado se
 * derivaba únicamente en `markPaymentOrderAsPaid` comparando `pagos >= total`,
 * por lo que una factura cubierta por una nota de crédito quedaba "Confirmada"
 * para siempre: nunca existía una OP que la marcara.
 *
 * La aritmética vive en `purchase-invoice-balance.ts`; acá solo se consulta la
 * base y se escribe el resultado.
 */

/** Cliente Prisma o el `tx` de una transacción. */
type PrismaClientLike = typeof prisma | any;

/** Estados en los que una factura todavía admite recálculo de pago. */
const RECALCULABLE_STATUSES = ['CONFIRMED', 'PARTIAL_PAID', 'PAID'];

/**
 * Crédito de NC imputado a cada factura.
 *
 * Desde TKT-586 sale de `credit_note_applications`: la NC ya no descuenta sola
 * el saldo de `original_invoice_id`, se imputa explícitamente (a una o varias
 * facturas) y lo que no se imputa queda disponible como crédito del proveedor.
 * La firma no cambió a propósito: sus consumidores —recálculo de estados,
 * saldos pendientes, OPs y bolsa de crédito— siguen sirviéndose igual.
 */
export async function getCreditNoteAmountsByInvoice(
  invoiceIds: string[],
  client: PrismaClientLike = prisma
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (invoiceIds.length === 0) return result;

  const groups = await client.credit_note_applications.groupBy({
    by: ['invoice_id'],
    where: {
      invoice_id: { in: invoiceIds },
      reversed_at: null,
      // Una NC que volvió a borrador o se anuló deja de aportar crédito, aunque
      // sus imputaciones sigan en la tabla.
      credit_note: { status: { in: ACTIVE_CREDIT_NOTE_STATUSES as unknown as string[] } },
    },
    _sum: { amount: true },
  });

  for (const g of groups as { invoice_id: string | null; _sum: { amount: unknown } }[]) {
    if (g.invoice_id) {
      result.set(g.invoice_id, Number(g._sum.amount ?? 0));
    }
  }
  return result;
}

/**
 * Crédito ya imputado por cada NC, sin importar el destino (factura u OP).
 * Es el otro lado de la misma tabla: lo que a la NC le queda disponible es su
 * total menos esto. Ver `computeCreditNoteAvailable`.
 */
export async function getAppliedAmountByCreditNote(
  creditNoteIds: string[],
  client: PrismaClientLike = prisma
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (creditNoteIds.length === 0) return result;

  const groups = await client.credit_note_applications.groupBy({
    by: ['credit_note_id'],
    where: { credit_note_id: { in: creditNoteIds }, reversed_at: null },
    _sum: { amount: true },
  });

  for (const g of groups as { credit_note_id: string; _sum: { amount: unknown } }[]) {
    result.set(g.credit_note_id, Number(g._sum.amount ?? 0));
  }
  return result;
}

/** Saldo a favor del proveedor ya imputado a cada factura (aplicaciones activas). */
export async function getAppliedCreditByInvoice(
  invoiceIds: string[],
  client: PrismaClientLike = prisma
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (invoiceIds.length === 0) return result;

  const groups = await client.supplier_credit_applications.groupBy({
    by: ['invoice_id'],
    where: { invoice_id: { in: invoiceIds }, reversed_at: null },
    _sum: { amount: true },
  });

  for (const g of groups as { invoice_id: string; _sum: { amount: unknown } }[]) {
    result.set(g.invoice_id, Number(g._sum.amount ?? 0));
  }
  return result;
}

/**
 * Recalcula y persiste el estado de una factura.
 * Solo actúa sobre facturas en CONFIRMED/PARTIAL_PAID/PAID (no DRAFT/CANCELLED)
 * y nunca sobre una NC: una NC no se "paga", se aplica.
 */
export async function recalcPurchaseInvoiceStatus(
  invoiceId: string,
  client: PrismaClientLike = prisma
): Promise<string | null> {
  const invoice = await client.purchase_invoices.findUnique({
    where: { id: invoiceId },
    select: { id: true, total: true, status: true, voucher_type: true },
  });
  if (!invoice) return null;
  if (!RECALCULABLE_STATUSES.includes(invoice.status)) return invoice.status;
  if (isCreditNoteVoucherType(invoice.voucher_type)) return invoice.status;

  const [paidAgg, creditByInvoice, appliedCreditByInvoice] = await Promise.all([
    client.payment_order_items.aggregate({
      where: { invoice_id: invoiceId, payment_order: { status: 'PAID' } },
      _sum: { amount: true },
    }),
    getCreditNoteAmountsByInvoice([invoiceId], client),
    getAppliedCreditByInvoice([invoiceId], client),
  ]);

  const newStatus = derivePurchaseInvoiceStatus({
    total: Number(invoice.total),
    paid: Number(paidAgg._sum.amount ?? 0),
    creditNotes: creditByInvoice.get(invoiceId) ?? 0,
    creditApplied: appliedCreditByInvoice.get(invoiceId) ?? 0,
  });

  if (newStatus !== invoice.status) {
    await client.purchase_invoices.update({ where: { id: invoiceId }, data: { status: newStatus } });
  }
  return newStatus;
}

/**
 * Versión en lote: resuelve N facturas con un número fijo de consultas en vez de
 * repetir `recalcPurchaseInvoiceStatus` una vez por factura.
 *
 * El bucle anterior costaba ~4 consultas por factura (findUnique + aggregate +
 * 2 groupBy) y las encadenaba de forma secuencial. Dentro de la transacción de
 * `markPaymentOrderAsPaid` eso agotaba el timeout de 5 s de Prisma: una OP con
 * 13 facturas superaba los 5300 ms y abortaba en el `groupBy` de
 * `supplier_credit_applications`. Ahora son 4 consultas en total —
 * `getCreditNoteAmountsByInvoice` y `getAppliedCreditByInvoice` ya recibían un
 * array— más un `updateMany` por estado destino (a lo sumo tres).
 */
export async function recalcPurchaseInvoiceStatusMany(
  invoiceIds: Iterable<string>,
  client: PrismaClientLike = prisma
): Promise<void> {
  const unique = Array.from(new Set(invoiceIds));
  if (unique.length === 0) return;

  const invoices = await client.purchase_invoices.findMany({
    where: { id: { in: unique } },
    select: { id: true, total: true, status: true, voucher_type: true },
  });

  // Mismo criterio que la versión unitaria: solo facturas en estado pagable y
  // nunca una NC, que no se paga sino que se aplica.
  const targets = (
    invoices as { id: string; total: unknown; status: string; voucher_type: string }[]
  ).filter(
    (inv) => RECALCULABLE_STATUSES.includes(inv.status) && !isCreditNoteVoucherType(inv.voucher_type)
  );
  if (targets.length === 0) return;

  const targetIds = targets.map((inv) => inv.id);

  const [paidGroups, creditByInvoice, appliedCreditByInvoice] = await Promise.all([
    client.payment_order_items.groupBy({
      by: ['invoice_id'],
      where: { invoice_id: { in: targetIds }, payment_order: { status: 'PAID' } },
      _sum: { amount: true },
    }),
    getCreditNoteAmountsByInvoice(targetIds, client),
    getAppliedCreditByInvoice(targetIds, client),
  ]);

  const paidByInvoice = new Map<string, number>();
  for (const g of paidGroups as { invoice_id: string | null; _sum: { amount: unknown } }[]) {
    if (g.invoice_id) paidByInvoice.set(g.invoice_id, Number(g._sum.amount ?? 0));
  }

  // Agrupar por estado destino: como mucho un updateMany por estado, en lugar
  // de un update por factura.
  const idsByNewStatus = new Map<string, string[]>();
  for (const inv of targets) {
    const newStatus = derivePurchaseInvoiceStatus({
      total: Number(inv.total),
      paid: paidByInvoice.get(inv.id) ?? 0,
      creditNotes: creditByInvoice.get(inv.id) ?? 0,
      creditApplied: appliedCreditByInvoice.get(inv.id) ?? 0,
    });
    if (newStatus === inv.status) continue;
    const pending = idsByNewStatus.get(newStatus);
    if (pending) pending.push(inv.id);
    else idsByNewStatus.set(newStatus, [inv.id]);
  }

  for (const [status, ids] of idsByNewStatus) {
    await client.purchase_invoices.updateMany({ where: { id: { in: ids } }, data: { status } });
  }
}
