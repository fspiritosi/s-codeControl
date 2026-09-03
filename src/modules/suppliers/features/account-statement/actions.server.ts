'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import {
  buildSupplierAccountRows,
  computePurchaseOutstanding,
} from '@/shared/lib/purchase-invoice-balance';
import { getAppliedCreditByInvoice } from '@/shared/lib/purchase-invoice-status';
import { BASE_CURRENCY, convertAmount } from '@/shared/lib/currency-conversion';

async function ensureSupplierInCompany(supplierId: string, companyId: string) {
  const supplier = await prisma.suppliers.findFirst({
    where: { id: supplierId, company_id: companyId },
    select: { id: true },
  });
  return !!supplier;
}

export interface InvoicesSummary {
  /** Todos los importes en pesos: lo emitido en dólares va convertido al TC del
   *  comprobante. */
  totalDebt: number;
  totalAmount: number;
  /** Facturas (no NC) con saldo > 0. No se deriva del estado: lo hace del saldo. */
  pendingCount: number;
  /** Crédito de NC todavía sin aplicar a ninguna factura (saldo a favor). */
  unappliedCredit: number;
  countByStatus: Record<string, number>;
  total: number;
  /** Hay comprobantes en moneda extranjera: la UI aclara que los totales están
   *  convertidos. */
  hasForeignCurrency: boolean;
}

export interface PurchaseOrdersSummary {
  totalAmount: number;
  countByStatus: Record<string, number>;
  total: number;
}

export interface ReceivingNotesSummary {
  countByStatus: Record<string, number>;
  total: number;
}

export interface PaymentOrdersSummary {
  totalPaid: number;
  totalScheduled: number;
  /** Parte de `totalPaid` imputada a facturas del proveedor. */
  paidToInvoices: number;
  /** Parte de `totalPaid` imputada a gastos del proveedor. */
  paidToExpenses: number;
  /** Parte de `totalPaid` cargada como pago a cuenta (genera saldo a favor). */
  paidOnAccount: number;
  /** Pagado que no es ni imputación ni pago a cuenta: descuadre a revisar. */
  paidUnallocated: number;
  countByStatus: Record<string, number>;
  total: number;
  /** Hay órdenes en moneda extranjera: los totales van convertidos a pesos. */
  hasForeignCurrency: boolean;
}

export interface ExpensesSummary {
  totalDebt: number;
  totalAmount: number;
  pendingCount: number;
  countByStatus: Record<string, number>;
  total: number;
}

/**
 * Comprobantes de compra del proveedor con su saldo real.
 *
 * Cada nota de crédito muestra el crédito que todavía tiene a favor y cada
 * factura lo que realmente adeuda. Desde TKT-586 las imputaciones son
 * explícitas (`credit_note_applications`): una NC puede repartirse entre varias
 * facturas o usarse dentro de una OP, y lo no imputado queda disponible.
 */
export async function getSupplierInvoices(supplierId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { rows: [], summary: null as InvoicesSummary | null };
  if (!(await ensureSupplierInCompany(supplierId, companyId))) {
    return { rows: [], summary: null as InvoicesSummary | null };
  }

  const [data, paidAggByInvoice, creditApps] = await Promise.all([
    prisma.purchase_invoices.findMany({
      where: { company_id: companyId, supplier_id: supplierId },
      select: {
        id: true,
        full_number: true,
        voucher_type: true,
        issue_date: true,
        due_date: true,
        total: true,
        status: true,
        original_invoice_id: true,
        // La cuenta corriente mezcla comprobantes en pesos y en dólares: sin la
        // moneda y su TC los totales suman peras con manzanas.
        currency: true,
        exchange_rate: true,
      },
      orderBy: { issue_date: 'desc' },
    }),
    prisma.payment_order_items.groupBy({
      by: ['invoice_id'],
      where: {
        payment_order: {
          company_id: companyId,
          supplier_id: supplierId,
          status: 'PAID',
        },
        invoice_id: { not: null },
      },
      _sum: { amount: true },
    }),
    // Imputaciones de NC del proveedor, con el comprobante destino para poder
    // mostrar en la fila de la NC contra qué se aplicó.
    prisma.credit_note_applications.findMany({
      where: { company_id: companyId, supplier_id: supplierId, reversed_at: null },
      select: {
        credit_note_id: true,
        invoice_id: true,
        amount: true,
        invoice: { select: { full_number: true } },
        payment_order: { select: { full_number: true } },
      },
    }),
  ]);

  const paidByInvoice = new Map<string, number>();
  for (const row of paidAggByInvoice) {
    if (row.invoice_id) {
      paidByInvoice.set(row.invoice_id, Number(row._sum.amount ?? 0));
    }
  }

  const appliedByNote = new Map<string, number>();
  const creditNotesByInvoice = new Map<string, number>();
  const targetsByNote = new Map<string, string[]>();
  for (const app of creditApps) {
    const amount = Number(app.amount);
    appliedByNote.set(app.credit_note_id, (appliedByNote.get(app.credit_note_id) ?? 0) + amount);
    if (app.invoice_id) {
      creditNotesByInvoice.set(
        app.invoice_id,
        (creditNotesByInvoice.get(app.invoice_id) ?? 0) + amount
      );
    }
    const target = app.invoice?.full_number ?? app.payment_order?.full_number;
    if (target) {
      const list = targetsByNote.get(app.credit_note_id) ?? [];
      if (!list.includes(target)) list.push(target);
      targetsByNote.set(app.credit_note_id, list);
    }
  }

  // El saldo a favor por pagos a cuenta también baja lo que la factura adeuda.
  const onAccountByInvoice = await getAppliedCreditByInvoice(data.map((inv) => inv.id));

  const { rows, totals } = buildSupplierAccountRows(
    data.map((inv) => ({
      id: inv.id,
      full_number: inv.full_number,
      voucher_type: inv.voucher_type as string,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      total: Number(inv.total),
      status: inv.status as string,
      original_invoice_id: inv.original_invoice_id,
      currency: inv.currency ?? 'ARS',
      exchange_rate: Number(inv.exchange_rate ?? 1),
    })),
    paidByInvoice,
    { appliedByNote, creditNotesByInvoice, onAccountByInvoice, targetsByNote }
  );

  return { rows, summary: totals as InvoicesSummary };
}

