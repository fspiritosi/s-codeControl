/**
 * Tipos de comprobante de compra y aritmética de saldos.
 *
 * Vive en `shared` y no en `modules/purchasing` porque tesorería y proveedores
 * también lo necesitan, y los módulos no pueden importarse entre sí.
 * Es puro (sin Prisma): se usa desde componentes cliente y es testeable aislado.
 * Lo que consulta la base está en `purchase-invoice-status.ts`.
 */

import { BASE_CURRENCY, convertAmount } from '@/shared/lib/currency-conversion';

/** Tolerancia de centavos al comparar montos. */
export const BALANCE_EPS = 0.01;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Notas de crédito: restan saldo deudor de la factura que corrigen. */
export const CREDIT_NOTE_VOUCHER_TYPES = [
  'NOTA_CREDITO_A',
  'NOTA_CREDITO_B',
  'NOTA_CREDITO_C',
] as const;

/**
 * Notas de débito: en compras se pagan como comprobante independiente (aparecen
 * por sí mismas en saldos pendientes y en la cuenta corriente), por eso NO se
 * suman al "cargado" de su factura original: sería doble conteo.
 */
export const DEBIT_NOTE_VOUCHER_TYPES = [
  'NOTA_DEBITO_A',
  'NOTA_DEBITO_B',
  'NOTA_DEBITO_C',
] as const;

/** Estados de una NC en los que su crédito ya es efectivo (no borrador ni anulada). */
export const ACTIVE_CREDIT_NOTE_STATUSES = ['CONFIRMED', 'PARTIAL_PAID', 'PAID'] as const;

export function isCreditNoteVoucherType(voucherType: string): boolean {
  return (CREDIT_NOTE_VOUCHER_TYPES as readonly string[]).includes(voucherType);
}

export function isDebitNoteVoucherType(voucherType: string): boolean {
  return (DEBIT_NOTE_VOUCHER_TYPES as readonly string[]).includes(voucherType);
}

export type PurchaseInvoicePaidStatus = 'CONFIRMED' | 'PARTIAL_PAID' | 'PAID';

/**
 * Cobertura de una factura de compra: todo lo que ya dejó de deberse.
 *
 *   pagos imputados por OP + NC aplicadas + crédito a cuenta aplicado
 *
 * `creditApplied` es opcional para no romper las llamadas que no manejan saldo
 * a favor.
 */
interface PurchaseCoverageInput {
  total: number;
  paid: number;
  creditNotes: number;
  /** Saldo a favor del proveedor imputado a esta factura. */
  creditApplied?: number;
}

const coverageOf = (i: PurchaseCoverageInput) => i.paid + i.creditNotes + (i.creditApplied ?? 0);

/**
 * Estado de pago que le corresponde a una factura de compra.
 *
 *   cargado = total de la factura
 *   PAID          si cargado > 0 y la cobertura lo alcanza (con tolerancia)
 *   PARTIAL_PAID  si hay alguna cobertura
 *   CONFIRMED     en otro caso
 *
 * Las ND no se suman al cargado: en compras se pagan como comprobante propio,
 * así que sumarlas acá las contaría dos veces.
 */
export function derivePurchaseInvoiceStatus(
  input: PurchaseCoverageInput
): PurchaseInvoicePaidStatus {
  const covered = coverageOf(input);
  if (input.total > 0 && covered >= input.total - BALANCE_EPS) return 'PAID';
  return covered > 0 ? 'PARTIAL_PAID' : 'CONFIRMED';
}

/**
 * Saldo pendiente de una factura de compra.
 * pendiente = total - cobertura (nunca negativo).
 */
export function computePurchaseOutstanding(input: PurchaseCoverageInput): number {
  const pending = round2(input.total - coverageOf(input));
  return pending < BALANCE_EPS ? 0 : pending;
}

/**
 * Saldo a favor de un proveedor: la "bolsa" de crédito disponible.
 *
 * Nace de los ítems a cuenta de OPs ya pagadas y se consume al imputarlo a
 * facturas. Nunca es negativo: si los datos vinieran inconsistentes, no hay
 * crédito disponible antes que un número que rompa los cálculos aguas abajo.
 */
export function computeSupplierCreditBalance(input: {
  onAccountPaid: number;
  creditApplied: number;
}): number {
  const balance = round2(input.onAccountPaid - input.creditApplied);
  return balance < BALANCE_EPS ? 0 : balance;
}

