'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildFiltersWhere,
  buildTextFiltersWhere,
  buildDateRangeFiltersWhere,
} from '@/shared/components/common/DataTable/helpers';
import { revalidatePath } from 'next/cache';
import { updatePurchaseOrderStatus } from '@/modules/purchasing/features/purchase-orders/list/actions.server';
import { updatePurchaseInvoiceReceivingStatus } from '@/modules/purchasing/features/invoices/list/actions.server';

export async function getReceivingNotesPaginated(searchParams: DataTableSearchParams) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);

    const where: Record<string, unknown> = { company_id: companyId };

    if (state.search) {
      where.OR = [
        { full_number: { contains: state.search, mode: 'insensitive' } },
        { supplier: { business_name: { contains: state.search, mode: 'insensitive' } } },
      ];
    }

    const filtersWhere = buildFiltersWhere(state.filters, { status: 'status' });
    Object.assign(where, filtersWhere);

    const textWhere = buildTextFiltersWhere(state.filters, ['full_number']);
    Object.assign(where, textWhere);

    const supplierFilter = state.filters.supplier?.[0];
    if (supplierFilter) {
      where.supplier = { business_name: { contains: supplierFilter, mode: 'insensitive' } };
    }

    const warehouseFilter = state.filters.warehouse?.[0];
    if (warehouseFilter) {
      where.warehouse = { name: { contains: warehouseFilter, mode: 'insensitive' } };
    }

    const dateWhere = buildDateRangeFiltersWhere(state.filters, ['reception_date']);
    Object.assign(where, dateWhere);

    const [data, total] = await Promise.all([
      prisma.receiving_notes.findMany({
        where: where as any,
        include: {
          supplier: { select: { business_name: true } },
          warehouse: { select: { name: true } },
        },
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      prisma.receiving_notes.count({ where: where as any }),
    ]);

    return { data, total };
  } catch (error) {
    console.error('Error fetching receiving notes:', error);
    return { data: [], total: 0 };
  }
}

export async function getReceivingNoteFacets(): Promise<Record<string, { value: string; count: number }[]>> {
  const { companyId } = await getActionContext();
  if (!companyId) return {};

  try {
    const statusGroups = await prisma.receiving_notes.groupBy({
      by: ['status'],
      where: { company_id: companyId },
      _count: true,
    });
    return { status: statusGroups.map((g) => ({ value: g.status, count: g._count })) };
  } catch (error) {
    return {};
  }
}