export async function getSupplierPurchaseOrders(supplierId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { rows: [], summary: null as PurchaseOrdersSummary | null };
  if (!(await ensureSupplierInCompany(supplierId, companyId))) {
    return { rows: [], summary: null as PurchaseOrdersSummary | null };
  }

  const data = await prisma.purchase_orders.findMany({
    where: { company_id: companyId, supplier_id: supplierId },
    select: {
      id: true,
      full_number: true,
      issue_date: true,
      expected_delivery_date: true,
      total: true,
      status: true,
      invoicing_status: true,
    },
    orderBy: { issue_date: 'desc' },
  });

  const rows = data.map((po) => ({
    id: po.id,
    full_number: po.full_number,
    issue_date: po.issue_date,
    expected_delivery_date: po.expected_delivery_date,
    total: Number(po.total),
    status: po.status as string,
    invoicing_status: po.invoicing_status as string,
  }));

  const countByStatus: Record<string, number> = {};
  let totalAmount = 0;
  for (const r of rows) {
    countByStatus[r.status] = (countByStatus[r.status] ?? 0) + 1;
    if (r.status !== 'CANCELLED') totalAmount += r.total;
  }

  const summary: PurchaseOrdersSummary = {
    totalAmount: Math.round(totalAmount * 100) / 100,
    countByStatus,
    total: rows.length,
  };

  return { rows, summary };
}

export async function getSupplierReceivingNotes(supplierId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { rows: [], summary: null as ReceivingNotesSummary | null };
  if (!(await ensureSupplierInCompany(supplierId, companyId))) {
    return { rows: [], summary: null as ReceivingNotesSummary | null };
  }

  const data = await prisma.receiving_notes.findMany({
    where: { company_id: companyId, supplier_id: supplierId },
    select: {
      id: true,
      full_number: true,
      reception_date: true,
      status: true,
      warehouse: { select: { name: true } },
      purchase_order: { select: { full_number: true } },
      purchase_invoice: { select: { full_number: true } },
      _count: { select: { lines: true } },
    },
    orderBy: { reception_date: 'desc' },
  });

  const rows = data.map((rn) => ({
    id: rn.id,
    full_number: rn.full_number,
    reception_date: rn.reception_date,
    status: rn.status as string,
    warehouse_name: rn.warehouse?.name ?? null,
    related_order: rn.purchase_order?.full_number ?? null,
    related_invoice: rn.purchase_invoice?.full_number ?? null,
    line_count: rn._count.lines,
  }));

  const countByStatus: Record<string, number> = {};
  for (const r of rows) {
    countByStatus[r.status] = (countByStatus[r.status] ?? 0) + 1;
  }

  const summary: ReceivingNotesSummary = {
    countByStatus,
    total: rows.length,
  };

  return { rows, summary };
}

/**
 * Órdenes de pago del proveedor.
 *
 * El total pagado se desglosa por destino de la imputación: una OP puede pagar
 * facturas, gastos, o quedar sin imputar. Sin ese desglose el "Total pagado" no
 * cerraba contra los saldos de las facturas y parecía un error de cálculo.
 */
