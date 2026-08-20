'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import { requirePermission } from '@/shared/lib/permissions';
import { revalidatePath } from 'next/cache';
import {
  computePurchaseOutstanding,
  computeSupplierCreditBalance,
  isCreditNoteVoucherType,
} from '@/shared/lib/purchase-invoice-balance';
import {
  getAppliedCreditByInvoice,
  getCreditNoteAmountsByInvoice,
  recalcPurchaseInvoiceStatus,
} from '@/shared/lib/purchase-invoice-status';

/**
 * Saldo a favor de un proveedor ("bolsa" de crédito) y su imputación a facturas.
 *
 * El saldo no se persiste: se deriva de los ítems a cuenta de OPs pagadas menos
 * las aplicaciones activas. Ver .planes/pago-a-cuenta-proveedores.md
 */

export interface CreditApplicationRow {
  id: string;
  invoice_id: string;
  invoice_full_number: string;
  amount: number;
  applied_at: Date | string;
  reversed_at: Date | string | null;
  notes: string | null;
}

export interface ApplicableInvoiceRow {
  id: string;
  full_number: string;
  issue_date: Date | string;
  /** Moneda de la factura: `total` y `outstanding` están en ella. */
  currency: string;
  total: number;
  outstanding: number;
}

export interface SupplierCreditBalance {
  /** Total pagado a cuenta en OPs ya pagadas. */
  onAccountPaid: number;
  /** Total imputado a facturas (aplicaciones no revertidas). */
  creditApplied: number;
  /** Disponible para imputar. */
  available: number;
  applications: CreditApplicationRow[];
}

/** Suma de los ítems a cuenta del proveedor en OPs efectivamente pagadas. */
async function sumOnAccountPaid(
  supplierId: string,
  companyId: string,
  client: any = prisma
): Promise<number> {
  const agg = await client.payment_order_items.aggregate({
    where: {
      is_on_account: true,
      payment_order: { company_id: companyId, supplier_id: supplierId, status: 'PAID' },
    },
    _sum: { amount: true },
  });
  return Number(agg._sum.amount ?? 0);
}

/** Suma de las aplicaciones vigentes (no revertidas) del proveedor. */
async function sumCreditApplied(
  supplierId: string,
  companyId: string,
  client: any = prisma
): Promise<number> {
  const agg = await client.supplier_credit_applications.aggregate({
    where: { supplier_id: supplierId, company_id: companyId, reversed_at: null },
    _sum: { amount: true },
  });
  return Number(agg._sum.amount ?? 0);
}

export async function getSupplierCreditBalance(
  supplierId: string
): Promise<SupplierCreditBalance> {
  const empty: SupplierCreditBalance = {
    onAccountPaid: 0,
    creditApplied: 0,
    available: 0,
    applications: [],
  };
  const { companyId } = await getActionContext();
  if (!companyId) return empty;

  const [onAccountPaid, creditApplied, applications] = await Promise.all([
    sumOnAccountPaid(supplierId, companyId),
    sumCreditApplied(supplierId, companyId),
    prisma.supplier_credit_applications.findMany({
      where: { supplier_id: supplierId, company_id: companyId },
      select: {
        id: true,
        invoice_id: true,
        amount: true,
        applied_at: true,
        reversed_at: true,
        notes: true,
        invoice: { select: { full_number: true } },
      },
      orderBy: { applied_at: 'desc' },
    }),
  ]);

  return {
    onAccountPaid: Math.round(onAccountPaid * 100) / 100,
    creditApplied: Math.round(creditApplied * 100) / 100,
    available: computeSupplierCreditBalance({ onAccountPaid, creditApplied }),
    applications: applications.map((a) => ({
      id: a.id,
      invoice_id: a.invoice_id,
      invoice_full_number: a.invoice?.full_number ?? '',
      amount: Number(a.amount),
      applied_at: a.applied_at,
      reversed_at: a.reversed_at,
      notes: a.notes,
    })),
  };
}

/**
 * Facturas del proveedor que pueden recibir crédito: las que todavía deben algo.
 * Excluye NC (no se pagan), borradores y anuladas.
 */