export async function createReceivingNote(data: {
  supplier_id: string;
  warehouse_id: string;
  reception_date: string;
  purchase_order_id?: string;
  purchase_invoice_id?: string;
  notes?: string;
  lines: { product_id: string; description: string; quantity: number; purchase_order_line_id?: string; purchase_invoice_line_id?: string; notes?: string }[];
}) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  try {
    const lastNote = await prisma.receiving_notes.findFirst({
      where: { company_id: companyId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    const nextNumber = (lastNote?.number || 0) + 1;
    const fullNumber = `RR-${String(nextNumber).padStart(5, '0')}`;

    const note = await prisma.receiving_notes.create({
      data: {
        company_id: companyId,
        supplier_id: data.supplier_id,
        warehouse_id: data.warehouse_id,
        number: nextNumber,
        full_number: fullNumber,
        reception_date: new Date(data.reception_date),
        purchase_order_id: data.purchase_order_id || null,
        purchase_invoice_id: data.purchase_invoice_id || null,
        notes: data.notes || null,
        lines: {
          create: data.lines.map((l) => ({
            product_id: l.product_id,
            description: l.description,
            quantity: l.quantity,
            purchase_order_line_id: l.purchase_order_line_id || null,
            purchase_invoice_line_id: l.purchase_invoice_line_id || null,
            notes: l.notes || null,
          })),
        },
      },
    });

    revalidatePath('/dashboard/purchasing');
    return { data: note, error: null };
  } catch (error) {
    console.error('Error creating receiving note:', error);
    return { data: null, error: String(error) };
  }
}

/**
 * Confirmar remito de recepción — INGRESA STOCK al almacén
 *
 * Dentro de una transacción:
 * 1. Marca el remito como CONFIRMED
 * 2. Para cada línea con trackStock:
 *    - Crea StockMovement tipo PURCHASE
 *    - Upsert WarehouseStock (incrementa quantity + availableQty)
 *    - Incrementa receivedQty en la línea de OC vinculada
 * 3. Actualiza el estado de la OC si está vinculada
 */
export async function confirmReceivingNote(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  try {
    const note = await prisma.receiving_notes.findUnique({
      where: { id },
      include: {
        lines: { include: { product: { select: { track_stock: true } } } },
      },
    });

    if (!note || note.status !== 'DRAFT') {
      return { error: 'El remito no está en estado borrador' };
    }

    const operations: any[] = [
      // 1. Mark as CONFIRMED
      prisma.receiving_notes.update({
        where: { id },
        data: { status: 'CONFIRMED' },
      }),
    ];

    for (const line of note.lines) {
      if (!line.product?.track_stock) continue;

      // 2a. Create stock movement
      operations.push(
        prisma.stock_movements.create({
          data: {
            company_id: companyId,
            warehouse_id: note.warehouse_id,
            product_id: line.product_id,
            type: 'PURCHASE',
            quantity: Number(line.quantity),
            reference_type: 'receiving_note',
            reference_id: note.id,
            date: note.reception_date,
          },
        })
      );

      // 2b. Upsert warehouse stock
      operations.push(
        prisma.warehouse_stocks.upsert({
          where: {
            warehouse_id_product_id: {
              warehouse_id: note.warehouse_id,
              product_id: line.product_id,
            },
          },
          update: {
            quantity: { increment: Number(line.quantity) },
            available_qty: { increment: Number(line.quantity) },
          },
          create: {
            warehouse_id: note.warehouse_id,
            product_id: line.product_id,
            quantity: Number(line.quantity),
            available_qty: Number(line.quantity),
            reserved_qty: 0,
          },
        })
      );

      // 2c. Increment receivedQty on PO line if linked
      if (line.purchase_order_line_id) {
        operations.push(
          prisma.purchase_order_lines.update({
            where: { id: line.purchase_order_line_id },
            data: { received_qty: { increment: Number(line.quantity) } },
          })
        );
      }

      // 2d. Increment receivedQty on invoice line if linked
      if (line.purchase_invoice_line_id) {
        operations.push(
          prisma.purchase_invoice_lines.update({
            where: { id: line.purchase_invoice_line_id },
            data: { received_qty: { increment: Number(line.quantity) } },
          })
        );
      }
    }

    await prisma.$transaction(operations);

    // 3. Update PO status if linked
    if (note.purchase_order_id) {
      await updatePurchaseOrderStatus(note.purchase_order_id);
    }

    // 4. Update invoice receiving status if linked
    if (note.purchase_invoice_id) {
      await updatePurchaseInvoiceReceivingStatus(note.purchase_invoice_id);
    }

    revalidatePath('/dashboard/purchasing');
    revalidatePath('/dashboard/warehouse');
    return { error: null };
  } catch (error) {
    console.error('Error confirming receiving note:', error);
    return { error: String(error) };
  }
}

/**
 * Cancelar remito — REVIERTE stock
 */
export async function cancelReceivingNote(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) throw new Error('No company selected');

  try {
    const note = await prisma.receiving_notes.findUnique({
      where: { id },
      include: {
        lines: { include: { product: { select: { track_stock: true } } } },
      },
    });

    if (!note || note.status !== 'CONFIRMED') {
      return { error: 'Solo se pueden cancelar remitos confirmados' };
    }

    const operations: any[] = [
      prisma.receiving_notes.update({ where: { id }, data: { status: 'CANCELLED' } }),
    ];

    for (const line of note.lines) {
      if (!line.product?.track_stock) continue;

      // Reverse stock movement
      operations.push(
        prisma.stock_movements.create({
          data: {
            company_id: companyId,
            warehouse_id: note.warehouse_id,
            product_id: line.product_id,
            type: 'ADJUSTMENT',
            quantity: -Number(line.quantity),
            reference_type: 'receiving_note_cancellation',
            reference_id: note.id,
            date: new Date(),
          },
        })
      );

      // Decrement stock
      operations.push(
        prisma.warehouse_stocks.update({
          where: {
            warehouse_id_product_id: {
              warehouse_id: note.warehouse_id,
              product_id: line.product_id,
            },
          },
          data: {
            quantity: { decrement: Number(line.quantity) },
            available_qty: { decrement: Number(line.quantity) },
          },
        })
      );

      // Decrement receivedQty on PO line
      if (line.purchase_order_line_id) {
        operations.push(
          prisma.purchase_order_lines.update({
            where: { id: line.purchase_order_line_id },
            data: { received_qty: { decrement: Number(line.quantity) } },
          })
        );
      }

      // Decrement receivedQty on invoice line
      if (line.purchase_invoice_line_id) {
        operations.push(
          prisma.purchase_invoice_lines.update({
            where: { id: line.purchase_invoice_line_id },
            data: { received_qty: { decrement: Number(line.quantity) } },
          })
        );
      }
    }

    await prisma.$transaction(operations);

    if (note.purchase_order_id) {
      await updatePurchaseOrderStatus(note.purchase_order_id);
    }

    if (note.purchase_invoice_id) {
      await updatePurchaseInvoiceReceivingStatus(note.purchase_invoice_id);
    }

    revalidatePath('/dashboard/purchasing');
    revalidatePath('/dashboard/warehouse');
    return { error: null };
  } catch (error) {
    console.error('Error cancelling receiving note:', error);
    return { error: String(error) };
  }
}
