import { z } from 'zod';

// ============================================================
// Purchase Order
// ============================================================

export const purchaseOrderLineSchema = z.object({
  product_id: z.string().uuid().optional().or(z.literal('')),
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.coerce.number().positive('Cantidad debe ser mayor a 0'),
  unit_cost: z.coerce.number().min(0, 'Costo debe ser mayor o igual a 0'),
  vat_rate: z.coerce.number().min(0).max(100).default(21),
});

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().uuid('Seleccione un proveedor'),
  issue_date: z.string().min(1, 'La fecha es requerida'),
  expected_delivery_date: z.string().optional().or(z.literal('')),
  payment_conditions: z.string().optional().or(z.literal('')),
  delivery_address: z.string().optional().or(z.literal('')),
  delivery_notes: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  lines: z.array(purchaseOrderLineSchema).min(1, 'Debe agregar al menos una línea'),
});

// ============================================================
// Purchase Invoice
// ============================================================

export const purchaseInvoiceLineSchema = z.object({
  product_id: z.string().uuid().optional().or(z.literal('')),
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.coerce.number().positive(),
  unit_cost: z.coerce.number().min(0),
  vat_rate: z.coerce.number().min(0).max(100).default(21),
  purchase_order_line_id: z.string().uuid().optional().or(z.literal('')),
  order_id: z.string().uuid().optional().or(z.literal('')),
  order_full_number: z.string().optional().or(z.literal('')),
});

export const purchaseInvoiceSchema = z.object({
  supplier_id: z.string().uuid('Seleccione un proveedor'),
  voucher_type: z.enum(['FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'NOTA_CREDITO_A', 'NOTA_CREDITO_B', 'NOTA_CREDITO_C', 'NOTA_DEBITO_A', 'NOTA_DEBITO_B', 'NOTA_DEBITO_C', 'RECIBO']),
  point_of_sale: z.string().min(1, 'Punto de venta requerido').max(5),
  number: z.string().min(1, 'Número requerido').max(20),
  issue_date: z.string().min(1, 'La fecha es requerida'),
  due_date: z.string().optional().or(z.literal('')),
  cae: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  purchase_order_id: z.string().uuid().optional().or(z.literal('')),
  purchase_order_ids: z.array(z.string().uuid()).optional().default([]),
  lines: z.array(purchaseInvoiceLineSchema).min(1, 'Debe agregar al menos una línea'),
  attachment: z.any().optional(),
});

// MIME types y tamaño máximo para adjunto de Factura de Compra
export const PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const;
export const PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ============================================================
// Receiving Note
// ============================================================

export const receivingNoteLineSchema = z.object({
  product_id: z.string().uuid('Seleccione un producto'),
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.coerce.number().positive('Cantidad debe ser mayor a 0'),
  purchase_order_line_id: z.string().uuid().optional().or(z.literal('')),
  purchase_invoice_line_id: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export const receivingNoteSchema = z.object({
  supplier_id: z.string().uuid('Seleccione un proveedor'),
  warehouse_id: z.string().uuid('Seleccione un almacén'),
  reception_date: z.string().min(1, 'La fecha es requerida'),
  purchase_order_id: z.string().uuid().optional().or(z.literal('')),
  purchase_invoice_id: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  lines: z.array(receivingNoteLineSchema).min(1, 'Debe agregar al menos una línea'),
});
