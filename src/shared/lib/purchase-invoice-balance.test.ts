import { describe, expect, it } from 'vitest';
import {
  allocateCreditNotes,
  buildSupplierAccountRows,
  computePurchaseOutstanding,
  derivePurchaseInvoiceStatus,
  isCreditNoteVoucherType,
  isDebitNoteVoucherType,
  type SupplierVoucherInput,
  type SupplierVoucherRow,
} from './purchase-invoice-balance';

describe('isCreditNoteVoucherType / isDebitNoteVoucherType', () => {
  it('reconoce las tres letras de NC y de ND', () => {
    for (const t of ['NOTA_CREDITO_A', 'NOTA_CREDITO_B', 'NOTA_CREDITO_C']) {
      expect(isCreditNoteVoucherType(t)).toBe(true);
      expect(isDebitNoteVoucherType(t)).toBe(false);
    }
    for (const t of ['NOTA_DEBITO_A', 'NOTA_DEBITO_B', 'NOTA_DEBITO_C']) {
      expect(isDebitNoteVoucherType(t)).toBe(true);
      expect(isCreditNoteVoucherType(t)).toBe(false);
    }
  });

  it('no confunde una factura con una nota', () => {
    expect(isCreditNoteVoucherType('FACTURA_A')).toBe(false);
    expect(isDebitNoteVoucherType('FACTURA_A')).toBe(false);
  });
});

describe('computePurchaseOutstanding', () => {
  it('descuenta pagos y notas de crédito', () => {
    expect(computePurchaseOutstanding({ total: 1000, paid: 300, creditNotes: 200 })).toBe(500);
  });

  it('deja saldo 0 cuando la NC cubre la factura entera (el bug reportado)', () => {
    expect(
      computePurchaseOutstanding({ total: 218_250_000, paid: 0, creditNotes: 218_250_000 })
    ).toBe(0);
  });

  it('nunca devuelve negativo aunque la NC exceda el total', () => {
    expect(computePurchaseOutstanding({ total: 1000, paid: 0, creditNotes: 1500 })).toBe(0);
  });

  it('absorbe diferencias de centavos por debajo de la tolerancia', () => {
    expect(computePurchaseOutstanding({ total: 1000, paid: 999.995, creditNotes: 0 })).toBe(0);
  });
});

describe('derivePurchaseInvoiceStatus', () => {
  it('marca PAID una factura cubierta solo por notas de crédito', () => {
    expect(derivePurchaseInvoiceStatus({ total: 1000, paid: 0, creditNotes: 1000 })).toBe('PAID');
  });

  it('marca PARTIAL_PAID cuando la NC cubre una parte', () => {
    expect(derivePurchaseInvoiceStatus({ total: 1000, paid: 0, creditNotes: 400 })).toBe(
      'PARTIAL_PAID'
    );
  });

  it('combina pagos y notas de crédito para llegar a PAID', () => {
    expect(derivePurchaseInvoiceStatus({ total: 1000, paid: 600, creditNotes: 400 })).toBe('PAID');
  });

  it('vuelve a CONFIRMED cuando no hay cobertura alguna', () => {
    expect(derivePurchaseInvoiceStatus({ total: 1000, paid: 0, creditNotes: 0 })).toBe('CONFIRMED');
  });

  it('no marca PAID una factura de total 0 sin cobertura', () => {
    expect(derivePurchaseInvoiceStatus({ total: 0, paid: 0, creditNotes: 0 })).toBe('CONFIRMED');
  });
});

describe('allocateCreditNotes', () => {
  it('aplica la NC completa cuando entra en el saldo', () => {
    const applied = allocateCreditNotes(1000, [{ id: 'nc1', total: 400 }]);
    expect(applied.get('nc1')).toBe(400);
  });

  it('recorta la NC al saldo disponible y deja el resto a favor', () => {
    const applied = allocateCreditNotes(300, [{ id: 'nc1', total: 500 }]);
    expect(applied.get('nc1')).toBe(300);
  });

  it('reparte en orden: la primera NC consume el saldo antes que la siguiente', () => {
    const applied = allocateCreditNotes(700, [
      { id: 'vieja', total: 500 },
      { id: 'nueva', total: 500 },
    ]);
    expect(applied.get('vieja')).toBe(500);
    expect(applied.get('nueva')).toBe(200);
  });

  it('no aplica nada si la factura ya estaba saldada', () => {
    const applied = allocateCreditNotes(0, [{ id: 'nc1', total: 500 }]);
    expect(applied.get('nc1')).toBe(0);
  });

  it('trata un saldo negativo (sobrepago) como cero disponible', () => {
    const applied = allocateCreditNotes(-100, [{ id: 'nc1', total: 500 }]);
    expect(applied.get('nc1')).toBe(0);
  });

  it('reproduce el caso reportado: dos NC contra dos facturas del mismo importe', () => {
    // NC de 218.250.000 contra la factura de 218.250.000: la cancela entera.
    const aplicadoA = allocateCreditNotes(218_250_000, [{ id: 'nc880', total: 218_250_000 }]);
    expect(aplicadoA.get('nc880')).toBe(218_250_000);
    expect(
      computePurchaseOutstanding({
        total: 218_250_000,
        paid: 0,
        creditNotes: aplicadoA.get('nc880')!,
      })
    ).toBe(0);
  });
});

