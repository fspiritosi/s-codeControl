'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

async function ensureSupplierInCompany(supplierId: string, companyId: string) {
  const supplier = await prisma.suppliers.findFirst({
    where: { id: supplierId, company_id: companyId },
    select: { id: true },
  });
  return !!supplier;
}

export interface InvoicesSummary {
  totalDebt: number;
  totalAmount: number;
  countByStatus: Record<string, number>;
  total: number;
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
  countByStatus: Record<string, number>;
  total: number;
}

export async function getSupplierInvoices(supplierId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { rows: [], summary: null as InvoicesSummary | null };
  if (!(await ensureSupplierInCompany(supplierId, companyId))) {
    return { rows: [], summary: null as InvoicesSummary | null };
  }

  const [data, paidAggByInvoice] = await Promise.all([
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
  ]);

  const paidByInvoice = new Map<string, number>();
  for (const row of paidAggByInvoice) {
    if (row.invoice_id) {
      paidByInvoice.set(row.invoice_id, Number(row._sum.amount ?? 0));
    }
  }

  const rows = data.map((inv) => {
    const total = Number(inv.total);
    const paid = paidByInvoice.get(inv.id) ?? 0;
    const remaining = Math.max(0, Math.round((total - paid) * 100) / 100);
    return {
      id: inv.id,
      full_number: inv.full_number,
      voucher_type: inv.voucher_type,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      total,
      paid: Math.round(paid * 100) / 100,
      remaining,
      status: inv.status as string,
    };
  });

  const countByStatus: Record<string, number> = {};
  let totalAmount = 0;
  let totalDebt = 0;
  for (const r of rows) {
    countByStatus[r.status] = (countByStatus[r.status] ?? 0) + 1;
    totalAmount += r.total;
    if (r.status !== 'CANCELLED') totalDebt += r.remaining;
  }

  const summary: InvoicesSummary = {
    totalDebt: Math.round(totalDebt * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    countByStatus,
    total: rows.length,
  };

  return { rows, summary };
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
    },
    orderBy: { date: 'desc' },
  });

  const rows = data.map((po) => ({
    id: po.id,
    full_number: po.full_number,
    date: po.date,
    scheduled_payment_date: po.scheduled_payment_date,
    total_amount: Number(po.total_amount),
    status: po.status as string,
  }));

  const countByStatus: Record<string, number> = {};
  let totalPaid = 0;
  let totalScheduled = 0;
  for (const r of rows) {
    countByStatus[r.status] = (countByStatus[r.status] ?? 0) + 1;
    if (r.status === 'PAID') totalPaid += r.total_amount;
    else if (r.status === 'CONFIRMED' || r.status === 'DRAFT') totalScheduled += r.total_amount;
  }

  const summary: PaymentOrdersSummary = {
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalScheduled: Math.round(totalScheduled * 100) / 100,
    countByStatus,
    total: rows.length,
  };

  return { rows, summary };
}
