'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { isCreditNoteVoucherType, isDebitNoteVoucherType, isInvoiceVoucherType } from '@/modules/sales/shared/types';

export interface AccountMovement {
  id: string;
  date: string;
  type: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'RECEIPT';
  voucher_type: string | null;
  full_number: string | null;
  debit: number; // aumenta el saldo deudor del cliente
  credit: number; // disminuye el saldo deudor del cliente
  balance: number; // saldo acumulado
}

/**
 * Estado de cuenta de un cliente: comprobantes emitidos (confirmados) y recibos,
 * ordenados cronológicamente con saldo acumulado.
 * Facturas y ND suman al debe; NC y recibos suman al haber.
 */
export async function getCustomerAccountStatement(customerId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  const customer = await prisma.customers.findFirst({
    where: { id: customerId, company_id: companyId },
    select: { id: true, name: true, tax_id: true, cuit: true, tax_condition: true },
  });
  if (!customer) return null;

  const [invoices, receipts] = await Promise.all([
    prisma.sales_invoices.findMany({
      where: {
        company_id: companyId,
        customer_id: customerId,
        status: { in: ['CONFIRMED', 'PARTIAL_PAID', 'PAID'] },
      },
      select: { id: true, issue_date: true, voucher_type: true, full_number: true, total: true },
    }),
    prisma.receipts.findMany({
      where: { company_id: companyId, customer_id: customerId, status: 'CONFIRMED' },
      select: { id: true, date: true, full_number: true, total_amount: true },
    }),
  ]);

  const raw: Array<{ sortDate: number } & AccountMovement> = [];

  for (const inv of invoices) {
    const total = Number(inv.total);
    let type: AccountMovement['type'] = 'INVOICE';
    let debit = 0;
    let credit = 0;
    if (isInvoiceVoucherType(inv.voucher_type)) {
      type = 'INVOICE';
      debit = total;
    } else if (isDebitNoteVoucherType(inv.voucher_type)) {
      type = 'DEBIT_NOTE';
      debit = total;
    } else if (isCreditNoteVoucherType(inv.voucher_type)) {
      type = 'CREDIT_NOTE';
      credit = total;
    }
    raw.push({
      sortDate: new Date(inv.issue_date).getTime(),
      id: inv.id,
      date: inv.issue_date.toISOString(),
      type,
      voucher_type: inv.voucher_type,
      full_number: inv.full_number,
      debit,
      credit,
      balance: 0,
    });
  }

  for (const r of receipts) {
    raw.push({
      sortDate: new Date(r.date).getTime(),
      id: r.id,
      date: r.date.toISOString(),
      type: 'RECEIPT',
      voucher_type: null,
      full_number: r.full_number,
      debit: 0,
      credit: Number(r.total_amount),
      balance: 0,
    });
  }

  raw.sort((a, b) => a.sortDate - b.sortDate);

  let balance = 0;
  const movements: AccountMovement[] = raw.map((m) => {
    balance = Math.round((balance + m.debit - m.credit) * 100) / 100;
    const { sortDate, ...rest } = m;
    return { ...rest, balance };
  });

  const totalDebit = movements.reduce((s, m) => s + m.debit, 0);
  const totalCredit = movements.reduce((s, m) => s + m.credit, 0);

  return {
    customer,
    movements,
    summary: {
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      balance,
    },
  };
}

/** Clientes con su saldo actual (para el índice de cuentas corrientes). */
export async function getCustomersWithBalance() {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const customers = await prisma.customers.findMany({
    where: { company_id: companyId, is_active: true },
    select: { id: true, name: true, tax_id: true },
    orderBy: { name: 'asc' },
  });

  const results = await Promise.all(
    customers.map(async (c) => {
      const [invAgg, ncAgg, ndAgg, recAgg] = await Promise.all([
        prisma.sales_invoices.aggregate({
          where: {
            company_id: companyId,
            customer_id: c.id,
            voucher_type: { in: ['FACTURA_A', 'FACTURA_B'] },
            status: { in: ['CONFIRMED', 'PARTIAL_PAID', 'PAID'] },
          },
          _sum: { total: true },
        }),
        prisma.sales_invoices.aggregate({
          where: {
            company_id: companyId,
            customer_id: c.id,
            voucher_type: { in: ['NOTA_CREDITO_A', 'NOTA_CREDITO_B'] },
            status: { in: ['CONFIRMED', 'PARTIAL_PAID', 'PAID'] },
          },
          _sum: { total: true },
        }),
        prisma.sales_invoices.aggregate({
          where: {
            company_id: companyId,
            customer_id: c.id,
            voucher_type: { in: ['NOTA_DEBITO_A', 'NOTA_DEBITO_B'] },
            status: { in: ['CONFIRMED', 'PARTIAL_PAID', 'PAID'] },
          },
          _sum: { total: true },
        }),
        prisma.receipts.aggregate({
          where: { company_id: companyId, customer_id: c.id, status: 'CONFIRMED' },
          _sum: { total_amount: true },
        }),
      ]);
      const balance =
        Number(invAgg._sum.total ?? 0) +
        Number(ndAgg._sum.total ?? 0) -
        Number(ncAgg._sum.total ?? 0) -
        Number(recAgg._sum.total_amount ?? 0);
      return { ...c, balance: Math.round(balance * 100) / 100 };
    })
  );

  return results;
}
