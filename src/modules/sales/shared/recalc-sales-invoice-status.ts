import { prisma } from '@/shared/lib/prisma';
import { isCreditNoteVoucherType, isDebitNoteVoucherType } from './types';

/**
 * Recalcula el estado de cobro de una factura de venta (tsk-479).
 *
 * El estado es derivado y se persiste:
 *   cobertura = Σ recibos aplicados (CONFIRMED) + Σ NC asociadas (CONFIRMED)
 *   cargado   = total de la factura + Σ ND asociadas (CONFIRMED)
 *   PAID          si cargado > 0 y cobertura >= cargado (con tolerancia EPS)
 *   PARTIAL_PAID  si cobertura > 0
 *   CONFIRMED     en otro caso
 *
 * Solo actúa sobre facturas en estado CONFIRMED/PARTIAL_PAID/PAID (no DRAFT/CANCELLED).
 * No toca tesorería.
 */
const EPS = 0.01;

export type SalesInvoicePaidStatus = 'CONFIRMED' | 'PARTIAL_PAID' | 'PAID';

export async function recalcSalesInvoiceStatus(invoiceId: string): Promise<string | null> {
  const invoice = await prisma.sales_invoices.findUnique({
    where: { id: invoiceId },
    select: { id: true, total: true, status: true },
  });
  if (!invoice) return null;
  if (!['CONFIRMED', 'PARTIAL_PAID', 'PAID'].includes(invoice.status)) return invoice.status;

  const [receiptAgg, notes] = await Promise.all([
    prisma.receipt_items.aggregate({
      where: { invoice_id: invoiceId, receipt: { status: 'CONFIRMED' } },
      _sum: { amount: true },
    }),
    prisma.sales_invoices.findMany({
      where: {
        original_invoice_id: invoiceId,
        status: { in: ['CONFIRMED', 'PARTIAL_PAID', 'PAID'] },
      },
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

  const charged = total + debitNotes;
  const covered = receiptsApplied + creditNotes;

  const newStatus: SalesInvoicePaidStatus =
    charged > 0 && covered >= charged - EPS ? 'PAID' : covered > 0 ? 'PARTIAL_PAID' : 'CONFIRMED';

  await prisma.sales_invoices.update({ where: { id: invoiceId }, data: { status: newStatus } });
  return newStatus;
}

export async function recalcSalesInvoiceStatusMany(invoiceIds: Iterable<string>): Promise<void> {
  const unique = Array.from(new Set(invoiceIds));
  await Promise.all(unique.map((id) => recalcSalesInvoiceStatus(id)));
}

/**
 * Saldo pendiente de una factura (para listados de facturas a cobrar).
 * pendiente = total + ND asociadas - recibos aplicados - NC asociadas.
 */
export function computeOutstanding(input: {
  total: number;
  receiptsApplied: number;
  creditNotes: number;
  debitNotes: number;
}): number {
  const pending = input.total + input.debitNotes - input.receiptsApplied - input.creditNotes;
  return pending < EPS ? 0 : pending;
}
