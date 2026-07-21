'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { revalidatePath } from 'next/cache';

const REVALIDATE = '/dashboard/commercial/customers/action';

/** Servicios del cliente con sus ítems (para gestionar desde el detalle del cliente). */
export async function getCustomerServices(customerId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const services = await prisma.customer_services.findMany({
    where: { customer_id: customerId, company_id: companyId },
    include: {
      service_items: {
        include: {
          measure_unit: { select: { id: true, unit: true, simbol: true } },
          prices: { orderBy: [{ period_year: 'desc' }, { period_month: 'desc' }, { created_at: 'desc' }] },
        },
        orderBy: { item_name: 'asc' },
      },
    },
    orderBy: { created_at: 'asc' },
  });

  return services.map((s) => ({
    id: s.id,
    service_name: s.service_name,
    is_active: s.is_active ?? true,
    items: s.service_items.map((it) => {
      const enabled = it.prices.find((p) => p.is_enabled);
      return {
        id: it.id,
        item_name: it.item_name,
        item_description: it.item_description,
        item_price: enabled ? Number(enabled.price) : Number(it.item_price),
        item_measure_units: it.item_measure_units,
        unit: it.measure_unit?.simbol || it.measure_unit?.unit || '',
        is_active: it.is_active ?? true,
        prices: it.prices.map((p) => ({
          id: p.id,
          price: Number(p.price),
          period_month: p.period_month,
          period_year: p.period_year,
          is_enabled: p.is_enabled,
        })),
      };
    }),
  }));
}

/** Unidades de medida disponibles (para el select de ítems). */
export async function getMeasureUnits() {
  const units = await prisma.measure_units.findMany({ orderBy: { unit: 'asc' } });
  return units.map((u) => ({ id: u.id, unit: u.unit, simbol: u.simbol, tipo: u.tipo }));
}

async function assertCustomer(customerId: string, companyId: string) {
  const c = await prisma.customers.findFirst({ where: { id: customerId, company_id: companyId }, select: { id: true } });
  return !!c;
}

// ============================================================
// Servicios
// ============================================================