/**
 * Crédito todavía disponible de una nota de crédito (TKT-586).
 *
 * Una NC vale su total menos lo que ya se imputó — a facturas o dentro de una
 * OP. Nunca negativo: si los datos vinieran inconsistentes, es preferible no
 * ofrecer crédito antes que un número que rompa los cálculos aguas abajo.
 */
export function computeCreditNoteAvailable(input: {
  total: number;
  applied: number;
}): number {
  const available = round2(input.total - input.applied);
  return available < BALANCE_EPS ? 0 : available;
}

export interface SupplierVoucherInput {
  id: string;
  full_number: string;
  voucher_type: string;
  issue_date: Date | string;
  due_date: Date | string | null;
  total: number;
  status: string;
  original_invoice_id: string | null;
  /** Moneda del comprobante. Ausente = ARS. */
  currency?: string;
  /** Tipo de cambio con el que se emitió. Solo se usa si la moneda no es la base. */
  exchange_rate?: number;
}

export interface SupplierVoucherRow extends Omit<SupplierVoucherInput, 'total' | 'currency' | 'exchange_rate'> {
  total: number;
  /** Moneda del comprobante, ya normalizada. Los importes de la fila están en ella. */
  currency: string;
  exchange_rate: number;
  /** `total` convertido a pesos con el TC del comprobante. */
  total_in_base: number;
  /** `remaining` convertido a pesos. Es el que suma al total adeudado. */
  remaining_in_base: number;
  paid: number;
  /** En una factura: crédito de NC recibido. En una NC: crédito ya imputado. */
  credit_applied: number;
  /** Solo en facturas: saldo a favor (pago a cuenta) imputado. */
  on_account_applied: number;
  /** Positivo = deuda. Negativo = crédito de NC todavía sin imputar. */
  remaining: number;
  /** Solo en NC: comprobantes a los que se imputó, o la factura de referencia. */
  applies_to: string | null;
}

/**
 * Imputaciones ya resueltas en la base, que esta función solo consume (TKT-586).
 *
 * Antes el reparto NC → factura se calculaba acá, en memoria, a partir de
 * `original_invoice_id`. Ahora vive en `credit_note_applications`: una NC puede
 * ir a varias facturas o usarse dentro de una OP, y esa decisión es del usuario,
 * no de un greedy implícito.
 */
export interface SupplierAccountCredit {
  /** Crédito ya imputado por cada NC (cuánto consumió). */
  appliedByNote?: Map<string, number>;
  /** Crédito de NC recibido por cada factura. */
  creditNotesByInvoice?: Map<string, number>;
  /** Saldo a favor (pago a cuenta) imputado a cada factura. */
  onAccountByInvoice?: Map<string, number>;
  /** Comprobantes a los que se imputó cada NC, para mostrarlos en la fila. */
  targetsByNote?: Map<string, string[]>;
}

export interface SupplierVoucherTotals {
  /** Todos los totales están en pesos: los comprobantes en moneda extranjera se
   *  convierten con el TC de cada comprobante. Sumar los importes crudos
   *  mezclaría dólares con pesos. */
  totalDebt: number;
  totalAmount: number;
  pendingCount: number;
  unappliedCredit: number;
  countByStatus: Record<string, number>;
  total: number;
  /** Hay al menos un comprobante en moneda extranjera: la UI lo aclara. */
  hasForeignCurrency: boolean;
}

/**
 * Arma las filas de la cuenta corriente de un proveedor con el saldo real de
 * cada comprobante.
 *
 * Cada NC se muestra por lo que todavía tiene a favor (su total menos lo
 * imputado) y cada factura por lo que le queda debiendo una vez descontados
 * pagos, NC y saldo a favor. Las imputaciones llegan resueltas en `credit`:
 * desde TKT-586 son filas de `credit_note_applications`, no un reparto
 * derivado de `original_invoice_id`.
 *
 * Cada fila conserva los importes en la moneda de su comprobante —es lo que dice
 * el papel— y agrega el equivalente en pesos. Los totales suman siempre esos
 * equivalentes: un proveedor con facturas en dólares y en pesos daba un "Total
 * adeudado" sin sentido, porque se sumaban los importes crudos.
 */
