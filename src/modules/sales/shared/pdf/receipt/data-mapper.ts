/**
 * Mapea el detalle de un recibo de cobro (Prisma, snake_case) al formato del PDF.
 * Fuente: getReceiptById(id) — montos ya vienen como number, salvo BigInt del cliente.
 */

import type { SalesCompanyPDFData, ReceiptPDFData } from '../types';
import {
  VOUCHER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  WITHHOLDING_TAX_TYPE_LABELS,
  CUSTOMER_TAX_CONDITION_LABELS,
} from '@/modules/sales/shared/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type ReceiptRaw = {
  full_number: string;
  date: Date;
  total_amount: number;
  notes: string | null;
  customer: {
    name: string;
    tax_id: string | null;
    cuit: bigint | number | null;
    tax_condition: string | null;
    fiscal_address: string | null;
    address: string | null;
    client_phone: bigint | number | null;
    client_email: string | null;
  };
  items: Array<{
    amount: number;
    invoice: { full_number: string | null; voucher_type: string; total: number } | null;
  }>;
  payments: Array<{
    payment_method: string;
    amount: number;
    reference: string | null;
    check_number: string | null;
    check_bank: string | null;
    check_due_date: Date | null;
    notes: string | null;
  }>;
  withholdings: Array<{
    tax_type: string;
    rate: number | null;
    amount: number;
    certificate_number: string | null;
  }>;
};

function buildPaymentDetail(p: ReceiptRaw['payments'][number]): string | undefined {
  const parts: string[] = [];
  if (p.check_number) parts.push(`Cheque N° ${p.check_number}`);
  if (p.check_bank) parts.push(p.check_bank);
  if (p.check_due_date) {
    parts.push(`Vto. ${format(new Date(p.check_due_date), 'dd/MM/yyyy', { locale: es })}`);
  }
  if (p.reference) parts.push(p.reference);
  if (p.notes) parts.push(p.notes);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function mapReceiptDataForPDF(
  receipt: ReceiptRaw,
  company: SalesCompanyPDFData
): ReceiptPDFData {
  const customerTaxId =
    receipt.customer.tax_id ??
    (receipt.customer.cuit !== null && receipt.customer.cuit !== undefined
      ? String(receipt.customer.cuit)
      : '');

  return {
    company,

    customer: {
      name: receipt.customer.name,
      taxId: customerTaxId,
      taxCondition: receipt.customer.tax_condition
        ? CUSTOMER_TAX_CONDITION_LABELS[receipt.customer.tax_condition] ??
          receipt.customer.tax_condition
        : undefined,
      address: receipt.customer.fiscal_address ?? receipt.customer.address ?? undefined,
      phone:
        receipt.customer.client_phone !== null &&
        receipt.customer.client_phone !== undefined
          ? String(receipt.customer.client_phone)
          : undefined,
      email: receipt.customer.client_email ?? undefined,
    },

    receipt: {
      fullNumber: receipt.full_number,
      date: receipt.date,
    },

    invoices: receipt.items.map((it) => ({
      fullNumber: it.invoice?.full_number ?? '-',
      voucherLabel: it.invoice
        ? VOUCHER_TYPE_LABELS[it.invoice.voucher_type] ?? it.invoice.voucher_type
        : undefined,
      invoiceTotal: it.invoice ? Number(it.invoice.total) : undefined,
      amount: Number(it.amount),
    })),

    payments: receipt.payments.map((p) => ({
      method: PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method,
      detail: buildPaymentDetail(p),
      amount: Number(p.amount),
    })),

    withholdings: receipt.withholdings.map((w) => ({
      type: WITHHOLDING_TAX_TYPE_LABELS[w.tax_type] ?? w.tax_type,
      rate: w.rate !== null && w.rate !== undefined ? Number(w.rate) : undefined,
      amount: Number(w.amount),
      certificateNumber: w.certificate_number ?? undefined,
    })),

    totalAmount: Number(receipt.total_amount),
    notes: receipt.notes ?? undefined,
  };
}