describe('buildSupplierAccountRows', () => {
  const v = (over: Partial<SupplierVoucherInput>): SupplierVoucherInput => ({
    id: 'x',
    full_number: '00001-00000001',
    voucher_type: 'FACTURA_A',
    issue_date: '2026-06-11',
    due_date: null,
    total: 1000,
    status: 'CONFIRMED',
    original_invoice_id: null,
    ...over,
  });

  const byNumber = (rows: SupplierVoucherRow[], n: string) =>
    rows.find((r) => r.full_number === n)!;

  it('imputa la NC contra su factura y deja ambas en saldo 0', () => {
    const { rows, totals } = buildSupplierAccountRows(
      [
        v({ id: 'f1', full_number: 'F-001', total: 1000 }),
        v({
          id: 'nc1',
          full_number: 'NC-001',
          voucher_type: 'NOTA_CREDITO_A',
          total: 1000,
          original_invoice_id: 'f1',
        }),
      ],
      new Map()
    );

    expect(byNumber(rows, 'F-001').remaining).toBe(0);
    expect(byNumber(rows, 'F-001').credit_applied).toBe(1000);
    expect(byNumber(rows, 'NC-001').remaining).toBe(0);
    expect(byNumber(rows, 'NC-001').applies_to).toBe('F-001');
    expect(totals.totalDebt).toBe(0);
    expect(totals.pendingCount).toBe(0);
  });

  it('la NC no infla el "monto facturado"', () => {
    const { totals } = buildSupplierAccountRows(
      [
        v({ id: 'f1', full_number: 'F-001', total: 1000 }),
        v({
          id: 'nc1',
          full_number: 'NC-001',
          voucher_type: 'NOTA_CREDITO_A',
          total: 1000,
          original_invoice_id: 'f1',
        }),
      ],
      new Map()
    );
    expect(totals.totalAmount).toBe(1000);
  });

  it('el excedente de una NC queda como crédito a favor, no como deuda negativa de la factura', () => {
    const { rows, totals } = buildSupplierAccountRows(
      [
        v({ id: 'f1', full_number: 'F-001', total: 1000 }),
        v({
          id: 'nc1',
          full_number: 'NC-001',
          voucher_type: 'NOTA_CREDITO_A',
          total: 1500,
          original_invoice_id: 'f1',
        }),
      ],
      new Map()
    );

    expect(byNumber(rows, 'F-001').remaining).toBe(0);
    expect(byNumber(rows, 'NC-001').remaining).toBe(-500);
    expect(totals.unappliedCredit).toBe(500);
    expect(totals.totalDebt).toBe(-500);
  });

  it('una NC en borrador no descuenta nada', () => {
    const { rows, totals } = buildSupplierAccountRows(
      [
        v({ id: 'f1', full_number: 'F-001', total: 1000 }),
        v({
          id: 'nc1',
          full_number: 'NC-001',
          voucher_type: 'NOTA_CREDITO_A',
          total: 1000,
          status: 'DRAFT',
          original_invoice_id: 'f1',
        }),
      ],
      new Map()
    );

    expect(byNumber(rows, 'F-001').remaining).toBe(1000);
    expect(totals.totalDebt).toBe(1000);
    expect(totals.unappliedCredit).toBe(0);
  });

  it('la NC solo descuenta lo que la factura todavía debe después de los pagos', () => {
    const { rows } = buildSupplierAccountRows(
      [
        v({ id: 'f1', full_number: 'F-001', total: 1000 }),
        v({
          id: 'nc1',
          full_number: 'NC-001',
          voucher_type: 'NOTA_CREDITO_A',
          total: 600,
          original_invoice_id: 'f1',
        }),
      ],
      new Map([['f1', 700]])
    );

    // Quedaban 300 por pagar: la NC aplica 300 y le sobran 300 a favor.
    expect(byNumber(rows, 'F-001').remaining).toBe(0);
    expect(byNumber(rows, 'F-001').credit_applied).toBe(300);
    expect(byNumber(rows, 'NC-001').remaining).toBe(-300);
  });

  it('reparte varias NC sobre la misma factura de la más vieja a la más nueva', () => {
    const { rows } = buildSupplierAccountRows(
      [
        v({ id: 'f1', full_number: 'F-001', total: 1000 }),
        v({
          id: 'ncNueva',
          full_number: 'NC-NUEVA',
          voucher_type: 'NOTA_CREDITO_A',
          issue_date: '2026-07-01',
          total: 800,
          original_invoice_id: 'f1',
        }),
        v({
          id: 'ncVieja',
          full_number: 'NC-VIEJA',
          voucher_type: 'NOTA_CREDITO_A',
          issue_date: '2026-01-01',
          total: 800,
          original_invoice_id: 'f1',
        }),
      ],
      new Map()
    );

    expect(byNumber(rows, 'NC-VIEJA').credit_applied).toBe(800);
    expect(byNumber(rows, 'NC-NUEVA').credit_applied).toBe(200);
    expect(byNumber(rows, 'NC-NUEVA').remaining).toBe(-600);
    expect(byNumber(rows, 'F-001').remaining).toBe(0);
  });

  it('una NC contra una factura anulada queda entera a favor', () => {
    const { rows } = buildSupplierAccountRows(
      [
        v({ id: 'f1', full_number: 'F-001', total: 1000, status: 'CANCELLED' }),
        v({
          id: 'nc1',
          full_number: 'NC-001',
          voucher_type: 'NOTA_CREDITO_A',
          total: 1000,
          original_invoice_id: 'f1',
        }),
      ],
      new Map()
    );
    expect(byNumber(rows, 'NC-001').remaining).toBe(-1000);
  });

  it('la nota de débito suma deuda como comprobante propio, no contra la factura', () => {
    const { rows, totals } = buildSupplierAccountRows(
      [
        v({ id: 'f1', full_number: 'F-001', total: 1000 }),
        v({
          id: 'nd1',
          full_number: 'ND-001',
          voucher_type: 'NOTA_DEBITO_A',
          total: 200,
          original_invoice_id: 'f1',
        }),
      ],
      new Map()
    );

    expect(byNumber(rows, 'F-001').remaining).toBe(1000);
    expect(byNumber(rows, 'ND-001').remaining).toBe(200);
    expect(totals.totalDebt).toBe(1200);
    expect(totals.pendingCount).toBe(2);
  });

  it('reproduce la cuenta corriente reportada por el cliente', () => {
    // Captura del proveedor 194dd099: 7 facturas + 2 NC, todas del 11/06/2026.
    // 2 facturas ya pagadas por OP; cada NC corrige una factura de igual importe.
    const vouchers: SupplierVoucherInput[] = [
      v({ id: 'f5776', full_number: '00005-00005776', total: 210_975_000, status: 'PAID' }),
      v({ id: 'f5777', full_number: '00005-00005777', total: 210_975_000, status: 'PAID' }),
      v({ id: 'f5778', full_number: '00005-00005778', total: 210_975_000 }),
      v({ id: 'f5779', full_number: '00005-00005779', total: 218_250_000 }),
      v({ id: 'f5780', full_number: '00005-00005780', total: 210_975_000 }),
      v({ id: 'f5781', full_number: '00005-00005781', total: 210_975_000 }),
      v({ id: 'f5782', full_number: '00005-00005782', total: 218_250_000 }),
      v({
        id: 'nc880',
        full_number: '00005-00000880',
        voucher_type: 'NOTA_CREDITO_A',
        total: 218_250_000,
        original_invoice_id: 'f5779',
      }),
      v({
        id: 'nc881',
        full_number: '00005-00000881',
        voucher_type: 'NOTA_CREDITO_A',
        total: 210_975_000,
        original_invoice_id: 'f5778',
      }),
    ];
    const paid = new Map([
      ['f5776', 210_975_000],
      ['f5777', 210_975_000],
    ]);

    const { rows, totals } = buildSupplierAccountRows(vouchers, paid);

    // Las facturas corregidas quedan saldadas, no con su saldo bruto.
    expect(byNumber(rows, '00005-00005779').remaining).toBe(0);
    expect(byNumber(rows, '00005-00005778').remaining).toBe(0);
    // Las NC ya no arrastran un saldo negativo propio.
    expect(byNumber(rows, '00005-00000880').remaining).toBe(0);
    expect(byNumber(rows, '00005-00000881').remaining).toBe(0);

    // El total adeudado sigue siendo el mismo neto que mostraba la pantalla.
    expect(totals.totalDebt).toBe(640_200_000);
    expect(totals.totalAmount).toBe(1_491_375_000);
    // Antes decía 7 pendientes contando las 2 NC; ahora son 3 facturas con saldo.
    expect(totals.pendingCount).toBe(3);
    expect(totals.unappliedCredit).toBe(0);
  });
});
