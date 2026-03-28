export const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente de aprobación',
  APPROVED: 'Aprobada',
  PARTIALLY_RECEIVED: 'Recibida parcialmente',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export const PO_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'secondary',
  PENDING_APPROVAL: 'yellow',
  APPROVED: 'default',
  PARTIALLY_RECEIVED: 'outline',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
};

export const PO_INVOICING_STATUS_LABELS: Record<string, string> = {
  NOT_INVOICED: 'Sin facturar',
  PARTIALLY_INVOICED: 'Parcialmente facturada',
  FULLY_INVOICED: 'Totalmente facturada',
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmada',
  PAID: 'Pagada',
  PARTIAL_PAID: 'Pago parcial',
  CANCELLED: 'Anulada',
};

export const VOUCHER_TYPE_LABELS: Record<string, string> = {
  FACTURA_A: 'Factura A',
  FACTURA_B: 'Factura B',
  FACTURA_C: 'Factura C',
  NOTA_CREDITO_A: 'NC A',
  NOTA_CREDITO_B: 'NC B',
  NOTA_CREDITO_C: 'NC C',
  NOTA_DEBITO_A: 'ND A',
  NOTA_DEBITO_B: 'ND B',
  NOTA_DEBITO_C: 'ND C',
  RECIBO: 'Recibo',
};

export const RECEIVING_NOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Anulado',
};
