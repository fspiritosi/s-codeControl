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
        include: { measure_unit: { select: { id: true, unit: true, simbol: true } } },
        orderBy: { item_name: 'asc' },
      },
    },
    orderBy: { created_at: 'asc' },
  });

  return services.map((s) => ({
    id: s.id,
    service_name: s.service_name,
    is_active: s.is_active ?? true,
    items: s.service_items.map((it) => ({
      id: it.id,
      item_name: it.item_name,
      item_description: it.item_description,
      item_price: Number(it.item_price),
      item_measure_units: it.item_measure_units,
      unit: it.measure_unit?.simbol || it.measure_unit?.unit || '',
      is_active: it.is_active ?? true,
    })),
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

    await prisma.service_items.create({
      data: {
        company_id: companyId,
        customer_service_id: serviceId,
        item_name: input.item_name.trim(),
        item_description: input.item_description?.trim() || input.item_name.trim(),
        item_price: Number(input.item_price) || 0,
        item_measure_units: Number(input.item_measure_units),
        is_active: true,
      },
    });
    revalidatePath(REVALIDATE);
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

export async function updateServiceItem(id: string, input: Partial<ServiceItemInput>) {
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
        ...(input.item_price !== undefined ? { item_price: Number(input.item_price) || 0 } : {}),
        ...(input.item_measure_units !== undefined ? { item_measure_units: Number(input.item_measure_units) } : {}),
      },
    });
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
