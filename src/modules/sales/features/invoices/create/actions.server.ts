'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { getSalesPointsOfSale } from '@/modules/sales/features/points-of-sale/actions.server';
import { listTaxTypes } from '@/modules/settings/features/taxes/actions.server';

/** Datos auxiliares que necesita el formulario de factura de venta (alta y edición). */
export async function getSalesInvoiceFormData() {
  const { companyId } = await getActionContext();
  if (!companyId) {
    return { customers: [], products: [], pointsOfSale: [], perceptionTypes: [] };
  }

  const [customers, products, pointsOfSale, perceptionTypes] = await Promise.all([
    prisma.customers.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true, name: true, tax_id: true },
      orderBy: { name: 'asc' },
    }),
    prisma.products.findMany({
      where: { company_id: companyId, status: 'ACTIVE' },
      select: { id: true, code: true, name: true, sale_price: true, vat_rate: true },
      orderBy: { name: 'asc' },
    }),
    getSalesPointsOfSale(),
    listTaxTypes('PERCEPTION'),
  ]);

  return {
    customers,
    products: products.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      sale_price: Number(p.sale_price),
      vat_rate: Number(p.vat_rate),
    })),
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
