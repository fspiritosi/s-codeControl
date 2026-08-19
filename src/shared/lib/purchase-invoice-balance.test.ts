import { describe, expect, it } from 'vitest';
import {
  buildSupplierAccountRows,
  computeCreditNoteAvailable,
  computePurchaseOutstanding,
  computeSupplierCreditBalance,
  derivePurchaseInvoiceStatus,
  isCreditNoteVoucherType,
  isDebitNoteVoucherType,
  type SupplierAccountCredit,
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

describe('computeCreditNoteAvailable', () => {
  it('una NC sin imputar tiene todo su total disponible', () => {
    expect(computeCreditNoteAvailable({ total: 1000, applied: 0 })).toBe(1000);
  });

  it('descuenta lo ya imputado', () => {
    expect(computeCreditNoteAvailable({ total: 1000, applied: 400 })).toBe(600);
  });

  it('devuelve 0 cuando quedó íntegramente imputada', () => {
    expect(computeCreditNoteAvailable({ total: 1000, applied: 1000 })).toBe(0);
  });

  it('nunca devuelve negativo aunque los datos vengan inconsistentes', () => {
    expect(computeCreditNoteAvailable({ total: 1000, applied: 1500 })).toBe(0);
  });

  it('absorbe centavos por debajo de la tolerancia', () => {
    expect(computeCreditNoteAvailable({ total: 1000, applied: 999.995 })).toBe(0);
  });
});

describe('computeSupplierCreditBalance', () => {
  it('suma los pagos a cuenta y resta las aplicaciones activas', () => {
    expect(computeSupplierCreditBalance({ onAccountPaid: 5000, creditApplied: 2000 })).toBe(3000);
  });

  it('devuelve 0 cuando el crédito quedó íntegramente aplicado', () => {
    expect(computeSupplierCreditBalance({ onAccountPaid: 5000, creditApplied: 5000 })).toBe(0);
  });

  it('nunca devuelve negativo aunque los datos vengan inconsistentes', () => {
    expect(computeSupplierCreditBalance({ onAccountPaid: 1000, creditApplied: 1500 })).toBe(0);
  });

  it('sin pagos a cuenta no hay saldo a favor', () => {
    expect(computeSupplierCreditBalance({ onAccountPaid: 0, creditApplied: 0 })).toBe(0);
  });

  it('absorbe centavos por debajo de la tolerancia', () => {
    expect(computeSupplierCreditBalance({ onAccountPaid: 1000, creditApplied: 999.995 })).toBe(0);
  });
});

describe('cobertura con las tres fuentes (pagos + NC + crédito a cuenta)', () => {
  it('llega a PAID combinando las tres', () => {
    expect(
      derivePurchaseInvoiceStatus({ total: 1000, paid: 400, creditNotes: 300, creditApplied: 300 })
    ).toBe('PAID');
  });

  it('el crédito aplicado solo alcanza para PARTIAL_PAID', () => {
    expect(
      derivePurchaseInvoiceStatus({ total: 1000, paid: 0, creditNotes: 0, creditApplied: 250 })
    ).toBe('PARTIAL_PAID');
  });

  it('marca PAID una factura cubierta solo con crédito a cuenta', () => {
    expect(
      derivePurchaseInvoiceStatus({ total: 1000, paid: 0, creditNotes: 0, creditApplied: 1000 })
    ).toBe('PAID');
  });

  it('el saldo pendiente descuenta también el crédito aplicado', () => {
    expect(
      computePurchaseOutstanding({ total: 1000, paid: 200, creditNotes: 300, creditApplied: 100 })
    ).toBe(400);
  });

  it('omitir creditApplied mantiene el comportamiento anterior', () => {
    // Las llamadas existentes no pasan el tercer término: no deben cambiar.
    expect(computePurchaseOutstanding({ total: 1000, paid: 200, creditNotes: 300 })).toBe(500);
    expect(derivePurchaseInvoiceStatus({ total: 1000, paid: 1000, creditNotes: 0 })).toBe('PAID');
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

  /**
   * Arma los mapas de imputación como los devuelve la base desde TKT-586.
   * `target` es el número del comprobante destino (factura u OP) que se muestra
   * en la fila de la NC; `invoice` es null cuando el crédito se usó en una OP.
   */
  const credit = (
    apps: { note: string; invoice?: string | null; amount: number; target?: string }[],
    onAccount: [string, number][] = []
  ): SupplierAccountCredit => {
    const appliedByNote = new Map<string, number>();
    const creditNotesByInvoice = new Map<string, number>();
    const targetsByNote = new Map<string, string[]>();
    for (const a of apps) {
      appliedByNote.set(a.note, (appliedByNote.get(a.note) ?? 0) + a.amount);
      if (a.invoice) {
        creditNotesByInvoice.set(a.invoice, (creditNotesByInvoice.get(a.invoice) ?? 0) + a.amount);
      }
      if (a.target) {
        const list = targetsByNote.get(a.note) ?? [];
        if (!list.includes(a.target)) list.push(a.target);
        targetsByNote.set(a.note, list);
      }
    }
    return {
      appliedByNote,
      creditNotesByInvoice,
      targetsByNote,
      onAccountByInvoice: new Map(onAccount),
    };
  };

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
      new Map(),
      credit([{ note: 'nc1', invoice: 'f1', amount: 1000, target: 'F-001' }])
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
      new Map(),
      credit([{ note: 'nc1', invoice: 'f1', amount: 1000, target: 'F-001' }])
    );
    expect(totals.totalAmount).toBe(1000);
  });

  it('lo que la NC no imputó queda como crédito a favor', () => {
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
      new Map(),
      credit([{ note: 'nc1', invoice: 'f1', amount: 1000, target: 'F-001' }])
    );

    expect(byNumber(rows, 'F-001').remaining).toBe(0);
    expect(byNumber(rows, 'NC-001').remaining).toBe(-500);
    expect(totals.unappliedCredit).toBe(500);
    expect(totals.totalDebt).toBe(-500);
  });

  it('una NC en borrador no descuenta nada ni suma crédito', () => {
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

  it('una NC repartida entre varias facturas descuenta en cada una (TKT-586)', () => {
    const { rows, totals } = buildSupplierAccountRows(
      [
        v({ id: 'f1', full_number: 'F-001', total: 500 }),
        v({ id: 'f2', full_number: 'F-002', total: 500 }),
        v({
          id: 'nc1',
          full_number: 'NC-001',
          voucher_type: 'NOTA_CREDITO_A',
          total: 800,
          original_invoice_id: 'f1',
        }),
      ],
      new Map(),
      credit([
        { note: 'nc1', invoice: 'f1', amount: 500, target: 'F-001' },
        { note: 'nc1', invoice: 'f2', amount: 300, target: 'F-002' },
      ])
    );

    expect(byNumber(rows, 'F-001').remaining).toBe(0);
    expect(byNumber(rows, 'F-002').remaining).toBe(200);
    expect(byNumber(rows, 'NC-001').remaining).toBe(0);
    expect(byNumber(rows, 'NC-001').applies_to).toBe('F-001, F-002');
    expect(totals.totalDebt).toBe(200);
  });

  it('una NC usada en una OP consume crédito y muestra la orden como destino', () => {
    const { rows, totals } = buildSupplierAccountRows(
      [
        v({
          id: 'nc1',
          full_number: 'NC-001',
          voucher_type: 'NOTA_CREDITO_A',
          total: 200_000,
          original_invoice_id: null,
        }),
      ],
      new Map(),
      credit([{ note: 'nc1', invoice: null, amount: 200_000, target: 'OP-00002' }])
    );

    expect(byNumber(rows, 'NC-001').credit_applied).toBe(200_000);
    expect(byNumber(rows, 'NC-001').remaining).toBe(0);
    expect(byNumber(rows, 'NC-001').applies_to).toBe('OP-00002');
    expect(totals.unappliedCredit).toBe(0);
  });

  it('el saldo a favor imputado también baja lo que la factura adeuda', () => {
    const { rows } = buildSupplierAccountRows(
      [v({ id: 'f1', full_number: 'F-001', total: 1000 })],
      new Map([['f1', 400]]),
      credit([], [['f1', 300]])
    );

    expect(byNumber(rows, 'F-001').on_account_applied).toBe(300);
    expect(byNumber(rows, 'F-001').remaining).toBe(300);
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

  it('el circuito de TKT-586: factura pagada, NC sin imputar, crédito entero disponible', () => {
    // FC-1 se pagó entera; después llega la NC que la corrige. Como la factura
    // no debe nada, la NC no se imputa a nada: su crédito queda disponible para
    // usarlo en la OP de la refacturación.
    const { rows, totals } = buildSupplierAccountRows(
      [
        v({ id: 'f1', full_number: 'FC-001', total: 200_000, status: 'PAID' }),
        v({
          id: 'nc1',
          full_number: 'NC-001',
          voucher_type: 'NOTA_CREDITO_A',
          total: 200_000,
          original_invoice_id: 'f1',
        }),
      ],
      new Map([['f1', 200_000]])
    );

    expect(byNumber(rows, 'FC-001').remaining).toBe(0);
    expect(byNumber(rows, 'NC-001').remaining).toBe(-200_000);
    expect(totals.unappliedCredit).toBe(200_000);
    expect(totals.totalDebt).toBe(-200_000);
  });

  it('reproduce la cuenta corriente reportada por el cliente', () => {
    // Captura del proveedor 194dd099: 7 facturas + 2 NC, todas del 11/06/2026.
    // 2 facturas ya pagadas por OP; cada NC corrige una factura de igual importe
    // y quedó imputada contra ella (es lo que dejó el backfill de TKT-586).
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

    const { rows, totals } = buildSupplierAccountRows(
      vouchers,
      paid,
      credit([
        { note: 'nc880', invoice: 'f5779', amount: 218_250_000, target: '00005-00005779' },
        { note: 'nc881', invoice: 'f5778', amount: 210_975_000, target: '00005-00005778' },
      ])
    );

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
