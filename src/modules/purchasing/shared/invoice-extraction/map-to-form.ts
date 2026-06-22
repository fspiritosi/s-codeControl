import { z } from 'zod';
import { purchaseInvoiceSchema } from '@/modules/purchasing/shared/validators';
import type { ExtractedInvoice } from './types';

/**
 * Mapeo del resultado crudo de la AI (`ExtractedInvoice`) a valores
 * pre-cargables del formulario de Factura de Compra (`purchaseInvoiceSchema`),
 * más el match de proveedor por CUIT y la lista de campos de baja confianza
 * (los que vinieron `null` o no se pudieron normalizar) para que la UI los
 * marque como "Revisar".
 *
 * Función PURA: no toca DB, no es server action. Recibe la lista de proveedores
 * ya pre-cargada (la page del form ya pre-fetcha suppliers).
 */

export type PurchaseInvoiceFormValues = z.infer<typeof purchaseInvoiceSchema>;

/** Proveedor mínimo necesario para el match por CUIT. */
export interface SupplierForMatch {
  id: string;
  business_name: string;
  tax_id: string | null;
}

export interface MappedInvoiceLine {
  description: string;
  quantity: number;
  unit_cost: number;
  vat_rate: number;
}

export interface SupplierMatchResult {
  matched: boolean;
  supplierId: string | null;
  /** CUIT extraído normalizado (solo dígitos) o null si no vino. */
  cuit: string | null;
  /** Razón social extraída (cruda) o null si no vino. */
  razonSocial: string | null;
}

export interface MapExtractedToFormResult {
  /**
   * Valores parciales para pre-llenar el form. Solo se incluyen las claves que
   * pudimos resolver con confianza; el resto se deja sin setear para que la UI
   * conserve sus defaults. `lines` siempre se incluye (puede ser `[]`).
   */
  values: Partial<PurchaseInvoiceFormValues>;
  supplierMatch: SupplierMatchResult;
  /** Nombres de campos (cabecera) que vinieron null o dudosos, para "Revisar". */
  lowConfidenceFields: string[];
}

/** Enums válidos de comprobante, tomados del schema (fuente de verdad). */
const VOUCHER_TYPES = [
  'FACTURA_A',
  'FACTURA_B',
  'FACTURA_C',
  'NOTA_CREDITO_A',
  'NOTA_CREDITO_B',
  'NOTA_CREDITO_C',
  'NOTA_DEBITO_A',
  'NOTA_DEBITO_B',
  'NOTA_DEBITO_C',
  'RECIBO',
] as const;

type VoucherType = (typeof VOUCHER_TYPES)[number];

/** Quita todo lo que no sea dígito (guiones, espacios, puntos). */
function normalizeCuit(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
}

