import { z } from 'zod';
import { SALES_VOUCHER_TYPES } from './types';

// ============================================================
// Punto de venta
// ============================================================

export const salesPointOfSaleSchema = z.object({
  number: z.coerce.number().int().positive('El número de punto de venta debe ser mayor a 0'),
  name: z.string().min(1, 'El nombre es requerido'),
  is_active: z.boolean().default(true),
});

/** Configuración del número inicial por tipo de comprobante para un punto de venta. */
export const salesSequenceConfigSchema = z.object({
  point_of_sale_id: z.string().uuid(),
  sequences: z
    .array(
      z.object({
        voucher_type: z.enum(SALES_VOUCHER_TYPES),
        next_number: z.coerce.number().int().min(1, 'El número inicial debe ser mayor o igual a 1'),
      })
    )
    .min(1),
});

// ============================================================
// Factura de venta
// ============================================================

export const salesInvoiceLineSchema = z.object({
  product_id: z.string().uuid().optional().or(z.literal('')),
  service_item_id: z.string().uuid().optional().or(z.literal('')),
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.coerce.number().positive('Cantidad debe ser mayor a 0'),
  unit_price: z.coerce.number().min(0, 'Precio debe ser mayor o igual a 0'),
  vat_rate: z.coerce.number().min(0).max(100).default(21),
  discount_type: z.enum(['PERCENTAGE', 'FIXED']).nullable().optional(),
  discount_value: z.coerce.number().min(0).nullable().optional(),
});

export const salesInvoicePerceptionSchema = z.object({
  tax_type_id: z.string().uuid('Seleccione un tipo de percepción'),
  base_amount: z.coerce.number().min(0, 'Base no puede ser negativa'),
  rate: z.coerce.number().min(0).max(100, 'Alícuota fuera de rango'),
  amount: z.coerce.number().min(0, 'Monto no puede ser negativo'),
  notes: z.string().optional().or(z.literal('')),
});

export const salesInvoiceOtherChargeSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
});

export const salesInvoiceSchema = z
  .object({
    customer_id: z.string().uuid('Seleccione un cliente'),
    point_of_sale_id: z.string().uuid('Seleccione un punto de venta'),
    voucher_type: z.enum(SALES_VOUCHER_TYPES),
    issue_date: z.string().min(1, 'La fecha es requerida'),
    due_date: z.string().optional().or(z.literal('')),
    cae: z.string().optional().or(z.literal('')),
    cae_expiry_date: z.string().optional().or(z.literal('')),
    currency: z.enum(['ARS', 'USD']).default('ARS'),
    exchange_rate: z.coerce.number().positive('El tipo de cambio debe ser mayor a 0').default(1),
    notes: z.string().optional().or(z.literal('')),
    original_invoice_id: z.string().uuid().nullable().optional().or(z.literal('')),
    global_discount_type: z.enum(['PERCENTAGE', 'FIXED']).nullable().optional(),
    global_discount_value: z.coerce.number().min(0).nullable().optional(),
    lines: z.array(salesInvoiceLineSchema).min(1, 'Debe agregar al menos una línea'),
    perceptions: z.array(salesInvoicePerceptionSchema).optional().default([]),
    other_charges: z.array(salesInvoiceOtherChargeSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    // NC/ND siempre asociadas a una factura original.
    const isNote = ['NOTA_CREDITO_A', 'NOTA_CREDITO_B', 'NOTA_DEBITO_A', 'NOTA_DEBITO_B'].includes(
      data.voucher_type
    );
    if (isNote && !data.original_invoice_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['original_invoice_id'],
        message: 'Seleccioná la factura asociada a esta nota',
      });
    }
  });

export type SalesInvoiceInput = z.infer<typeof salesInvoiceSchema>;

// ============================================================
// Recibo de cobro
// ============================================================

export const receiptItemSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.coerce.number().positive('El importe aplicado debe ser mayor a 0'),
});

export const receiptPaymentSchema = z.object({
  payment_method: z.enum(['CASH', 'CHECK', 'ECHEQ', 'TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'OTHER']),
  amount: z.coerce.number().positive('El importe debe ser mayor a 0'),
  reference: z.string().optional().or(z.literal('')),
  check_number: z.string().optional().or(z.literal('')),
  check_bank: z.string().optional().or(z.literal('')),
  check_due_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export const receiptWithholdingSchema = z.object({
  tax_type: z.enum(['IVA', 'GANANCIAS', 'IIBB', 'SUSS', 'OTHER']),
  rate: z.coerce.number().min(0).max(100).nullable().optional(),
  amount: z.coerce.number().positive('El importe debe ser mayor a 0'),
  certificate_number: z.string().optional().or(z.literal('')),
});

export const receiptSchema = z.object({
  customer_id: z.string().uuid('Seleccione un cliente'),
  date: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(receiptItemSchema).min(1, 'Debe aplicar el recibo a al menos una factura'),
  payments: z.array(receiptPaymentSchema).optional().default([]),
  withholdings: z.array(receiptWithholdingSchema).optional().default([]),
});

export type ReceiptInput = z.infer<typeof receiptSchema>;

// MIME types y tamaño máximo para adjuntos de ventas
export const SALES_ATTACHMENT_ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export const SALES_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
