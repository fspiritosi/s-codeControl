'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import { requirePermission } from '@/shared/lib/permissions';
import { revalidatePath } from 'next/cache';
import {
  computePurchaseOutstanding,
  isCreditNoteVoucherType,
} from '@/shared/lib/purchase-invoice-balance';
import {
  getAppliedCreditByInvoice,
  getCreditNoteAmountsByInvoice,
  recalcPurchaseInvoiceStatus,
} from '@/shared/lib/purchase-invoice-status';
import {
  getCreditNoteAvailability,
  getSupplierCreditNotesWithAvailability,
  type CreditNoteWithAvailability,
} from '@/shared/lib/credit-notes';

/**
 * Imputación del crédito de las notas de crédito de compra (TKT-586).
 *
 * Antes una NC descontaba sola el saldo de `original_invoice_id`. Ahora el
 * usuario decide: la aplica a una o varias facturas, o la usa dentro de una OP
 * (eso vive en tesorería). Lo que no imputa queda disponible.
 *
 * Vive en `shared/actions` y no en un módulo porque lo usan proveedores (la
 * cuenta corriente) y compras (el ofrecimiento al confirmar la NC), y los
 * módulos no pueden importarse entre sí.
 * Ver .planes/tkt-586-notas-credito-imputacion.md
 */

export interface CreditNoteApplicationRow {
  id: string;
  credit_note_id: string;
  credit_note_full_number: string;
  /** Comprobante destino: factura u orden de pago. */
  target_type: 'INVOICE' | 'PAYMENT_ORDER';
  target_id: string;
  target_full_number: string;
  /** Moneda de la NC: `amount` está en ella, no en pesos. */
  currency: string;
  /** TC de la NC, para mostrar el equivalente en pesos. */
  exchange_rate: number;
  amount: number;
  applied_at: Date | string;
  reversed_at: Date | string | null;
  notes: string | null;
}

export interface ApplicableInvoiceForCreditNote {
  id: string;
  full_number: string;
  issue_date: Date | string;
  currency: string;
  total: number;
  outstanding: number;
}

export type SupplierCreditNote = CreditNoteWithAvailability;

/** Notas de crédito activas del proveedor con su crédito disponible. */
export async function getSupplierCreditNotes(supplierId: string): Promise<SupplierCreditNote[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];
  return getSupplierCreditNotesWithAvailability({ companyId, supplierId });
}

/** Imputaciones de NC del proveedor, activas y revertidas, para el historial. */
export async function getCreditNoteApplications(
  supplierId: string
): Promise<CreditNoteApplicationRow[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const applications = await prisma.credit_note_applications.findMany({
    where: { company_id: companyId, supplier_id: supplierId },
    select: {
      id: true,
      credit_note_id: true,
      invoice_id: true,
      payment_order_id: true,
      amount: true,
      applied_at: true,
      reversed_at: true,
      notes: true,
      credit_note: { select: { full_number: true, currency: true, exchange_rate: true } },
      invoice: { select: { full_number: true } },
      payment_order: { select: { full_number: true } },
    },
    orderBy: { applied_at: 'desc' },
  });

  return applications.map((a) => ({
    id: a.id,
    credit_note_id: a.credit_note_id,
    credit_note_full_number: a.credit_note?.full_number ?? '',
    target_type: a.invoice_id ? ('INVOICE' as const) : ('PAYMENT_ORDER' as const),
    target_id: a.invoice_id ?? a.payment_order_id ?? '',
    target_full_number: a.invoice?.full_number ?? a.payment_order?.full_number ?? '',
    currency: a.credit_note?.currency ?? 'ARS',
    exchange_rate: Number(a.credit_note?.exchange_rate ?? 1),
    amount: Number(a.amount),
    applied_at: a.applied_at,
    reversed_at: a.reversed_at,
    notes: a.notes,
  }));
}

/**
 * Facturas del proveedor que todavía deben algo y pueden recibir crédito.
 * Excluye NC (no se pagan), borradores y anuladas.
 */
export async function getInvoicesForCreditNoteApplication(
  supplierId: string
): Promise<ApplicableInvoiceForCreditNote[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const invoices = await prisma.purchase_invoices.findMany({
    where: {
      company_id: companyId,
      supplier_id: supplierId,
      status: { in: ['CONFIRMED', 'PARTIAL_PAID'] },
    },
    select: {
      id: true,
      full_number: true,
      voucher_type: true,
      issue_date: true,
      currency: true,
      total: true,
      payment_order_items: {
        where: { payment_order: { status: 'PAID' } },
        select: { amount: true },
      },
    },
    orderBy: { issue_date: 'asc' },
  });

  const eligible = invoices.filter((inv) => !isCreditNoteVoucherType(inv.voucher_type));
  const ids = eligible.map((i) => i.id);
  const [creditNotes, appliedCredit] = await Promise.all([
    getCreditNoteAmountsByInvoice(ids),
    getAppliedCreditByInvoice(ids),
  ]);

  return eligible
    .map((inv) => {
      const total = Number(inv.total);
      const paid = inv.payment_order_items.reduce((acc, i) => acc + Number(i.amount), 0);
      return {
        id: inv.id,
        full_number: inv.full_number,
        issue_date: inv.issue_date,
        currency: inv.currency ?? 'ARS',
        total,
        outstanding: computePurchaseOutstanding({
          total,
          paid,
          creditNotes: creditNotes.get(inv.id) ?? 0,
          creditApplied: appliedCredit.get(inv.id) ?? 0,
        }),
      };
    })
    .filter((inv) => inv.outstanding > 0);
}