/** `true` si el string tiene contenido real tras trim. */
function hasText(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Normaliza el texto que devuelve la AI para el tipo de comprobante a uno de
 * los enums válidos. Tolera variantes: "Factura A", "FACTURA_A", "FAC A",
 * "Nota de Crédito B", "NC B", "A" (suelto → Factura A), etc. Devuelve el enum
 * o `null` si no se puede mapear con confianza.
 */
function normalizeVoucherType(raw: string | null | undefined): VoucherType | null {
  if (!hasText(raw)) return null;

  // Si ya viene como enum exacto, atajo.
  const exact = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if ((VOUCHER_TYPES as readonly string[]).includes(exact)) {
    return exact as VoucherType;
  }

  // Normalización fonética/canónica: minúsculas, sin tildes, sin signos.
  const canon = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes (diacríticos combinados)
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Detectar la letra/clase del comprobante (A/B/C). Buscamos una letra suelta.
  const letterMatch = canon.match(/(?:^|\s)([abc])(?:\s|$)/);
  const letter = letterMatch ? letterMatch[1].toUpperCase() : null;

  const isNotaCredito = /\bnc\b/.test(canon) || /nota.*credito/.test(canon);
  const isNotaDebito = /\bnd\b/.test(canon) || /nota.*debito/.test(canon);
  const isFactura = /\bfac\b/.test(canon) || /\bfactura\b/.test(canon) || /\bfc\b/.test(canon);
  const isRecibo = /\brecibo\b/.test(canon);

  if (isRecibo) return 'RECIBO';

  if (letter) {
    if (isNotaCredito) return `NOTA_CREDITO_${letter}` as VoucherType;
    if (isNotaDebito) return `NOTA_DEBITO_${letter}` as VoucherType;
    // Factura explícita, o solo la letra suelta → asumimos Factura de ese tipo.
    if (isFactura || canon === letter.toLowerCase()) {
      return `FACTURA_${letter}` as VoucherType;
    }
    // Hay letra pero clase ambigua → no arriesgamos.
    return null;
  }

  return null;
}

/** Fecha válida si matchea YYYY-MM-DD; si no, null. */
function normalizeIsoDate(value: string | null | undefined): string | null {
  if (!hasText(value)) return null;
  const v = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

export function mapExtractedToForm(
  extracted: ExtractedInvoice,
  suppliers: SupplierForMatch[],
): MapExtractedToFormResult {
  const values: Partial<PurchaseInvoiceFormValues> = {};
  const lowConfidenceFields: string[] = [];

  // --- Match de proveedor por CUIT ---------------------------------------
  const extractedCuit = normalizeCuit(extracted.cuit);
  let supplierId: string | null = null;

  if (extractedCuit) {
    const match = suppliers.find((s) => normalizeCuit(s.tax_id) === extractedCuit);
    if (match) supplierId = match.id;
  }

  const supplierMatch: SupplierMatchResult = {
    matched: supplierId !== null,
    supplierId,
    cuit: extractedCuit,
    razonSocial: hasText(extracted.razon_social) ? extracted.razon_social.trim() : null,
  };

  if (supplierId) {
    values.supplier_id = supplierId;
  } else {
    // No se pudo resolver el proveedor: la UI ofrece crearlo / elegirlo.
    lowConfidenceFields.push('supplier_id');
  }

  // --- voucher_type -------------------------------------------------------
  const voucherType = normalizeVoucherType(extracted.voucher_type);
  if (voucherType) {
    values.voucher_type = voucherType;
  } else {
    lowConfidenceFields.push('voucher_type');
  }

  // --- point_of_sale (string max 5) --------------------------------------
  if (hasText(extracted.point_of_sale)) {
    values.point_of_sale = extracted.point_of_sale.trim().slice(0, 5);
  } else {
    lowConfidenceFields.push('point_of_sale');
  }

  // --- number (string max 20) --------------------------------------------
  if (hasText(extracted.number)) {
    values.number = extracted.number.trim().slice(0, 20);
  } else {
    lowConfidenceFields.push('number');
  }

  // --- issue_date (YYYY-MM-DD requerido) ---------------------------------
  const issueDate = normalizeIsoDate(extracted.issue_date);
  if (issueDate) {
    values.issue_date = issueDate;
  } else {
    lowConfidenceFields.push('issue_date');
  }

  // --- due_date (opcional) -----------------------------------------------
  const dueDate = normalizeIsoDate(extracted.due_date);
  if (dueDate) {
    values.due_date = dueDate;
  } else if (extracted.due_date !== null) {
    // Vino algo pero no parseó como fecha → dudoso.
    lowConfidenceFields.push('due_date');
  }

  // --- cae (opcional) -----------------------------------------------------
  if (hasText(extracted.cae)) {
    values.cae = extracted.cae.trim();
  }
  // CAE ausente no es "dudoso": muchas facturas (B/C) no lo muestran.

  // --- lines --------------------------------------------------------------
  const lines: MappedInvoiceLine[] = extracted.lines.map((line) => ({
    description: hasText(line.description) ? line.description.trim() : '',
    quantity: typeof line.quantity === 'number' && line.quantity > 0 ? line.quantity : 1,
    unit_cost: typeof line.unit_cost === 'number' && line.unit_cost >= 0 ? line.unit_cost : 0,
    vat_rate: typeof line.vat_rate === 'number' && line.vat_rate >= 0 ? line.vat_rate : 21,
  }));

  values.lines = lines;
  if (lines.length === 0) {
    lowConfidenceFields.push('lines');
  } else if (lines.some((l) => l.description === '')) {
    // Alguna línea quedó sin descripción → marcar para revisar.
    lowConfidenceFields.push('lines');
  }

  return { values, supplierMatch, lowConfidenceFields };
}
