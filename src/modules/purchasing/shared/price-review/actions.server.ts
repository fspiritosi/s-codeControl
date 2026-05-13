'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { revalidatePath } from 'next/cache';

export interface PriceDifference {
  lineId: string;
  productId: string;
  productName: string;
  productSku?: string;
  description: string;
  currentPrice: number;
  newPrice: number;
  difference: number;
  diffPercent: number;
}

const PRICE_TOLERANCE = 0.01;

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function computeLineTotals(quantity: number, unitCost: number, vatRate: number) {
  const subtotal = round3(quantity * unitCost);
  const vatAmount = round3(subtotal * (vatRate / 100));
  const total = round3(subtotal + vatAmount);
  return { subtotal, vatAmount, total };
}

export async function reviewPurchaseOrderPrices(
  orderId: string
): Promise<{ differences: PriceDifference[]; error?: string }> {
  const { companyId } = await getActionContext();
  if (!companyId) return { differences: [], error: 'No company selected' };

  try {
    const order = await prisma.purchase_orders.findFirst({
      where: { id: orderId, company_id: companyId },
      select: {
        id: true,
        lines: {
          select: {
            id: true,
            unit_cost: true,
            description: true,
            product_id: true,
            product: { select: { id: true, code: true, name: true, cost_price: true } },
          },
        },
      },
    });

    if (!order) return { differences: [], error: 'Orden no encontrada' };

    const differences: PriceDifference[] = [];
    for (const line of order.lines) {
      if (!line.product || !line.product_id) continue;
      const currentPrice = Number(line.unit_cost);
      const newPrice = Number(line.product.cost_price);
      const diff = round3(newPrice - currentPrice);
      if (Math.abs(diff) < PRICE_TOLERANCE) continue;
      const diffPercent = currentPrice === 0 ? 100 : round3((diff / currentPrice) * 100);
      differences.push({
        lineId: line.id,
        productId: line.product.id,
        productName: line.product.name,
        productSku: line.product.code,
        description: line.description,
        currentPrice,
        newPrice,
        difference: diff,
        diffPercent,
      });
    }

    return { differences };
  } catch (error) {
    console.error('Error reviewing PO prices:', error);
    return { differences: [], error: String(error) };
  }
}

export async function reviewPurchaseInvoicePrices(
  invoiceId: string
): Promise<{ differences: PriceDifference[]; error?: string }> {
  const { companyId } = await getActionContext();
  if (!companyId) return { differences: [], error: 'No company selected' };

  try {
    const invoice = await prisma.purchase_invoices.findFirst({
      where: { id: invoiceId, company_id: companyId },
      select: {
        id: true,
        lines: {
          select: {
            id: true,
            unit_cost: true,
            description: true,
            product_id: true,
            product: { select: { id: true, code: true, name: true, cost_price: true } },
          },
        },
      },
    });

    if (!invoice) return { differences: [], error: 'Factura no encontrada' };

    const differences: PriceDifference[] = [];
    for (const line of invoice.lines) {
      if (!line.product || !line.product_id) continue;
      const currentPrice = Number(line.unit_cost);
      const newPrice = Number(line.product.cost_price);
      const diff = round3(newPrice - currentPrice);
      if (Math.abs(diff) < PRICE_TOLERANCE) continue;
      const diffPercent = currentPrice === 0 ? 100 : round3((diff / currentPrice) * 100);
      differences.push({
        lineId: line.id,
        productId: line.product.id,
        productName: line.product.name,
        productSku: line.product.code,
        description: line.description,
        currentPrice,
        newPrice,
        difference: diff,
        diffPercent,
      });
    }

    return { differences };
  } catch (error) {
    console.error('Error reviewing invoice prices:', error);
    return { differences: [], error: String(error) };
  }
}

