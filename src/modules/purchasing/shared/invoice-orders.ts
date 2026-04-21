/**
 * Helpers puros para derivar la relación factura↔OC desde las líneas.
 *
 * El schema no cambia: las OCs asociadas a una factura se obtienen agrupando
 * `invoice.lines` por `purchase_order_line.order_id`. Estos helpers son
 * utilitarios compartidos entre el formulario, las actions y los detalles.
 */

export type InvoiceLineForDerivation = {
  purchase_order_line_id?: string | null;
  order_id?: string | null;
};

export function deriveOrderIdsFromLines(
  lines: InvoiceLineForDerivation[],
  poLineToOrderId?: Map<string, string>
): string[] {
  const set = new Set<string>();
  for (const line of lines) {
    if (line.order_id) {
      set.add(line.order_id);
      continue;
    }
    const polId = line.purchase_order_line_id;
    if (polId && poLineToOrderId?.has(polId)) {
      set.add(poLineToOrderId.get(polId)!);
    }
  }
  return Array.from(set);
}

export function pickPrimaryOrderId(orderIds: string[]): string | null {
  if (orderIds.length === 1) return orderIds[0];
  return null;
}
