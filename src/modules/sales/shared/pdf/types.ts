/**
 * Tipos para la generación de PDFs del módulo de Ventas.
 * Formato ya normalizado (camelCase, montos como number) listo para los templates.
 */

export interface SalesCompanyPDFData {
  name: string;
  logo: string | null;
  cuit: string;
  address: string;
  phone?: string;
  email?: string;
}

export interface SalesCustomerPDFData {
  name: string;
  taxId: string;
  taxCondition?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// ============================================================
// FACTURA DE VENTA
// ============================================================

export interface SalesInvoiceLinePDF {
  description: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  subtotal: number;
  total: number;
  discountAmount: number;
}

export interface SalesInvoicePerceptionPDF {
  name: string;
  baseAmount: number;
  rate: number;
  amount: number;
}

export interface SalesInvoiceOtherChargePDF {
  description: string;
  amount: number;
}

export interface SalesInvoicePDFData {
  company: SalesCompanyPDFData;
  customer: SalesCustomerPDFData;

  invoice: {
    voucherType: string; // enum crudo (FACTURA_A, ...)
    voucherLabel: string; // etiqueta legible
    letter: string; // A | B | X
    isTypeA: boolean; // discrimina IVA
    fullNumber: string;
    pointOfSaleNumber?: number;
    pointOfSaleName?: string;
    issueDate: Date;
    dueDate?: Date;
    cae?: string;
    caeExpiryDate?: Date;
    currency: string;
    originalInvoiceNumber?: string; // para NC/ND
  };

  lines: SalesInvoiceLinePDF[];
  perceptions: SalesInvoicePerceptionPDF[];
  otherCharges: SalesInvoiceOtherChargePDF[];

  totals: {
    subtotal: number;
    vatAmount: number;
    otherTaxes: number;
    otherCharges: number;
    discountAmount: number;
    total: number;
  };

  notes?: string;
}

// ============================================================
// RECIBO DE COBRO
// ============================================================

export interface ReceiptAppliedInvoicePDF {
  fullNumber: string;
  voucherLabel?: string;
  invoiceTotal?: number;
  amount: number;
}

export interface ReceiptPaymentPDF {
  method: string;
  detail?: string;
  amount: number;
}

export interface ReceiptWithholdingPDF {
  type: string;
  rate?: number;
  amount: number;
  certificateNumber?: string;
}

export interface ReceiptPDFData {
  company: SalesCompanyPDFData;
  customer: SalesCustomerPDFData;

  receipt: {
    fullNumber: string;
    date: Date;
  };

  invoices: ReceiptAppliedInvoicePDF[];
  payments: ReceiptPaymentPDF[];
  withholdings: ReceiptWithholdingPDF[];

  totalAmount: number;
  notes?: string;
}