export async function applyPurchaseOrderPriceUpdates(
  orderId: string,
  lineIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const { companyId } = await getActionContext();
  if (!companyId) return { ok: false, error: 'No company selected' };
  if (lineIds.length === 0) return { ok: false, error: 'Sin líneas seleccionadas' };

  try {
    const order = await prisma.purchase_orders.findFirst({
      where: { id: orderId, company_id: companyId },
      select: { id: true, status: true },
    });
    if (!order) return { ok: false, error: 'Orden no encontrada' };
    if (order.status !== 'DRAFT' && order.status !== 'PENDING_APPROVAL') {
      return { ok: false, error: 'La orden no está en un estado editable' };
    }

    const lines = await prisma.purchase_order_lines.findMany({
      where: { order_id: orderId },
      select: {
        id: true,
        quantity: true,
        unit_cost: true,
        vat_rate: true,
        product: { select: { cost_price: true } },
      },
    });

    const targetIds = new Set(lineIds);

    await prisma.$transaction(async (tx) => {
      let subtotalAcc = 0;
      let vatAcc = 0;
      let totalAcc = 0;

      for (const line of lines) {
        const quantity = Number(line.quantity);
        const vatRate = Number(line.vat_rate);
        let unitCost = Number(line.unit_cost);

        if (targetIds.has(line.id) && line.product) {
          unitCost = Number(line.product.cost_price);
          const totals = computeLineTotals(quantity, unitCost, vatRate);
          await tx.purchase_order_lines.update({
            where: { id: line.id },
            data: {
              unit_cost: unitCost,
              subtotal: totals.subtotal,
              vat_amount: totals.vatAmount,
              total: totals.total,
            },
          });
          subtotalAcc += totals.subtotal;
          vatAcc += totals.vatAmount;
          totalAcc += totals.total;
        } else {
          const totals = computeLineTotals(quantity, unitCost, vatRate);
          subtotalAcc += totals.subtotal;
          vatAcc += totals.vatAmount;
          totalAcc += totals.total;
        }
      }

      await tx.purchase_orders.update({
        where: { id: orderId },
        data: {
          subtotal: round3(subtotalAcc),
          vat_amount: round3(vatAcc),
          total: round3(totalAcc),
        },
      });
    });

    revalidatePath('/dashboard/purchasing');
    revalidatePath(`/dashboard/purchasing/orders/${orderId}`);
    return { ok: true };
  } catch (error) {
    console.error('Error applying PO price updates:', error);
    return { ok: false, error: String(error) };
  }
}

export async function applyPurchaseInvoicePriceUpdates(
  invoiceId: string,
  lineIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const { companyId } = await getActionContext();
  if (!companyId) return { ok: false, error: 'No company selected' };
  if (lineIds.length === 0) return { ok: false, error: 'Sin líneas seleccionadas' };

  try {
    const invoice = await prisma.purchase_invoices.findFirst({
      where: { id: invoiceId, company_id: companyId },
      select: { id: true, status: true, other_taxes: true },
    });
    if (!invoice) return { ok: false, error: 'Factura no encontrada' };
    if (invoice.status !== 'DRAFT') {
      return { ok: false, error: 'La factura no está en estado editable' };
    }

    const lines = await prisma.purchase_invoice_lines.findMany({
      where: { invoice_id: invoiceId },
      select: {
        id: true,
        quantity: true,
        unit_cost: true,
        vat_rate: true,
        product: { select: { cost_price: true } },
      },
    });

    const targetIds = new Set(lineIds);
    const otherTaxes = Number(invoice.other_taxes || 0);

    await prisma.$transaction(async (tx) => {
      let subtotalAcc = 0;
      let vatAcc = 0;
      let totalAcc = 0;

      for (const line of lines) {
        const quantity = Number(line.quantity);
        const vatRate = Number(line.vat_rate);
        let unitCost = Number(line.unit_cost);

        if (targetIds.has(line.id) && line.product) {
          unitCost = Number(line.product.cost_price);
          const totals = computeLineTotals(quantity, unitCost, vatRate);
          await tx.purchase_invoice_lines.update({
            where: { id: line.id },
            data: {
              unit_cost: unitCost,
              subtotal: totals.subtotal,
              vat_amount: totals.vatAmount,
              total: totals.total,
            },
          });
          subtotalAcc += totals.subtotal;
          vatAcc += totals.vatAmount;
          totalAcc += totals.total;
        } else {
          const totals = computeLineTotals(quantity, unitCost, vatRate);
          subtotalAcc += totals.subtotal;
          vatAcc += totals.vatAmount;
          totalAcc += totals.total;
        }
      }

      await tx.purchase_invoices.update({
        where: { id: invoiceId },
        data: {
          subtotal: round3(subtotalAcc),
          vat_amount: round3(vatAcc),
          total: round3(totalAcc + otherTaxes),
        },
      });
    });

    revalidatePath('/dashboard/purchasing');
    revalidatePath(`/dashboard/purchasing/invoices/${invoiceId}`);
    return { ok: true };
  } catch (error) {
    console.error('Error applying invoice price updates:', error);
    return { ok: false, error: String(error) };
  }
}
