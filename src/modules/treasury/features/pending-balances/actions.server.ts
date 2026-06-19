'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

export interface PendingBalancesFilters {
  supplier_id?: string | null;
  op_status?: 'NONE' | 'SCHEDULED' | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
}

export interface PendingInvoiceRow {
  invoice_id: string;
  full_number: string;
  issue_date: Date | string;
  due_date: Date | string | null;
  supplier_id: string;
  supplier_business_name: string;
  supplier_code: string;
  invoice_status: 'CONFIRMED' | 'PARTIAL_PAID';
  total: number;
  paid_amount: number;
  pending_amount: number;
  op_status: 'NONE' | 'SCHEDULED';
  latest_op_id: string | null;
  latest_op_full_number: string | null;
  latest_op_scheduled_date: Date | string | null;
}

export interface PendingBalancesResult {
  rows: PendingInvoiceRow[];
  total: number;
  summary: {
    totalPending: number;
    countSinOP: number;
    countScheduled: number;
  };
}

export async function listPendingInvoices(
  filters: PendingBalancesFilters = {}
): Promise<PendingBalancesResult> {
  const { companyId } = await getActionContext();
  if (!companyId) {
    return { rows: [], total: 0, summary: { totalPending: 0, countSinOP: 0, countScheduled: 0 } };
  }

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 25));

  // Las notas de crédito no son deuda a pagar: se excluyen del listado y
  // descuentan el saldo de su factura original.
  const NC_TYPES = ['NOTA_CREDITO_A', 'NOTA_CREDITO_B', 'NOTA_CREDITO_C'];

  const where: Record<string, unknown> = {
    company_id: companyId,
    status: { in: ['CONFIRMED', 'PARTIAL_PAID'] },
    voucher_type: { notIn: NC_TYPES as any },
  };
  if (filters.supplier_id) where.supplier_id = filters.supplier_id;
  if (filters.search && filters.search.trim()) {
    where.full_number = { contains: filters.search.trim(), mode: 'insensitive' };
  }

  const invoices = await prisma.purchase_invoices.findMany({
    where: where as any,
    select: {
      id: true,
      full_number: true,
      issue_date: true,
      due_date: true,
      total: true,
      status: true,
      supplier_id: true,
      supplier: { select: { id: true, code: true, business_name: true } },
      payment_order_items: {
        select: {
          amount: true,
          payment_order: {
            select: { id: true, full_number: true, status: true, scheduled_payment_date: true, created_at: true },
          },
        },
      },
    },
    orderBy: { issue_date: 'asc' },
  });

  // Crédito de notas de crédito (confirmadas) por factura original.
  const creditByInvoice = new Map<string, number>();
  if (invoices.length > 0) {
    const ncGroups = await prisma.purchase_invoices.groupBy({
      by: ['original_invoice_id'],
      where: {
        company_id: companyId,
        voucher_type: { in: NC_TYPES as any },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
        original_invoice_id: { in: invoices.map((i) => i.id) },
      },
      _sum: { total: true },
    });
    for (const g of ncGroups) {
      if (g.original_invoice_id) creditByInvoice.set(g.original_invoice_id, Number(g._sum.total ?? 0));
    }
  }

  const computed: PendingInvoiceRow[] = [];
  for (const inv of invoices) {
    const total = Number(inv.total);
    const credit = creditByInvoice.get(inv.id) ?? 0;
    let paid = 0;
    let latestActiveOp: {
      id: string;
      full_number: string;
      scheduled_payment_date: Date | null;
      created_at: Date | null;
    } | null = null;

    for (const item of inv.payment_order_items) {
      const op = item.payment_order;
      if (!op) continue;
      if (op.status === 'PAID') {
        paid += Number(item.amount);
      } else if (op.status === 'DRAFT' || op.status === 'CONFIRMED') {
        if (
          !latestActiveOp ||
          (op.created_at && latestActiveOp.created_at && op.created_at > latestActiveOp.created_at)
        ) {
          latestActiveOp = {
            id: op.id,
            full_number: op.full_number,
            scheduled_payment_date: op.scheduled_payment_date,
            created_at: op.created_at,
          };
        }
      }
    }

    // El saldo a pagar descuenta pagos y notas de crédito aplicadas.
    const pending = Math.round((total - paid - credit) * 100) / 100;
    if (pending <= 0) continue;

    const op_status: 'NONE' | 'SCHEDULED' = latestActiveOp ? 'SCHEDULED' : 'NONE';
    if (filters.op_status && filters.op_status !== op_status) continue;

    computed.push({
      invoice_id: inv.id,
      full_number: inv.full_number,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      supplier_id: inv.supplier_id,
      supplier_business_name: inv.supplier?.business_name ?? '',
      supplier_code: inv.supplier?.code ?? '',
      invoice_status: inv.status as 'CONFIRMED' | 'PARTIAL_PAID',
      total,
      paid_amount: Math.round(paid * 100) / 100,
      pending_amount: pending,
      op_status,
      latest_op_id: latestActiveOp?.id ?? null,
      latest_op_full_number: latestActiveOp?.full_number ?? null,
      latest_op_scheduled_date: latestActiveOp?.scheduled_payment_date ?? null,
    });
  }

  const summary = computed.reduce(
    (acc, r) => {
      acc.totalPending += r.pending_amount;
      if (r.op_status === 'SCHEDULED') acc.countScheduled += 1;
      else acc.countSinOP += 1;
      return acc;
    },
    { totalPending: 0, countSinOP: 0, countScheduled: 0 }
  );
  summary.totalPending = Math.round(summary.totalPending * 100) / 100;

  const total = computed.length;
  const start = (page - 1) * pageSize;
  const rows = computed.slice(start, start + pageSize);

  return { rows, total, summary };
}

export async function getSuppliersWithPendingInvoices() {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const suppliers = await prisma.suppliers.findMany({
    where: {
      company_id: companyId,
      purchase_invoices: {
        some: {
          company_id: companyId,
          status: { in: ['CONFIRMED', 'PARTIAL_PAID'] },
        },
      },
    },
    select: { id: true, code: true, business_name: true },
    orderBy: { business_name: 'asc' },
  });

  return suppliers;
}
