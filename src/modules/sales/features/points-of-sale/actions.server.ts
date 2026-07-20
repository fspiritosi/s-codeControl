'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { requirePermission } from '@/shared/lib/permissions';
import { SALES_VOUCHER_TYPES } from '@/modules/sales/shared/types';
import { salesPointOfSaleSchema, salesSequenceConfigSchema } from '@/modules/sales/shared/validators';
import { revalidatePath } from 'next/cache';

/** Lista los puntos de venta de la empresa con sus secuencias de numeración. */
export async function getSalesPointsOfSale() {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const rows = await prisma.sales_points_of_sale.findMany({
    where: { company_id: companyId },
    include: { sequences: true, _count: { select: { sales_invoices: true } } },
    orderBy: { number: 'asc' },
  });

  return rows.map((pos) => ({
    id: pos.id,
    number: pos.number,
    name: pos.name,
    is_active: pos.is_active,
    invoices_count: pos._count.sales_invoices,
    sequences: pos.sequences.map((s) => ({ voucher_type: s.voucher_type, next_number: s.next_number })),
  }));
}

/** Crea un punto de venta y siembra las secuencias (número inicial 1 por tipo). */
export async function createSalesPointOfSale(input: unknown) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  const parsed = salesPointOfSaleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  try {
    await requirePermission('ventas.create');

    await prisma.sales_points_of_sale.create({
      data: {
        company_id: companyId,
        number: parsed.data.number,
        name: parsed.data.name,
        is_active: parsed.data.is_active,
        sequences: {
          create: SALES_VOUCHER_TYPES.map((vt) => ({ voucher_type: vt, next_number: 1 })),
        },
      },
    });

    revalidatePath('/dashboard/sales/points-of-sale');
    return { error: null };
  } catch (error: any) {
    if (error?.code === 'P2002') return { error: 'Ya existe un punto de venta con ese número' };
    console.error('Error creando punto de venta:', error);
    return { error: error?.message || String(error) };
  }
}

export async function updateSalesPointOfSale(id: string, input: unknown) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  const parsed = salesPointOfSaleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  try {
    await requirePermission('ventas.update');

    const pos = await prisma.sales_points_of_sale.findFirst({
      where: { id, company_id: companyId },
      select: { id: true },
    });
    if (!pos) return { error: 'Punto de venta no encontrado' };

    await prisma.sales_points_of_sale.update({
      where: { id },
      data: { number: parsed.data.number, name: parsed.data.name, is_active: parsed.data.is_active },
    });

    revalidatePath('/dashboard/sales/points-of-sale');
    return { error: null };
  } catch (error: any) {
    if (error?.code === 'P2002') return { error: 'Ya existe un punto de venta con ese número' };
    console.error('Error actualizando punto de venta:', error);
    return { error: error?.message || String(error) };
  }
}

export async function deleteSalesPointOfSale(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    await requirePermission('ventas.delete');

    const pos = await prisma.sales_points_of_sale.findFirst({
      where: { id, company_id: companyId },
      select: { id: true, _count: { select: { sales_invoices: true } } },
    });
    if (!pos) return { error: 'Punto de venta no encontrado' };
    if (pos._count.sales_invoices > 0) {
      return { error: 'No se puede eliminar: tiene comprobantes emitidos. Podés desactivarlo.' };
    }

    await prisma.sales_points_of_sale.delete({ where: { id } });
    revalidatePath('/dashboard/sales/points-of-sale');
    return { error: null };
  } catch (error: any) {
    console.error('Error eliminando punto de venta:', error);
    return { error: error?.message || String(error) };
  }
}

/**
 * Actualiza el número inicial (next_number) de cada tipo de comprobante de un PV.
 * No permite bajar el número por debajo del último comprobante ya emitido de ese tipo,
 * para evitar duplicados de numeración.
 */
export async function updateSalesSequences(input: unknown) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  const parsed = salesSequenceConfigSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  try {
    await requirePermission('ventas.update');

    const pos = await prisma.sales_points_of_sale.findFirst({
      where: { id: parsed.data.point_of_sale_id, company_id: companyId },
      select: { id: true },
    });
    if (!pos) return { error: 'Punto de venta no encontrado' };

    for (const seq of parsed.data.sequences) {
      // Máximo número ya emitido para (PV, tipo).
      const lastIssued = await prisma.sales_invoices.aggregate({
        where: { point_of_sale_id: pos.id, voucher_type: seq.voucher_type, number: { not: null } },
        _max: { number: true },
      });
      const minAllowed = (lastIssued._max.number ?? 0) + 1;
      if (seq.next_number < minAllowed) {
        return {
          error: `El número inicial de ${seq.voucher_type} no puede ser menor a ${minAllowed} (ya hay comprobantes emitidos).`,
        };
      }

      await prisma.sales_number_sequences.upsert({
        where: {
          point_of_sale_id_voucher_type: { point_of_sale_id: pos.id, voucher_type: seq.voucher_type },
        },
        update: { next_number: seq.next_number },
        create: { point_of_sale_id: pos.id, voucher_type: seq.voucher_type, next_number: seq.next_number },
      });
    }

    revalidatePath('/dashboard/sales/points-of-sale');
    return { error: null };
  } catch (error: any) {
    console.error('Error actualizando secuencias:', error);
    return { error: error?.message || String(error) };
  }
}
