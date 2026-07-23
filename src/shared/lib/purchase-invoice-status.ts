import { prisma } from '@/shared/lib/prisma';
import {
  ACTIVE_CREDIT_NOTE_STATUSES,
  CREDIT_NOTE_VOUCHER_TYPES,
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

/** Crédito de NC activas aplicable a cada factura original. */
export async function getCreditNoteAmountsByInvoice(
  invoiceIds: string[],
  client: PrismaClientLike = prisma
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (invoiceIds.length === 0) return result;

  const groups = await client.purchase_invoices.groupBy({
    by: ['original_invoice_id'],
    where: {
      voucher_type: { in: CREDIT_NOTE_VOUCHER_TYPES as unknown as string[] },
      status: { in: ACTIVE_CREDIT_NOTE_STATUSES as unknown as string[] },
      original_invoice_id: { in: invoiceIds },
    },
    _sum: { total: true },
  });

  for (const g of groups as { original_invoice_id: string | null; _sum: { total: unknown } }[]) {
    if (g.original_invoice_id) {
      result.set(g.original_invoice_id, Number(g._sum.total ?? 0));
    }
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
  if (!['CONFIRMED', 'PARTIAL_PAID', 'PAID'].includes(invoice.status)) return invoice.status;
  if (isCreditNoteVoucherType(invoice.voucher_type)) return invoice.status;

  const [paidAgg, creditByInvoice] = await Promise.all([
    client.payment_order_items.aggregate({
      where: { invoice_id: invoiceId, payment_order: { status: 'PAID' } },
      _sum: { amount: true },
    }),
    getCreditNoteAmountsByInvoice([invoiceId], client),
  ]);

  const newStatus = derivePurchaseInvoiceStatus({
    total: Number(invoice.total),
    paid: Number(paidAgg._sum.amount ?? 0),
    creditNotes: creditByInvoice.get(invoiceId) ?? 0,
  });

  if (newStatus !== invoice.status) {
    await client.purchase_invoices.update({ where: { id: invoiceId }, data: { status: newStatus } });
  }
  return newStatus;
}

export async function recalcPurchaseInvoiceStatusMany(
  invoiceIds: Iterable<string>,
  client: PrismaClientLike = prisma
): Promise<void> {
  const unique = Array.from(new Set(invoiceIds));
  for (const id of unique) {
    await recalcPurchaseInvoiceStatus(id, client);
  }
}