/** Saldo pendiente de una factura, con el mismo criterio que el recálculo de estado. */
async function getInvoiceOutstanding(invoiceId: string, client: any = prisma): Promise<number> {
  const invoice = await client.purchase_invoices.findUnique({
    where: { id: invoiceId },
    select: { total: true },
  });
  if (!invoice) return 0;

  const [paidAgg, creditNotes, appliedCredit] = await Promise.all([
    client.payment_order_items.aggregate({
      where: { invoice_id: invoiceId, payment_order: { status: 'PAID' } },
      _sum: { amount: true },
    }),
    getCreditNoteAmountsByInvoice([invoiceId], client),
    getAppliedCreditByInvoice([invoiceId], client),
  ]);

  return computePurchaseOutstanding({
    total: Number(invoice.total),
    paid: Number(paidAgg._sum.amount ?? 0),
    creditNotes: creditNotes.get(invoiceId) ?? 0,
    creditApplied: appliedCredit.get(invoiceId) ?? 0,
  });
}

/**
 * Sugerencia para el diálogo que aparece al confirmar una NC: la factura que
 * declaró corregir y cuánto se le podría imputar. Devuelve `null` cuando no hay
 * nada que ofrecer (sin factura de referencia, o esa factura ya no debe nada),
 * que es justamente el caso del circuito de refacturación de TKT-586.
 */
export async function getCreditNoteApplicationSuggestion(creditNoteId: string): Promise<{
  creditNoteId: string;
  creditNoteFullNumber: string;
  invoiceId: string;
  invoiceFullNumber: string;
  suggestedAmount: number;
  available: number;
  outstanding: number;
} | null> {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  const note = await prisma.purchase_invoices.findFirst({
    where: { id: creditNoteId, company_id: companyId },
    select: {
      id: true,
      full_number: true,
      supplier_id: true,
      original_invoice_id: true,
      voucher_type: true,
      original_invoice: { select: { id: true, full_number: true, total: true, status: true } },
    },
  });
  if (!note || !isCreditNoteVoucherType(note.voucher_type)) return null;
  if (!note.original_invoice || !note.original_invoice_id) return null;
  if (!['CONFIRMED', 'PARTIAL_PAID'].includes(note.original_invoice.status)) return null;

  const availability = await getCreditNoteAvailability({ creditNoteId, companyId });
  if (!availability || availability.available <= 0) return null;

  const outstanding = await getInvoiceOutstanding(note.original_invoice_id);
  const suggested = Math.min(availability.available, outstanding);
  if (suggested <= 0) return null;

  return {
    creditNoteId: note.id,
    creditNoteFullNumber: note.full_number,
    invoiceId: note.original_invoice_id,
    invoiceFullNumber: note.original_invoice.full_number,
    suggestedAmount: Math.round(suggested * 100) / 100,
    available: availability.available,
    outstanding,
  };
}

/**
 * Imputa el crédito de una NC a una o varias facturas.
 *
 * Todo ocurre en una transacción y las validaciones se releen adentro: dos
 * imputaciones concurrentes no pueden gastar el mismo crédito dos veces.
 */
