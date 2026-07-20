'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { getSalesPointsOfSale } from '@/modules/sales/features/points-of-sale/actions.server';
import { listTaxTypes } from '@/modules/settings/features/taxes/actions.server';

/** Datos auxiliares que necesita el formulario de factura de venta (alta y edición). */
export async function getSalesInvoiceFormData() {
  const { companyId } = await getActionContext();
  if (!companyId) {
    return { customers: [], pointsOfSale: [], perceptionTypes: [] };
  }

  const [customers, pointsOfSale, perceptionTypes] = await Promise.all([
    prisma.customers.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true, name: true, tax_id: true },
      orderBy: { name: 'asc' },
    }),
    getSalesPointsOfSale(),
    listTaxTypes('PERCEPTION'),
  ]);

  return {
    customers,
    pointsOfSale: pointsOfSale
      .filter((pos) => pos.is_active)
      .map((pos) => ({ id: pos.id, number: pos.number, name: pos.name })),
    perceptionTypes: perceptionTypes
      .filter((t) => t.is_active)
      .map((t) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        default_rate: t.default_rate,
        calculation_base: t.calculation_base,
      })),
  };
}

/**
 * Ítems de los servicios contratados por un cliente, para las líneas de la factura
 * de venta. Cada ítem trae su descripción, precio y unidad de medida (tsk-479).
 */
export async function getCustomerServiceItems(customerId: string) {
  const { companyId } = await getActionContext();
  if (!companyId || !customerId) return [];

  const services = await prisma.customer_services.findMany({
    where: { customer_id: customerId, company_id: companyId, is_active: true },
    select: {
      id: true,
      service_name: true,
      service_items: {
        where: { is_active: true },
        select: {
          id: true,
          item_name: true,
          item_description: true,
          item_price: true,
          measure_unit: { select: { unit: true, simbol: true } },
        },
        orderBy: { item_name: 'asc' },
      },
    },
    orderBy: { service_name: 'asc' },
  });

  return services.flatMap((svc) =>
    svc.service_items.map((it) => ({
      id: it.id,
      item_name: it.item_name,
      item_description: it.item_description,
      item_price: Number(it.item_price),
      unit: it.measure_unit?.simbol || it.measure_unit?.unit || '',
      service_name: svc.service_name || '',
    }))
  );
}