export function buildSupplierAccountRows(
  vouchers: SupplierVoucherInput[],
  paidByInvoice: Map<string, number>,
  credit: SupplierAccountCredit = {}
): { rows: SupplierVoucherRow[]; totals: SupplierVoucherTotals } {
  const byId = new Map(vouchers.map((v) => [v.id, v]));
  const toBase = (amount: number, currency: string, rate: number) =>
    convertAmount({ amount, from: currency, to: BASE_CURRENCY, rate });
  const isActiveCreditNote = (v: SupplierVoucherInput) =>
    isCreditNoteVoucherType(v.voucher_type) &&
    (ACTIVE_CREDIT_NOTE_STATUSES as readonly string[]).includes(v.status);

  const rows: SupplierVoucherRow[] = vouchers.map((voucher) => {
    // Un comprobante sin moneda es anterior a tsk-576: era pesos por definición.
    const currency = voucher.currency ?? BASE_CURRENCY;
    const exchange_rate = voucher.exchange_rate ?? 1;
    const v = { ...voucher, currency, exchange_rate };

    if (isCreditNoteVoucherType(v.voucher_type)) {
      // La NC no se paga: se aplica. Su "saldo" es el crédito todavía a favor,
      // en negativo, y es 0 cuando quedó íntegramente imputada.
      const applied = credit.appliedByNote?.get(v.id) ?? 0;
      const unapplied = isActiveCreditNote(v)
        ? Math.max(0, round2(v.total - applied))
        : 0;
      const targets = credit.targetsByNote?.get(v.id) ?? [];
      const remaining = -unapplied || 0;
      return {
        ...v,
        total_in_base: toBase(v.total, currency, exchange_rate),
        remaining_in_base: toBase(remaining, currency, exchange_rate),
        paid: 0,
        credit_applied: applied,
        on_account_applied: 0,
        // `|| 0` evita el -0, que se formatearía en pantalla como "-$0,00".
        remaining,
        // Sin imputaciones todavía, se muestra la factura de referencia del
        // comprobante: es el dato que el usuario cargó al emitir la NC.
        applies_to:
          targets.length > 0
            ? targets.join(', ')
            : v.original_invoice_id
              ? (byId.get(v.original_invoice_id)?.full_number ?? null)
              : null,
      };
    }

    const paid = round2(paidByInvoice.get(v.id) ?? 0);
    const creditNotes = credit.creditNotesByInvoice?.get(v.id) ?? 0;
    const onAccount = credit.onAccountByInvoice?.get(v.id) ?? 0;
    const remaining = computePurchaseOutstanding({
      total: v.total,
      paid,
      creditNotes,
      creditApplied: onAccount,
    });
    return {
      ...v,
      total_in_base: toBase(v.total, currency, exchange_rate),
      remaining_in_base: toBase(remaining, currency, exchange_rate),
      paid,
      credit_applied: creditNotes,
      on_account_applied: onAccount,
      remaining,
      applies_to: null,
    };
  });

  const countByStatus: Record<string, number> = {};
  let totalAmount = 0;
  let totalDebt = 0;
  let pendingCount = 0;
  let unappliedCredit = 0;
  let hasForeignCurrency = false;
  for (const r of rows) {
    countByStatus[r.status] = (countByStatus[r.status] ?? 0) + 1;
    if (r.currency !== BASE_CURRENCY) hasForeignCurrency = true;
    // Un borrador no es un comprobante emitido y uno anulado dejó de existir:
    // ninguno de los dos suma a la cuenta corriente.
    if (r.status === 'CANCELLED' || r.status === 'DRAFT') continue;
    // Los acumuladores van en pesos: `*_in_base` ya trae cada importe convertido
    // con el TC de su comprobante.
    if (isCreditNoteVoucherType(r.voucher_type)) {
      unappliedCredit += -r.remaining_in_base;
    } else {
      // "Monto facturado" = solo facturas/ND (las NC no son facturación).
      totalAmount += r.total_in_base;
      if (r.remaining > 0) pendingCount += 1;
    }
    // Total adeudado neto: el crédito de NC sin aplicar resta (remaining negativo).
    totalDebt += r.remaining_in_base;
  }

  return {
    rows,
    totals: {
      totalDebt: round2(totalDebt),
      totalAmount: round2(totalAmount),
      pendingCount,
      unappliedCredit: round2(unappliedCredit),
      countByStatus,
      total: rows.length,
      hasForeignCurrency,
    },
  };
}
