/**
 * Crédito de notas de crédito de compra: disponibilidad y consulta (TKT-586).
 *
 * Vive en `shared` porque lo necesitan proveedores (imputar a facturas) y
 * tesorería (usarlo en una OP), y los módulos no pueden importarse entre sí.
 * La aritmética pura está en `purchase-invoice-balance.ts`; acá se consulta la
 * base. Ver .planes/tkt-586-notas-credito-imputacion.md
 */

import { prisma } from '@/shared/lib/prisma';
import {
  ACTIVE_CREDIT_NOTE_STATUSES,
  CREDIT_NOTE_VOUCHER_TYPES,
  computeCreditNoteAvailable,
} from '@/shared/lib/purchase-invoice-balance';

/** Cliente Prisma o el `tx` de una transacción. */
type PrismaClientLike = typeof prisma | any;

/**
 * Imputaciones que consumen crédito.
 *
 * Una aplicación revertida deja de contar, y una que quedó colgada de una OP
 * anulada tampoco: el reverso al anular marca `reversed_at`, pero este filtro
 * evita que un dato inconsistente inmovilice crédito del proveedor.
 */
export const activeApplicationWhere = {
  reversed_at: null,
  OR: [{ payment_order_id: null }, { payment_order: { status: { not: 'CANCELLED' as const } } }],
};

export interface CreditNoteWithAvailability {
  id: string;
  full_number: string;
  issue_date: Date | string;
  currency: string;
  exchange_rate: number;
  total: number;
  applied: number;
  available: number;
  /** Factura que la NC declara corregir, si se cargó. Es referencia, no imputación. */
  original_invoice_id: string | null;
  original_invoice_full_number: string | null;
}

/**
 * Notas de crédito activas de un proveedor con cuánto crédito les queda.
 *
 * `excludePaymentOrderId` libera las reservas de una OP en edición: el crédito
 * que esa misma orden ya tenía tomado tiene que seguir apareciendo disponible,
 * igual que se hace con los cheques.
 */
export async function getSupplierCreditNotesWithAvailability(params: {
  companyId: string;
  supplierId: string;
  excludePaymentOrderId?: string;
  onlyWithCredit?: boolean;
  client?: PrismaClientLike;
}): Promise<CreditNoteWithAvailability[]> {
  const client = params.client ?? prisma;

  const notes = await client.purchase_invoices.findMany({
    where: {
      company_id: params.companyId,
      supplier_id: params.supplierId,
      voucher_type: { in: CREDIT_NOTE_VOUCHER_TYPES as unknown as string[] },
      status: { in: ACTIVE_CREDIT_NOTE_STATUSES as unknown as string[] },
    },
    select: {
      id: true,
      full_number: true,
      issue_date: true,
      currency: true,
      exchange_rate: true,
      total: true,
      original_invoice_id: true,
      original_invoice: { select: { full_number: true } },
    },
    orderBy: { issue_date: 'asc' },
  });

  if (notes.length === 0) return [];

  const applications = await client.credit_note_applications.groupBy({
    by: ['credit_note_id'],
    where: {
      credit_note_id: { in: notes.map((n: { id: string }) => n.id) },
      ...activeApplicationWhere,
      ...(params.excludePaymentOrderId
        ? { NOT: { payment_order_id: params.excludePaymentOrderId } }
        : {}),
    },
    _sum: { amount: true },
  });

  const appliedByNote = new Map<string, number>();
  for (const g of applications as { credit_note_id: string; _sum: { amount: unknown } }[]) {
    appliedByNote.set(g.credit_note_id, Number(g._sum.amount ?? 0));
  }

  const rows = notes.map((n: any) => {
    const total = Number(n.total);
    const applied = appliedByNote.get(n.id) ?? 0;
    return {
      id: n.id,
      full_number: n.full_number,
      issue_date: n.issue_date,
      currency: n.currency ?? 'ARS',
      exchange_rate: Number(n.exchange_rate ?? 1),
      total,
      applied: Math.round(applied * 100) / 100,
      available: computeCreditNoteAvailable({ total, applied }),
      original_invoice_id: n.original_invoice_id,
      original_invoice_full_number: n.original_invoice?.full_number ?? null,
    };
  });

  return params.onlyWithCredit ? rows.filter((n: CreditNoteWithAvailability) => n.available > 0) : rows;
}

/**
 * Crédito disponible de una sola NC, releído para validar dentro de una
 * transacción. Devuelve `null` si la NC no existe, no es del proveedor o no
 * está activa.
 */
export async function getCreditNoteAvailability(params: {
  creditNoteId: string;
  companyId: string;
  supplierId?: string;
  excludePaymentOrderId?: string;
  client?: PrismaClientLike;
}): Promise<{ total: number; applied: number; available: number; supplierId: string; currency: string; exchangeRate: number } | null> {
  const client = params.client ?? prisma;

  const note = await client.purchase_invoices.findFirst({
    where: { id: params.creditNoteId, company_id: params.companyId },
    select: {
      id: true,
      supplier_id: true,
      total: true,
      status: true,
      voucher_type: true,
      currency: true,
      exchange_rate: true,
    },
  });
  if (!note) return null;
  if (!(CREDIT_NOTE_VOUCHER_TYPES as readonly string[]).includes(note.voucher_type)) return null;
  if (!(ACTIVE_CREDIT_NOTE_STATUSES as readonly string[]).includes(note.status)) return null;
  if (params.supplierId && note.supplier_id !== params.supplierId) return null;

  const agg = await client.credit_note_applications.aggregate({
    where: {
      credit_note_id: note.id,
      ...activeApplicationWhere,
      ...(params.excludePaymentOrderId
        ? { NOT: { payment_order_id: params.excludePaymentOrderId } }
        : {}),
    },
    _sum: { amount: true },
  });

  const total = Number(note.total);
  const applied = Number(agg._sum.amount ?? 0);
  return {
    total,
    applied: Math.round(applied * 100) / 100,
    available: computeCreditNoteAvailable({ total, applied }),
    supplierId: note.supplier_id,
    currency: note.currency ?? 'ARS',
    exchangeRate: Number(note.exchange_rate ?? 1),
  };
}
