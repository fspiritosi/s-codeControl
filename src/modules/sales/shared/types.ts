// Tipos y etiquetas compartidas del módulo de Ventas (tsk-479)

/** Tipos de comprobante habilitados para VENTAS (solo A y B). */
export const SALES_VOUCHER_TYPES = [
  'FACTURA_A',
  'FACTURA_B',
  'NOTA_CREDITO_A',
  'NOTA_CREDITO_B',
  'NOTA_DEBITO_A',
  'NOTA_DEBITO_B',
] as const;

export type SalesVoucherType = (typeof SALES_VOUCHER_TYPES)[number];

export const VOUCHER_TYPE_LABELS: Record<string, string> = {
  FACTURA_A: 'Factura A',
  FACTURA_B: 'Factura B',
  NOTA_CREDITO_A: 'Nota de Crédito A',
  NOTA_CREDITO_B: 'Nota de Crédito B',
  NOTA_DEBITO_A: 'Nota de Débito A',
  NOTA_DEBITO_B: 'Nota de Débito B',
};

export const SALES_INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmada',
  PARTIAL_PAID: 'Cobro parcial',
  PAID: 'Cobrada',
  CANCELLED: 'Anulada',
};

export const SALES_INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'secondary',
  CONFIRMED: 'default',
  PARTIAL_PAID: 'outline',
  PAID: 'success',
  CANCELLED: 'destructive',
};

export const RECEIPT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Anulado',
};

export const RECEIPT_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'secondary',
  CONFIRMED: 'success',
  CANCELLED: 'destructive',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CHECK: 'Cheque',
  ECHEQ: 'E-Cheq',
  TRANSFER: 'Transferencia',
  DEBIT_CARD: 'Tarjeta de débito',
  CREDIT_CARD: 'Tarjeta de crédito',
  OTHER: 'Otro',
};

export const WITHHOLDING_TAX_TYPE_LABELS: Record<string, string> = {
  IVA: 'IVA',
  GANANCIAS: 'Ganancias',
  IIBB: 'Ingresos Brutos',
  SUSS: 'SUSS',
  OTHER: 'Otra',
};

export const CUSTOMER_TAX_CONDITION_LABELS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTO: 'Monotributo',
  EXENTO: 'Exento',
  CONSUMIDOR_FINAL: 'Consumidor Final',
  NO_RESPONSABLE: 'No Responsable',
};

export const CREDIT_NOTE_VOUCHER_TYPES = ['NOTA_CREDITO_A', 'NOTA_CREDITO_B'] as const;
export const DEBIT_NOTE_VOUCHER_TYPES = ['NOTA_DEBITO_A', 'NOTA_DEBITO_B'] as const;

export function isCreditNoteVoucherType(voucherType: string): boolean {
  return (CREDIT_NOTE_VOUCHER_TYPES as readonly string[]).includes(voucherType);
}
export function isDebitNoteVoucherType(voucherType: string): boolean {
  return (DEBIT_NOTE_VOUCHER_TYPES as readonly string[]).includes(voucherType);
}
/** NC o ND: siempre asociadas a una factura original. */
export function isNoteVoucherType(voucherType: string): boolean {
  return isCreditNoteVoucherType(voucherType) || isDebitNoteVoucherType(voucherType);
}
export function isInvoiceVoucherType(voucherType: string): boolean {
  return voucherType === 'FACTURA_A' || voucherType === 'FACTURA_B';
}
