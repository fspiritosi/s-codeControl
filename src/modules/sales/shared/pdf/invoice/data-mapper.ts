/**
 * Mapea el detalle de una factura de venta (Prisma, snake_case) al formato del PDF.
 * Fuente: getSalesInvoiceById(id) — montos ya vienen como number, salvo BigInt del cliente.
 */

import type { SalesCompanyPDFData, SalesInvoicePDFData } from '../types';
import {
  VOUCHER_TYPE_LABELS,
  CUSTOMER_TAX_CONDITION_LABELS,
} from '@/modules/sales/shared/types';

// Estructura mínima que devuelve getSalesInvoiceById (se tipa laxo por los relacionados de Prisma).
type SalesInvoiceRaw = {
  voucher_type: string;
  full_number: string | null;
  issue_date: Date;
  due_date: Date | null;
  cae: string | null;
  cae_expiry_date: Date | null;
  currency: string;
  notes: string | null;
  subtotal: number;
  vat_amount: number;
  other_taxes: number;
  other_charges: number;
  discount_amount: number;
  total: number;
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
  point_of_sale_rel: { number: number; name: string } | null;
  original_invoice: { full_number: string | null } | null;
  lines: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
    vat_amount: number;
    subtotal: number;
    total: number;
    discount_amount: number;
    product: { name: string; code: string } | null;
  }>;
  perceptions: Array<{
    base_amount: number;
    rate: number;
    amount: number;
    tax_type: { name: string; code: string } | null;
  }>;
  other_charges_items: Array<{ description: string; amount: number }>;
};

function getLetter(voucherType: string): string {
  if (voucherType.endsWith('_A')) return 'A';
  if (voucherType.endsWith('_B')) return 'B';
  return 'X';
}

export function mapSalesInvoiceDataForPDF(
  inv: SalesInvoiceRaw,
  company: SalesCompanyPDFData
): SalesInvoicePDFData {
  const letter = getLetter(inv.voucher_type);
  const customerTaxId =
    inv.customer.tax_id ??
    (inv.customer.cuit !== null && inv.customer.cuit !== undefined
      ? String(inv.customer.cuit)
      : '');

  return {
    company,

    customer: {
      name: inv.customer.name,
      taxId: customerTaxId,
      taxCondition: inv.customer.tax_condition
        ? CUSTOMER_TAX_CONDITION_LABELS[inv.customer.tax_condition] ??
          inv.customer.tax_condition
        : undefined,
      address: inv.customer.fiscal_address ?? inv.customer.address ?? undefined,
      phone:
        inv.customer.client_phone !== null &&
        inv.customer.client_phone !== undefined
          ? String(inv.customer.client_phone)
          : undefined,
      email: inv.customer.client_email ?? undefined,
    },

    invoice: {
      voucherType: inv.voucher_type,
      voucherLabel: VOUCHER_TYPE_LABELS[inv.voucher_type] ?? inv.voucher_type,
      letter,
      isTypeA: letter === 'A',
      fullNumber: inv.full_number ?? '-',
      pointOfSaleNumber: inv.point_of_sale_rel?.number,
      pointOfSaleName: inv.point_of_sale_rel?.name,
      issueDate: inv.issue_date,
      dueDate: inv.due_date ?? undefined,
      cae: inv.cae ?? undefined,
      caeExpiryDate: inv.cae_expiry_date ?? undefined,
      currency: inv.currency,
      originalInvoiceNumber: inv.original_invoice?.full_number ?? undefined,
    },

    lines: inv.lines.map((l) => ({
      description: l.description,
      productCode: l.product?.code ?? undefined,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unit_price),
      vatRate: Number(l.vat_rate),
      vatAmount: Number(l.vat_amount),
      subtotal: Number(l.subtotal),
      total: Number(l.total),
      discountAmount: Number(l.discount_amount),
    })),

    perceptions: inv.perceptions.map((p) => ({
      name: p.tax_type?.name ?? 'Percepción',
      baseAmount: Number(p.base_amount),
      rate: Number(p.rate),
      amount: Number(p.amount),
    })),

    otherCharges: inv.other_charges_items.map((oc) => ({
      description: oc.description,
      amount: Number(oc.amount),
    })),

    totals: {
      subtotal: Number(inv.subtotal),
      vatAmount: Number(inv.vat_amount),
      otherTaxes: Number(inv.other_taxes),
      otherCharges: Number(inv.other_charges),
      discountAmount: Number(inv.discount_amount),
      total: Number(inv.total),
    },

    notes: inv.notes ?? undefined,
  };
}
