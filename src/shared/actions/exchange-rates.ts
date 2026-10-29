'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

/**
 * Última cotización cargada por la empresa de `currency` a pesos. La usan las
 * órdenes de compra (TC al emitir) y las órdenes de pago (TC del día del pago)
 * para precargar el campo; el usuario siempre puede corregirlo.
 */
export async function getLatestExchangeRate(currency: string = 'USD') {
  const { companyId } = await getActionContext();
  if (!companyId) return null;

  try {
    const rate = await prisma.exchange_rates.findFirst({
      where: { company_id: companyId, moneda_origen: currency, moneda_destino: 'ARS' },
      orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }],
      select: { valor: true, fecha: true },
    });
    return rate ? { valor: Number(rate.valor), fecha: rate.fecha } : null;
  } catch (error) {
    console.error('Error fetching latest exchange rate:', error);
    return null;
  }
}