export async function applyCreditNoteToInvoices(input: {
  creditNoteId: string;
  allocations: { invoiceId: string; amount: number }[];
  notes?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { companyId } = await getActionContext();
  if (!companyId) return { ok: false, error: 'No hay empresa seleccionada' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { ok: false, error: 'No autenticado' };

  const allocations = (input.allocations ?? [])
    .map((a) => ({ invoiceId: a.invoiceId, amount: Math.round(Number(a.amount) * 100) / 100 }))
    .filter((a) => a.invoiceId);

  if (allocations.length === 0) return { ok: false, error: 'Elegí al menos una factura' };
  if (allocations.some((a) => !Number.isFinite(a.amount) || a.amount <= 0)) {
    return { ok: false, error: 'Los importes deben ser mayores a 0' };
  }
  if (new Set(allocations.map((a) => a.invoiceId)).size !== allocations.length) {
    return { ok: false, error: 'Hay una factura repetida en la imputación' };
  }

  try {
    await requirePermission('tesoreria.update');

    const result = await prisma.$transaction(async (tx) => {
      const availability = await getCreditNoteAvailability({
        creditNoteId: input.creditNoteId,
        companyId,
        client: tx,
      });
      if (!availability) {
        return { ok: false as const, error: 'La nota de crédito no existe o no está confirmada' };
      }

      const requested = allocations.reduce((acc, a) => acc + a.amount, 0);
      if (requested > availability.available + 0.001) {
        return {
          ok: false as const,
          error: `El crédito disponible de la nota es de $${availability.available.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        };
      }

      for (const allocation of allocations) {
        const invoice = await tx.purchase_invoices.findFirst({
          where: { id: allocation.invoiceId, company_id: companyId },
          select: {
            id: true,
            full_number: true,
            status: true,
            voucher_type: true,
            supplier_id: true,
          },
        });
        if (!invoice) return { ok: false as const, error: 'Factura no encontrada' };
        if (invoice.supplier_id !== availability.supplierId) {
          return {
            ok: false as const,
            error: `La factura ${invoice.full_number} es de otro proveedor`,
          };
        }
        if (isCreditNoteVoucherType(invoice.voucher_type)) {
          return { ok: false as const, error: 'No se puede imputar crédito a una nota de crédito' };
        }
        if (!['CONFIRMED', 'PARTIAL_PAID'].includes(invoice.status)) {
          return {
            ok: false as const,
            error:
              invoice.status === 'PAID'
                ? `La factura ${invoice.full_number} ya está pagada`
                : `La factura ${invoice.full_number} no está confirmada`,
          };
        }

        const outstanding = await getInvoiceOutstanding(invoice.id, tx);
        if (allocation.amount > outstanding + 0.001) {
          return {
            ok: false as const,
            error: `La factura ${invoice.full_number} solo debe $${outstanding.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
          };
        }

        await tx.credit_note_applications.create({
          data: {
            company_id: companyId,
            supplier_id: availability.supplierId,
            credit_note_id: input.creditNoteId,
            invoice_id: invoice.id,
            amount: allocation.amount,
            applied_by: user.id!,
            notes: input.notes?.trim() || null,
          },
        });

        await recalcPurchaseInvoiceStatus(invoice.id, tx);
      }

      return { ok: true as const, supplierId: availability.supplierId };
    });

    if (!result.ok) return result;

    revalidatePath(`/dashboard/suppliers/${result.supplierId}`);
    for (const allocation of allocations) {
      revalidatePath(`/dashboard/purchasing/invoices/${allocation.invoiceId}`);
    }
    revalidatePath('/dashboard/purchasing/invoices');
    revalidatePath('/dashboard/treasury');
    return { ok: true };
  } catch (error) {
    console.error('Error imputando nota de crédito:', error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Revierte una imputación: el crédito vuelve a estar disponible y la factura
 * recupera su saldo. Revertir algo ya revertido es un no-op, no un error que
 * duplique el crédito.
 *
 * Las imputaciones hechas dentro de una OP no se revierten de a una: se liberan
 * al anular la orden, porque ahí el crédito forma parte de su cuadre.
 */
export async function reverseCreditNoteApplication(
  applicationId: string
): Promise<{ ok: boolean; error?: string }> {
  const { companyId } = await getActionContext();
  if (!companyId) return { ok: false, error: 'No hay empresa seleccionada' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { ok: false, error: 'No autenticado' };

  try {
    await requirePermission('tesoreria.update');

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.credit_note_applications.findFirst({
        where: { id: applicationId, company_id: companyId },
        select: {
          id: true,
          invoice_id: true,
          payment_order_id: true,
          supplier_id: true,
          reversed_at: true,
          payment_order: { select: { full_number: true } },
        },
      });
      if (!application) return { ok: false as const, error: 'Imputación no encontrada' };
      if (application.payment_order_id) {
        return {
          ok: false as const,
          error: `Este crédito se usó en la orden de pago ${application.payment_order?.full_number ?? ''}. Para liberarlo hay que anular esa orden.`,
        };
      }
      if (application.reversed_at) {
        return { ok: true as const, application };
      }

      await tx.credit_note_applications.update({
        where: { id: applicationId },
        data: { reversed_at: new Date(), reversed_by: user.id! },
      });

      if (application.invoice_id) {
        await recalcPurchaseInvoiceStatus(application.invoice_id, tx);
      }
      return { ok: true as const, application };
    });

    if (!result.ok) return result;

    revalidatePath(`/dashboard/suppliers/${result.application.supplier_id}`);
    if (result.application.invoice_id) {
      revalidatePath(`/dashboard/purchasing/invoices/${result.application.invoice_id}`);
    }
    revalidatePath('/dashboard/treasury');
    return { ok: true };
  } catch (error) {
    console.error('Error revirtiendo imputación de nota de crédito:', error);
    return { ok: false, error: String(error) };
  }
}
