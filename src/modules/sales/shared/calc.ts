// Cálculo puro de totales de una factura de venta (tsk-479).
// Mismo criterio que facturas de compra: descuento por línea, descuento global
// proporcional al IVA, percepciones (otros impuestos) y otros cargos.

export interface SalesLineInput {
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  discount_type?: 'PERCENTAGE' | 'FIXED' | null;
  discount_value?: number | null;
}

export interface SalesPerceptionInput {
  tax_type_id: string;
  base_amount: number;
  rate: number;
  amount: number;
  notes?: string;
}

export interface SalesOtherChargeInput {
  description: string;
  amount: number;
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const r2 = (n: number) => Math.round(n * 100) / 100;

export function computeSalesInvoiceTotals(input: {
  lines: SalesLineInput[];
  global_discount_type?: 'PERCENTAGE' | 'FIXED' | null;
  global_discount_value?: number | null;
  perceptions?: SalesPerceptionInput[];
  other_charges?: SalesOtherChargeInput[];
}) {
  // Paso 1: líneas con descuento por línea
  const lines = input.lines.map((line) => {
    const subtotalBruto = line.quantity * line.unit_price;
    const discountType = line.discount_type || null;
    const discountValue = line.discount_value ?? 0;
    const lineDiscount =
      discountType === 'PERCENTAGE'
        ? (subtotalBruto * discountValue) / 100
        : discountType === 'FIXED'
          ? discountValue
          : 0;
    const subtotal = r3(subtotalBruto - lineDiscount);
    const vatAmount = r3(subtotal * (line.vat_rate / 100));
    return {
      product_id: line.product_id || null,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      vat_rate: line.vat_rate,
      discount_type: discountType,
      discount_value: discountType ? discountValue : null,
      discount_amount: r3(lineDiscount),
      vat_amount: vatAmount,
      subtotal,
      total: r3(subtotal + vatAmount),
    };
  });

  const subtotalAfterLines = lines.reduce((s, l) => s + l.subtotal, 0);
  const lineDiscountsTotal = lines.reduce((s, l) => s + l.discount_amount, 0);

  // Paso 2: descuento global sobre subtotal neto
  const globalType = input.global_discount_type || null;
  const globalValue = input.global_discount_value ?? 0;
  const globalDiscountAmount =
    globalType === 'PERCENTAGE'
      ? r2((subtotalAfterLines * globalValue) / 100)
      : globalType === 'FIXED'
        ? r2(globalValue)
        : 0;

  // Paso 3: IVA proporcional al descuento global
  let totalVat = 0;
  if (globalDiscountAmount > 0 && subtotalAfterLines > 0) {
    for (const l of lines) {
      const proportion = l.subtotal / subtotalAfterLines;
      const lineGlobalShare = globalDiscountAmount * proportion;
      const netAfterGlobal = l.subtotal - lineGlobalShare;
      totalVat += netAfterGlobal * (l.vat_rate / 100);
    }
    totalVat = r2(totalVat);
  } else {
    totalVat = r2(lines.reduce((s, l) => s + l.vat_amount, 0));
  }

  const invoiceSubtotal = r2(subtotalAfterLines - globalDiscountAmount);
  const totalDiscountAmount = r2(lineDiscountsTotal + globalDiscountAmount);

  // Percepciones (otros impuestos)
  const perceptions = (input.perceptions ?? []).map((p) => ({
    tax_type_id: p.tax_type_id,
    base_amount: r3(p.base_amount),
    rate: p.rate,
    amount: r3(p.amount),
    notes: p.notes?.trim() || null,
  }));
  const otherTaxes = r2(perceptions.reduce((s, p) => s + p.amount, 0));

  // Otros cargos (suman al total, no afectan IVA)
  const otherChargesItems = (input.other_charges ?? []).map((oc) => ({
    description: oc.description,
    amount: r3(oc.amount),
  }));
  const otherChargesTotal = r2(otherChargesItems.reduce((s, oc) => s + oc.amount, 0));

  const total = r2(invoiceSubtotal + totalVat + otherTaxes + otherChargesTotal);

  return {
    lines,
    perceptions,
    otherChargesItems,
    subtotal: invoiceSubtotal,
    vat_amount: totalVat,
    other_taxes: otherTaxes,
    other_charges: otherChargesTotal,
    discount_amount: totalDiscountAmount,
    global_discount_amount: globalDiscountAmount,
    total,
  };
}
