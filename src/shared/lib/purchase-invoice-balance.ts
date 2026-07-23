/**
 * Tipos de comprobante de compra y aritmética de saldos.
 *
 * Vive en `shared` y no en `modules/purchasing` porque tesorería y proveedores
 * también lo necesitan, y los módulos no pueden importarse entre sí.
 * Es puro (sin Prisma): se usa desde componentes cliente y es testeable aislado.
 * Lo que consulta la base está en `purchase-invoice-status.ts`.
 */

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
 * Estado de pago que le corresponde a una factura de compra.
 *
 *   cobertura = pagos imputados + NC aplicadas
 *   cargado   = total de la factura
 *
 * Las ND no se suman al cargado: en compras se pagan como comprobante propio,
 * así que sumarlas acá las contaría dos veces.
 */
export function derivePurchaseInvoiceStatus(input: {
  total: number;
  paid: number;
  creditNotes: number;
}): PurchaseInvoicePaidStatus {
  const covered = input.paid + input.creditNotes;
  if (input.total > 0 && covered >= input.total - BALANCE_EPS) return 'PAID';
  return covered > 0 ? 'PARTIAL_PAID' : 'CONFIRMED';
}

/**
 * Saldo pendiente de una factura de compra.
 * pendiente = total - pagos imputados - NC aplicadas (nunca negativo).
 */
export function computePurchaseOutstanding(input: {
  total: number;
  paid: number;
  creditNotes: number;
}): number {
  const pending = round2(input.total - input.paid - input.creditNotes);
  return pending < BALANCE_EPS ? 0 : pending;
}

/**
 * Reparte, sobre una misma factura original, cuánto de cada NC llegó a aplicarse.
 *
 * Una NC puede exceder el saldo que le quedaba a la factura (o apuntar a una ya
 * pagada): ese excedente no descuenta nada y queda como crédito a favor. El
 * reparto es greedy en el orden recibido — se espera cronológico — para que la
 * NC más vieja consuma primero.
 */
export function allocateCreditNotes(
  applicableAmount: number,
  creditNotes: { id: string; total: number }[]
): Map<string, number> {
  const applied = new Map<string, number>();
  let available = Math.max(0, applicableAmount);
  for (const nc of creditNotes) {
    const used = Math.min(nc.total, available);
    applied.set(nc.id, round2(used));
    available = round2(available - used);
  }
  return applied;
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
}

export interface SupplierVoucherRow extends Omit<SupplierVoucherInput, 'total'> {
  total: number;
  paid: number;
  credit_applied: number;
  /** Positivo = deuda. Negativo = crédito de NC todavía sin imputar. */
  remaining: number;
  /** Solo en NC: número de la factura que corrige. */
  applies_to: string | null;
}

export interface SupplierVoucherTotals {
  totalDebt: number;
  totalAmount: number;
  pendingCount: number;
  unappliedCredit: number;
  countByStatus: Record<string, number>;
  total: number;
}

/**
 * Arma las filas de la cuenta corriente de un proveedor con el saldo real de
 * cada comprobante.
 *
 * Antes cada NC se listaba como una fila suelta con saldo negativo y la factura
 * que corregía mostraba su saldo bruto: el neto cerraba pero por comprobante
 * engañaba. Acá la NC se imputa contra su factura original y solo queda como
 * crédito a favor lo que exceda el saldo de esa factura.
 */
export function buildSupplierAccountRows(
  vouchers: SupplierVoucherInput[],
  paidByInvoice: Map<string, number>
): { rows: SupplierVoucherRow[]; totals: SupplierVoucherTotals } {
  const byId = new Map(vouchers.map((v) => [v.id, v]));
  const isActiveCreditNote = (v: SupplierVoucherInput) =>
    isCreditNoteVoucherType(v.voucher_type) &&
    (ACTIVE_CREDIT_NOTE_STATUSES as readonly string[]).includes(v.status);

  // Agrupar las NC activas por la factura que corrigen, en orden cronológico:
  // la más vieja consume primero el saldo disponible.
  const creditNotesByOriginal = new Map<string, { id: string; total: number }[]>();
  for (const v of [...vouchers].sort(
    (a, b) => new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime()
  )) {
    if (!isActiveCreditNote(v) || !v.original_invoice_id) continue;
    const list = creditNotesByOriginal.get(v.original_invoice_id) ?? [];
    list.push({ id: v.id, total: v.total });
    creditNotesByOriginal.set(v.original_invoice_id, list);
  }

  // Repartir, factura por factura, cuánto de cada NC llegó a aplicarse.
  const creditAppliedByNote = new Map<string, number>();
  const creditAppliedByInvoice = new Map<string, number>();
  for (const [originalId, notes] of creditNotesByOriginal) {
    const original = byId.get(originalId);
    // Si la factura corregida no existe o está anulada, la NC queda a favor.
    if (!original || original.status === 'CANCELLED') continue;
    const applicable = original.total - (paidByInvoice.get(originalId) ?? 0);
    const allocation = allocateCreditNotes(applicable, notes);
    let appliedTotal = 0;
    for (const [noteId, amount] of allocation) {
      creditAppliedByNote.set(noteId, amount);
      appliedTotal += amount;
    }
    creditAppliedByInvoice.set(originalId, round2(appliedTotal));
  }

  const rows: SupplierVoucherRow[] = vouchers.map((v) => {
    if (isCreditNoteVoucherType(v.voucher_type)) {
      // La NC no se paga: se aplica. Su "saldo" es el crédito todavía a favor,
      // en negativo, y es 0 cuando quedó íntegramente imputada.
      const applied = creditAppliedByNote.get(v.id) ?? 0;
      const unapplied = isActiveCreditNote(v) ? round2(v.total - applied) : 0;
      return {
        ...v,
        paid: 0,
        credit_applied: applied,
        // `|| 0` evita el -0, que se formatearía en pantalla como "-$0,00".
        remaining: -unapplied || 0,
        applies_to: v.original_invoice_id
          ? (byId.get(v.original_invoice_id)?.full_number ?? null)
          : null,
      };
    }

    const paid = round2(paidByInvoice.get(v.id) ?? 0);
    const credit = creditAppliedByInvoice.get(v.id) ?? 0;
    return {
      ...v,
      paid,
      credit_applied: credit,
      remaining: computePurchaseOutstanding({ total: v.total, paid, creditNotes: credit }),
      applies_to: null,
    };
  });

  const countByStatus: Record<string, number> = {};
  let totalAmount = 0;
  let totalDebt = 0;
  let pendingCount = 0;
  let unappliedCredit = 0;
  for (const r of rows) {
    countByStatus[r.status] = (countByStatus[r.status] ?? 0) + 1;
    // Un borrador no es un comprobante emitido y uno anulado dejó de existir:
    // ninguno de los dos suma a la cuenta corriente.
    if (r.status === 'CANCELLED' || r.status === 'DRAFT') continue;
    if (isCreditNoteVoucherType(r.voucher_type)) {
      unappliedCredit += -r.remaining;
    } else {
      // "Monto facturado" = solo facturas/ND (las NC no son facturación).
      totalAmount += r.total;
      if (r.remaining > 0) pendingCount += 1;
    }
    // Total adeudado neto: el crédito de NC sin aplicar resta (remaining negativo).
    totalDebt += r.remaining;
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
    },
  };
}