export async function getInvoicesForCreditApplication(
  supplierId: string
): Promise<ApplicableInvoiceRow[]> {
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

/**
 * Imputa saldo a favor del proveedor a una factura.
 *
 * Las validaciones de disponibilidad se releen DENTRO de la transacción: dos
 * aplicaciones concurrentes no pueden gastar el mismo crédito dos veces.
 */
export async function applySupplierCredit(input: {
  supplierId: string;
  invoiceId: string;
  amount: number;
  notes?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { companyId } = await getActionContext();
  if (!companyId) return { ok: false, error: 'No hay empresa seleccionada' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { ok: false, error: 'No autenticado' };

  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'El monto debe ser mayor a 0' };
  }

  try {
    await requirePermission('tesoreria.update');

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.purchase_invoices.findFirst({
        where: { id: input.invoiceId, company_id: companyId },
        select: {
          id: true,
          full_number: true,
          total: true,
          status: true,
          voucher_type: true,
          supplier_id: true,
        },
      });
      if (!invoice) return { ok: false as const, error: 'Factura no encontrada' };
      if (invoice.supplier_id !== input.supplierId) {
        return { ok: false as const, error: 'La factura no pertenece a este proveedor' };
      }
      if (isCreditNoteVoucherType(invoice.voucher_type)) {
        return { ok: false as const, error: 'No se puede imputar crédito a una nota de crédito' };
      }
      if (!['CONFIRMED', 'PARTIAL_PAID'].includes(invoice.status)) {
        return {
          ok: false as const,
          error:
            invoice.status === 'PAID'
              ? 'La factura ya está pagada'
              : 'Solo se puede imputar crédito a facturas confirmadas',
        };
      }

      // Disponibilidad del crédito, releída dentro de la transacción.
      const [onAccountPaid, creditApplied] = await Promise.all([
        sumOnAccountPaid(input.supplierId, companyId, tx),
        sumCreditApplied(input.supplierId, companyId, tx),
      ]);
      const available = computeSupplierCreditBalance({ onAccountPaid, creditApplied });
      if (amount > available) {
        return {
          ok: false as const,
          error: `El crédito disponible es de $${available.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        };
      }

      // Saldo pendiente de la factura destino.
      const [paidAgg, creditNotes, appliedCredit] = await Promise.all([
        tx.payment_order_items.aggregate({
          where: { invoice_id: invoice.id, payment_order: { status: 'PAID' } },
          _sum: { amount: true },
        }),
        getCreditNoteAmountsByInvoice([invoice.id], tx),
        getAppliedCreditByInvoice([invoice.id], tx),
      ]);
      const outstanding = computePurchaseOutstanding({
        total: Number(invoice.total),
        paid: Number(paidAgg._sum.amount ?? 0),
        creditNotes: creditNotes.get(invoice.id) ?? 0,
        creditApplied: appliedCredit.get(invoice.id) ?? 0,
      });
      if (amount > outstanding) {
        return {
          ok: false as const,
          error: `La factura ${invoice.full_number} solo debe $${outstanding.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        };
      }

      await tx.supplier_credit_applications.create({
        data: {
          company_id: companyId,
          supplier_id: input.supplierId,
          invoice_id: invoice.id,
          amount,
          applied_by: user.id!,
          notes: input.notes?.trim() || null,
        },
      });

      await recalcPurchaseInvoiceStatus(invoice.id, tx);
      return { ok: true as const };
    });

    if (!result.ok) return result;

    revalidatePath(`/dashboard/suppliers/${input.supplierId}`);
    revalidatePath(`/dashboard/purchasing/invoices/${input.invoiceId}`);
    revalidatePath('/dashboard/treasury');
    return { ok: true };
  } catch (error) {
    console.error('Error aplicando crédito a proveedor:', error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Revierte una imputación: el monto vuelve a la bolsa y la factura recupera su
 * saldo. Revertir algo ya revertido es un no-op, no un error que duplique el
 * crédito.
 */
export async function reverseSupplierCreditApplication(
  applicationId: string
): Promise<{ ok: boolean; error?: string }> {
  const { companyId } = await getActionContext();
  if (!companyId) return { ok: false, error: 'No hay empresa seleccionada' };

  const user = await fetchCurrentUser();
  if (!user?.id) return { ok: false, error: 'No autenticado' };

  try {
    await requirePermission('tesoreria.update');

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.supplier_credit_applications.findFirst({
        where: { id: applicationId, company_id: companyId },
        select: { id: true, invoice_id: true, supplier_id: true, reversed_at: true },
      });
      if (!application) return { ok: false as const, error: 'Imputación no encontrada' };
      if (application.reversed_at) {
        return { ok: true as const, application, alreadyReversed: true };
      }

      await tx.supplier_credit_applications.update({
        where: { id: applicationId },
        data: { reversed_at: new Date(), reversed_by: user.id! },
      });

      await recalcPurchaseInvoiceStatus(application.invoice_id, tx);
      return { ok: true as const, application, alreadyReversed: false };
    });

    if (!result.ok) return result;

    revalidatePath(`/dashboard/suppliers/${result.application.supplier_id}`);
    revalidatePath(`/dashboard/purchasing/invoices/${result.application.invoice_id}`);
    revalidatePath('/dashboard/treasury');
    return { ok: true };
  } catch (error) {
    console.error('Error revirtiendo imputación de crédito:', error);
    return { ok: false, error: String(error) };
  }
}