export async function createCustomerService(customerId: string, serviceName: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };
  if (!serviceName?.trim()) return { error: 'El nombre del servicio es requerido' };

  try {
    if (!(await assertCustomer(customerId, companyId))) return { error: 'Cliente no encontrado' };
    await prisma.customer_services.create({
      data: { customer_id: customerId, company_id: companyId, service_name: serviceName.trim(), is_active: true },
    });
    revalidatePath(REVALIDATE);
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

export async function updateCustomerService(id: string, data: { service_name?: string; is_active?: boolean }) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    const svc = await prisma.customer_services.findFirst({ where: { id, company_id: companyId }, select: { id: true } });
    if (!svc) return { error: 'Servicio no encontrado' };
    await prisma.customer_services.update({
      where: { id },
      data: {
        ...(data.service_name !== undefined ? { service_name: data.service_name.trim() } : {}),
        ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
      },
    });
    revalidatePath(REVALIDATE);
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

/** Baja lógica del servicio (y sus ítems) — no se borra físico para no romper partes diarios/costos. */
export async function deactivateCustomerService(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    const svc = await prisma.customer_services.findFirst({ where: { id, company_id: companyId }, select: { id: true } });
    if (!svc) return { error: 'Servicio no encontrado' };
    await prisma.$transaction([
      prisma.service_items.updateMany({ where: { customer_service_id: id }, data: { is_active: false } }),
      prisma.customer_services.update({ where: { id }, data: { is_active: false } }),
    ]);
    revalidatePath(REVALIDATE);
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

// ============================================================
// Ítems de servicio
// ============================================================

type ServiceItemInput = {
  item_name: string;
  item_description?: string;
  item_price: number;
  item_measure_units: number;
  period_month?: number | null;
  period_year?: number | null;
};

export async function createServiceItem(serviceId: string, input: ServiceItemInput) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };
  if (!input.item_name?.trim()) return { error: 'El nombre del ítem es requerido' };
  if (!input.item_measure_units) return { error: 'Seleccioná una unidad de medida' };

  try {
    const svc = await prisma.customer_services.findFirst({
      where: { id: serviceId, company_id: companyId },
      select: { id: true },
    });
    if (!svc) return { error: 'Servicio no encontrado' };

    const price = Number(input.item_price) || 0;
    // Crea el ítem y su primer precio habilitado (mismo valor en item_price para el flujo legacy).
    await prisma.service_items.create({
      data: {
        company_id: companyId,
        customer_service_id: serviceId,
        item_name: input.item_name.trim(),
        item_description: input.item_description?.trim() || input.item_name.trim(),
        item_price: price,
        item_measure_units: Number(input.item_measure_units),
        is_active: true,
        prices: {
          create: {
            price,
            period_month: input.period_month ?? null,
            period_year: input.period_year ?? null,
            is_enabled: true,
          },
        },
      },
    });
    revalidatePath(REVALIDATE);
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

/** Actualiza SOLO la metadata del ítem (nombre/descripción/unidad). El precio se maneja aparte. */
export async function updateServiceItem(
  id: string,
  input: Partial<Pick<ServiceItemInput, 'item_name' | 'item_description' | 'item_measure_units'>>
) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    const item = await prisma.service_items.findFirst({ where: { id, company_id: companyId }, select: { id: true } });
    if (!item) return { error: 'Ítem no encontrado' };
    await prisma.service_items.update({
      where: { id },
      data: {
        ...(input.item_name !== undefined ? { item_name: input.item_name.trim() } : {}),
        ...(input.item_description !== undefined ? { item_description: input.item_description.trim() } : {}),
        ...(input.item_measure_units !== undefined ? { item_measure_units: Number(input.item_measure_units) } : {}),
      },
    });
    revalidatePath(REVALIDATE);
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

// ============================================================
// Precios del ítem (por período mes/año) — tsk-511
// ============================================================

async function assertItem(itemId: string, companyId: string) {
  const item = await prisma.service_items.findFirst({ where: { id: itemId, company_id: companyId }, select: { id: true } });
  return !!item;
}

/** Sincroniza service_items.item_price con el precio habilitado (para partes diarios/costos). */
async function syncEnabledPrice(itemId: string) {
  const enabled = await prisma.service_item_prices.findFirst({
    where: { service_item_id: itemId, is_enabled: true },
    select: { price: true },
  });
  if (enabled) {
    await prisma.service_items.update({ where: { id: itemId }, data: { item_price: Number(enabled.price) } });
  }
}

export async function addServiceItemPrice(
  itemId: string,
  input: { price: number; period_month?: number | null; period_year?: number | null; enable?: boolean }
) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    if (!(await assertItem(itemId, companyId))) return { error: 'Ítem no encontrado' };

    const existingCount = await prisma.service_item_prices.count({ where: { service_item_id: itemId } });
    const shouldEnable = input.enable || existingCount === 0;

    await prisma.$transaction(async (tx) => {
      if (shouldEnable) {
        await tx.service_item_prices.updateMany({ where: { service_item_id: itemId }, data: { is_enabled: false } });
      }
      await tx.service_item_prices.create({
        data: {
          service_item_id: itemId,
          price: Number(input.price) || 0,
          period_month: input.period_month ?? null,
          period_year: input.period_year ?? null,
          is_enabled: shouldEnable,
        },
      });
    });
    if (shouldEnable) await syncEnabledPrice(itemId);
    revalidatePath(REVALIDATE);
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

/** Marca un precio como el habilitado (deshabilita los demás del ítem) y sincroniza item_price. */
export async function setEnabledServiceItemPrice(priceId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    const price = await prisma.service_item_prices.findFirst({
      where: { id: priceId, service_item: { company_id: companyId } },
      select: { id: true, service_item_id: true },
    });
    if (!price) return { error: 'Precio no encontrado' };

    await prisma.$transaction([
      prisma.service_item_prices.updateMany({
        where: { service_item_id: price.service_item_id },
        data: { is_enabled: false },
      }),
      prisma.service_item_prices.update({ where: { id: priceId }, data: { is_enabled: true } }),
    ]);
    await syncEnabledPrice(price.service_item_id);
    revalidatePath(REVALIDATE);
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

export async function deleteServiceItemPrice(priceId: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    const price = await prisma.service_item_prices.findFirst({
      where: { id: priceId, service_item: { company_id: companyId } },
      select: { id: true, is_enabled: true },
    });
    if (!price) return { error: 'Precio no encontrado' };
    if (price.is_enabled) return { error: 'No se puede eliminar el precio habilitado. Habilitá otro primero.' };

    await prisma.service_item_prices.delete({ where: { id: priceId } });
    revalidatePath(REVALIDATE);
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

/** Baja lógica del ítem (no físico, para no romper partes diarios/costos que lo referencian). */
export async function deactivateServiceItem(id: string) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No hay empresa seleccionada' };

  try {
    const item = await prisma.service_items.findFirst({ where: { id, company_id: companyId }, select: { id: true } });
    if (!item) return { error: 'Ítem no encontrado' };
    await prisma.service_items.update({ where: { id }, data: { is_active: false } });
    revalidatePath(REVALIDATE);
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}
