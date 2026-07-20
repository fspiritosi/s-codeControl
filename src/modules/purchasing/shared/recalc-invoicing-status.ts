import { prisma } from '@/shared/lib/prisma';

/**
 * Recálculo unificado del estado de facturación (invoicing_status) de una OC.
 *
 * Fuente única de verdad para NOT_INVOICED / PARTIALLY_INVOICED / FULLY_INVOICED.
 * Reemplaza a las dos implementaciones que existían (detalle de OC y alta de
 * facturas), que diferían en criterio y dejaban OCs con estado incorrecto.
 *
 * Criterios (fix tsk-478):
 *  - Solo cuentan facturas CONFIRMED (las DRAFT no mueven el estado — decisión de negocio).
 *  - Considera el vínculo por CABECERA (purchase_order_id) Y por LÍNEA
 *    (purchase_invoice_lines.purchase_order_line_id). Antes el confirm solo miraba
 *    las líneas, por lo que una factura ligada solo por cabecera dejaba la OC en NOT_INVOICED.
 *  - La cantidad facturada por línea se calcula desde la FUENTE (líneas de facturas
 *    confirmadas), no del contador mutable `invoiced_qty`, que se desincroniza al
 *    editar/borrar facturas confirmadas.
 *  - FULLY_INVOICED es alcanzable por monto aunque no haya vínculo por línea, así una
 *    factura por cabecera que cubre el total marca la OC como Totalmente Facturada.
 *  - Tolerancia EPS para evitar que diferencias de centavos por redondeo bloqueen FULLY.
 */
const EPS = 0.01;

export type InvoicingStatus = 'NOT_INVOICED' | 'PARTIALLY_INVOICED' | 'FULLY_INVOICED';

export async function recalcInvoicingStatus(orderId: string): Promise<InvoicingStatus | null> {
  const [order, lines, invoicedAgg, confirmedInvoiceLines] = await Promise.all([
    prisma.purchase_orders.findUnique({ where: { id: orderId }, select: { total: true } }),
    prisma.purchase_order_lines.findMany({
      where: { order_id: orderId },
      select: { id: true, quantity: true, invoiced_qty: true },
    }),
    prisma.purchase_invoices.aggregate({
      where: {
        status: 'CONFIRMED',
        OR: [
          { purchase_order_id: orderId },
          { lines: { some: { purchase_order_line: { order_id: orderId } } } },
        ],
      },
      _sum: { total: true },
    }),
    prisma.purchase_invoice_lines.findMany({
      where: {
        purchase_order_line: { order_id: orderId },
        invoice: { status: 'CONFIRMED' },
      },
      select: { purchase_order_line_id: true, quantity: true },
    }),
  ]);

  if (!order) return null;

  const orderTotal = Number(order.total ?? 0);
  const invoicedTotal = Number(invoicedAgg._sum.total ?? 0);

  // Cantidad facturada (confirmada) acumulada por línea de OC, desde la fuente.
  const qtyByLine = new Map<string, number>();
  for (const il of confirmedInvoiceLines) {
    if (!il.purchase_order_line_id) continue;
    qtyByLine.set(
      il.purchase_order_line_id,
      (qtyByLine.get(il.purchase_order_line_id) ?? 0) + Number(il.quantity)
    );
  }

  const hasLineLinks = qtyByLine.size > 0;
  const qtyFullyInvoiced =
    lines.length > 0 && lines.every((l) => (qtyByLine.get(l.id) ?? 0) >= Number(l.quantity) - EPS);
  const someQtyInvoiced = [...qtyByLine.values()].some((q) => q > 0);
  const amountFullyCovered = orderTotal > 0 && invoicedTotal >= orderTotal - EPS;

  // Si hay vínculo por línea, exigimos cantidades completas además del monto;
  // si el vínculo es solo por cabecera, el monto cubierto alcanza para FULLY.
  const newStatus: InvoicingStatus =
    amountFullyCovered && (!hasLineLinks || qtyFullyInvoiced)
      ? 'FULLY_INVOICED'
      : invoicedTotal > 0 || someQtyInvoiced
        ? 'PARTIALLY_INVOICED'
        : 'NOT_INVOICED';

  // Reconciliar el contador invoiced_qty por línea desde la fuente (clamp a [0, cantidad]),
  // para que no quede inflado al borrar/editar facturas confirmadas (se muestra en la UI).
  const lineOps = [];
  for (const l of lines) {
    const sourceQty = qtyByLine.get(l.id) ?? 0;
    const clamped = Math.min(Math.max(0, sourceQty), Number(l.quantity));
    if (Math.abs(clamped - Number(l.invoiced_qty)) > EPS) {
      lineOps.push(
        prisma.purchase_order_lines.update({ where: { id: l.id }, data: { invoiced_qty: clamped } })
      );
    }
  }

  await prisma.$transaction([
    ...lineOps,
    prisma.purchase_orders.update({ where: { id: orderId }, data: { invoicing_status: newStatus } }),
  ]);

  return newStatus;
}

/** Recalcula el estado de facturación de varias OCs. */
export async function recalcInvoicingStatusMany(orderIds: Iterable<string>): Promise<void> {
  const unique = Array.from(new Set(orderIds));
  await Promise.all(unique.map((id) => recalcInvoicingStatus(id)));
}
