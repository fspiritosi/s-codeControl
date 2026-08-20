import { describe, expect, it } from 'vitest';
import { paymentOrderSchema } from './payment-order-validators';

/**
 * El caso de TKT-586: una NC cubre el total de los comprobantes y no queda nada
 * por transferir. La orden tiene que poder guardarse igual, sin pagos.
 */
describe('paymentOrderSchema — orden cubierta por crédito', () => {
  const invoiceId = '11111111-1111-4111-8111-111111111111';
  const creditNoteId = '22222222-2222-4222-8222-222222222222';

  const base = {
    supplier_id: '33333333-3333-4333-8333-333333333333',
    date: '2026-08-20',
    items: [{ invoice_id: invoiceId, amount: '1000.00' }],
  };

  it('acepta una orden sin pagos cuando el crédito cubre el neto', () => {
    const result = paymentOrderSchema.safeParse({
      ...base,
      payments: [],
      credits: [{ credit_note_id: creditNoteId, amount: '1000.00' }],
    });

    expect(result.success).toBe(true);
  });

  it('rechaza una línea de pago en blanco: no es un pago', () => {
    const result = paymentOrderSchema.safeParse({
      ...base,
      // Es la línea con la que arranca el formulario. Tiene que quedarse en el
      // cliente, no viajar: acá el importe vacío es un dato inválido.
      payments: [{ payment_method: 'CASH', amount: '' }],
      credits: [{ credit_note_id: creditNoteId, amount: '1000.00' }],
    });

    expect(result.success).toBe(false);
  });

  it('sigue exigiendo que los pagos cubran el neto cuando no hay crédito', () => {
    const result = paymentOrderSchema.safeParse({
      ...base,
      payments: [],
      credits: [],
    });

    expect(result.success).toBe(false);
  });

  it('cuadra ítems menos crédito contra los pagos', () => {
    const result = paymentOrderSchema.safeParse({
      ...base,
      payments: [
        {
          payment_method: 'TRANSFER',
          amount: '400.00',
          bank_account_id: '44444444-4444-4444-8444-444444444444',
        },
      ],
      credits: [{ credit_note_id: creditNoteId, amount: '600.00' }],
    });

    expect(result.success).toBe(true);
  });
});