export async function getSupplierPaymentOrders(supplierId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { rows: [], summary: null as PaymentOrdersSummary | null };
  if (!(await ensureSupplierInCompany(supplierId, companyId))) {
    return { rows: [], summary: null as PaymentOrdersSummary | null };
  }

  const data = await prisma.payment_orders.findMany({
    where: { company_id: companyId, supplier_id: supplierId },
    select: {
      id: true,
      full_number: true,
      date: true,
      scheduled_payment_date: true,
      total_amount: true,
      status: true,
      // Una OP puede estar en dólares (tsk-576): sin esto los totales de la
      // sección sumarían dólares y pesos como si fueran lo mismo.
      currency: true,
      exchange_rate: true,
      items: {
        select: { amount: true, invoice_id: true, expense_id: true, is_on_account: true },
      },
    },
    orderBy: { date: 'desc' },
  });

  const rows = data.map((po) => {
    let toInvoices = 0;
    let toExpenses = 0;
    let onAccount = 0;
    for (const item of po.items) {
      const amount = Number(item.amount);
      if (item.is_on_account) onAccount += amount;
      else if (item.invoice_id) toInvoices += amount;
      else if (item.expense_id) toExpenses += amount;
    }
    const total = Number(po.total_amount);
    const currency = po.currency ?? BASE_CURRENCY;
    const exchange_rate = Number(po.exchange_rate ?? 1);
    return {
      id: po.id,
      full_number: po.full_number,
      date: po.date,
      scheduled_payment_date: po.scheduled_payment_date,
      total_amount: total,
      currency,
      exchange_rate,
      /** `total_amount` convertido a pesos con el TC de la orden. */
      total_in_base: convertAmount({
        amount: total,
        from: currency,
        to: BASE_CURRENCY,
        rate: exchange_rate,
      }),
      applied_to_invoices: Math.round(toInvoices * 100) / 100,
      applied_to_expenses: Math.round(toExpenses * 100) / 100,
      on_account: Math.round(onAccount * 100) / 100,
      unallocated: Math.round((total - toInvoices - toExpenses - onAccount) * 100) / 100,
      status: po.status as string,
    };
  });

  const countByStatus: Record<string, number> = {};
  let totalPaid = 0;
  let totalScheduled = 0;
  let paidToInvoices = 0;
  let paidToExpenses = 0;
  let paidOnAccount = 0;
  let paidUnallocated = 0;
  let hasForeignCurrency = false;
  for (const r of rows) {
    countByStatus[r.status] = (countByStatus[r.status] ?? 0) + 1;
    if (r.currency !== BASE_CURRENCY) hasForeignCurrency = true;
    // Los desgloses salen de los ítems, que están en la moneda de la orden:
    // se convierten con el mismo TC que el total.
    const toBase = (amount: number) =>
      convertAmount({ amount, from: r.currency, to: BASE_CURRENCY, rate: r.exchange_rate });
    if (r.status === 'PAID') {
      totalPaid += r.total_in_base;
      paidToInvoices += toBase(r.applied_to_invoices);
      paidToExpenses += toBase(r.applied_to_expenses);
      paidOnAccount += toBase(r.on_account);
      paidUnallocated += toBase(r.unallocated);
    } else if (r.status === 'CONFIRMED' || r.status === 'DRAFT') {
      totalScheduled += r.total_in_base;
    }
  }

  const r2 = (n: number) => Math.round(n * 100) / 100;
  const summary: PaymentOrdersSummary = {
    totalPaid: r2(totalPaid),
    totalScheduled: r2(totalScheduled),
    paidToInvoices: r2(paidToInvoices),
    paidToExpenses: r2(paidToExpenses),
    paidOnAccount: r2(paidOnAccount),
    paidUnallocated: r2(paidUnallocated),
    countByStatus,
    total: rows.length,
    hasForeignCurrency,
  };

  return { rows, summary };
}

/**
 * Gastos imputados al proveedor. Se pagan por OP igual que las facturas, así que
 * sin esta sección el "Total pagado" de las OPs quedaba sin contrapartida.
 */
export async function getSupplierExpenses(supplierId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { rows: [], summary: null as ExpensesSummary | null };
  if (!(await ensureSupplierInCompany(supplierId, companyId))) {
    return { rows: [], summary: null as ExpensesSummary | null };
  }

  const data = await prisma.expenses.findMany({
    where: { company_id: companyId, supplier_id: supplierId },
    select: {
      id: true,
      full_number: true,
      description: true,
      date: true,
      due_date: true,
      amount: true,
      status: true,
      category: { select: { name: true } },
      payment_order_items: {
        where: { payment_order: { status: 'PAID' } },
        select: { amount: true },
      },
    },
    orderBy: { date: 'desc' },
  });

  const rows = data.map((exp) => {
    const total = Number(exp.amount);
    const paid = exp.payment_order_items.reduce((acc, i) => acc + Number(i.amount), 0);
    return {
      id: exp.id,
      full_number: exp.full_number,
      description: exp.description,
      category_name: exp.category?.name ?? '',
      date: exp.date,
      due_date: exp.due_date,
      total,
      paid: Math.round(paid * 100) / 100,
      remaining: computePurchaseOutstanding({ total, paid, creditNotes: 0 }),
      status: exp.status as string,
    };
  });

  const countByStatus: Record<string, number> = {};
  let totalAmount = 0;
  let totalDebt = 0;
  let pendingCount = 0;
  for (const r of rows) {
    countByStatus[r.status] = (countByStatus[r.status] ?? 0) + 1;
    if (r.status === 'CANCELLED' || r.status === 'DRAFT') continue;
    totalAmount += r.total;
    totalDebt += r.remaining;
    if (r.remaining > 0) pendingCount += 1;
  }

  const summary: ExpensesSummary = {
    totalDebt: Math.round(totalDebt * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    pendingCount,
    countByStatus,
    total: rows.length,
  };

  return { rows, summary };
}
