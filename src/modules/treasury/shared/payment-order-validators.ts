import { z } from 'zod';

const amountString = z
  .string()
  .min(1, 'El monto es requerido')
  .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (máximo 2 decimales)');

export const paymentOrderItemSchema = z.object({
  invoice_id: z.string().uuid().optional().nullable(),
  expense_id: z.string().uuid().optional().nullable(),
  amount: amountString.refine((v) => parseFloat(v) > 0, 'Debe ser mayor a 0'),
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
    ]),
    amount: amountString.refine((v) => parseFloat(v) > 0, 'Debe ser mayor a 0'),
    cash_register_id: z.string().uuid().optional().nullable(),
    bank_account_id: z.string().uuid().optional().nullable(),
    supplier_payment_method_id: z.string().uuid().optional().nullable(),
    check_number: z.string().max(50).optional().nullable(),
    card_last4: z.string().max(4).optional().nullable(),
    reference: z.string().max(100).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.payment_method === 'CASH' && !data.cash_register_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['cash_register_id'],
        message: 'Seleccioná la caja para pagos en efectivo',
      });
    }
    if (['TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD'].includes(data.payment_method) && !data.bank_account_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['bank_account_id'],
        message: 'Seleccioná la cuenta bancaria',
      });
    }
    if (data.payment_method === 'CHECK' && !data.check_number) {
      ctx.addIssue({
        code: 'custom',
        path: ['check_number'],
        message: 'Ingresá el número de cheque',
      });
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
  );
export type PaymentOrderFormData = z.infer<typeof paymentOrderSchema>;
