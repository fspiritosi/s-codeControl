import { z } from 'zod';

const amountString = z
  .string()
  .min(1, 'El monto es requerido')
  .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (máximo 2 decimales)');

export const paymentOrderItemSchema = z
  .object({
    invoice_id: z.string().uuid().optional().nullable(),
    expense_id: z.string().uuid().optional().nullable(),
    amount: amountString.refine((v) => parseFloat(v) > 0, 'Debe ser mayor a 0'),
    discount_pct: z.coerce
      .number()
      .min(0, 'El descuento no puede ser negativo')
      .max(100, 'El descuento no puede superar 100%')
      .optional()
      .default(0),
    /** Pago a cuenta: sin comprobante, genera saldo a favor del proveedor. */
    is_on_account: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    const hasVoucher = !!data.invoice_id || !!data.expense_id;
    // Un ítem a cuenta no lleva comprobante, y uno con comprobante no es a cuenta:
    // sin esta regla un ítem podría descontar una factura Y generar crédito.
    if (data.is_on_account && hasVoucher) {
      ctx.addIssue({
        code: 'custom',
        path: ['is_on_account'],
        message: 'Un pago a cuenta no puede estar imputado a un comprobante',
      });
    }
    if (!data.is_on_account && !hasVoucher) {
      ctx.addIssue({
        code: 'custom',
        path: ['invoice_id'],
        message: 'Seleccioná un comprobante o marcá el ítem como pago a cuenta',
      });
    }
  });
export type PaymentOrderItemFormData = z.infer<typeof paymentOrderItemSchema>;

export const paymentOrderPaymentSchema = z
  .object({
    payment_method: z.enum([
      'CASH',
      'CHECK',
      'TRANSFER',
      'DEBIT_CARD',
      'CREDIT_CARD',
      'ACCOUNT',
      'DEBIN_CREDIN',
    ]),
    amount: amountString.refine((v) => parseFloat(v) > 0, 'Debe ser mayor a 0'),
    cash_register_id: z.string().uuid().optional().nullable(),
    bank_account_id: z.string().uuid().optional().nullable(),
    supplier_payment_method_id: z.string().uuid().optional().nullable(),
    check_number: z.string().max(50).optional().nullable(),
    card_last4: z.string().max(4).optional().nullable(),
    reference: z.string().max(100).optional().nullable(),
    // Cheque: tipo (propio/tercero) y cheque seleccionado o cargado para este pago
    check_kind: z.enum(['OWN', 'THIRD_PARTY']).optional().nullable(),
    check_id: z.string().uuid().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.payment_method === 'CASH' && !data.cash_register_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['cash_register_id'],
        message: 'Seleccioná la caja para pagos en efectivo',
      });
    }
    if (
      ['TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'DEBIN_CREDIN'].includes(data.payment_method) &&
      !data.bank_account_id
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['bank_account_id'],
        message: 'Seleccioná la cuenta bancaria',
      });
    }
    if (data.payment_method === 'CHECK') {
      if (!data.check_kind) {
        ctx.addIssue({
          code: 'custom',
          path: ['check_kind'],
          message: 'Indicá si el cheque es propio o de tercero',
        });
      }
      if (!data.check_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['check_id'],
          message: 'Seleccioná o cargá un cheque',
        });
      }
    }
  });
export type PaymentOrderPaymentFormData = z.infer<typeof paymentOrderPaymentSchema>;

export const paymentOrderRetentionSchema = z.object({
  tax_type_id: z.string().uuid('Seleccione un tipo de retención'),
  base_amount: z.coerce.number().min(0, 'Base no puede ser negativa'),
  rate: z.coerce.number().min(0).max(100, 'Alícuota fuera de rango'),
  amount: z.coerce.number().min(0, 'Monto no puede ser negativo'),
  notes: z.string().optional().nullable(),
});
export type PaymentOrderRetentionFormData = z.infer<typeof paymentOrderRetentionSchema>;

export const paymentOrderSchema = z
  .object({
    supplier_id: z.string().uuid().optional().nullable(),
    date: z.string().min(1, 'Fecha requerida'),
    scheduled_payment_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha programada inválida')
      .optional()
      .nullable(),
    notes: z.string().max(1000).optional().nullable(),
    items: z.array(paymentOrderItemSchema).min(1, 'Al menos un ítem'),
    payments: z.array(paymentOrderPaymentSchema).min(1, 'Al menos un pago'),
    retentions: z.array(paymentOrderRetentionSchema).optional().default([]),
  })
  .refine(
    (data) => {
      const itemsTotal = data.items.reduce((acc, i) => acc + parseFloat(i.amount), 0);
      const paymentsTotal = data.payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
      const retentionsTotal = (data.retentions ?? []).reduce(
        (acc, r) => acc + (Number(r.amount) || 0),
        0
      );
      // items_total - retentions_total === payments_total (neto a pagar).
      return Math.abs(itemsTotal - retentionsTotal - paymentsTotal) < 0.01;
    },
    {
      message:
        'El total de ítems menos las retenciones debe coincidir con el total de pagos',
    }
  )
  .superRefine((data, ctx) => {
    // El saldo a favor se lleva por proveedor: sin proveedor no hay a quién
    // acreditarle el pago a cuenta.
    if (data.items.some((i) => i.is_on_account) && !data.supplier_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['supplier_id'],
        message: 'Un pago a cuenta requiere seleccionar el proveedor',
      });
    }
  });
export type PaymentOrderFormData = z.infer<typeof paymentOrderSchema>;
