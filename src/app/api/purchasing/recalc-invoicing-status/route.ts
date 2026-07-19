import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { isActiveUserOwner } from '@/shared/lib/permissions';
import { recalcInvoicingStatus } from '@/modules/purchasing/shared/recalc-invoicing-status';
import { apiSuccess, apiError } from '@/shared/lib/api-response';

/**
 * Reconciliación (idempotente, solo owner) del invoicing_status de todas las OCs
 * de la empresa activa. Corrige estados históricos que quedaron mal por los bugs
 * de sincronización previos (tsk-478). Seguro de ejecutar cuantas veces se quiera.
 *
 * Trigger (logueado como dueño de la empresa), desde la consola del navegador:
 *   fetch('/api/purchasing/recalc-invoicing-status', { method: 'POST' })
 *     .then(r => r.json()).then(console.log)
 */
export async function POST() {
  try {
    const { companyId } = await getActionContext();
    if (!companyId) return apiError('No hay empresa seleccionada', 400);

    if (!(await isActiveUserOwner())) {
      return apiError('Solo el dueño de la empresa puede ejecutar la reconciliación', 403);
    }

    const orders = await prisma.purchase_orders.findMany({
      where: { company_id: companyId },
      select: { id: true, invoicing_status: true },
    });

    const changes: { id: string; from: string; to: string }[] = [];
    for (const order of orders) {
      const newStatus = await recalcInvoicingStatus(order.id);
      if (newStatus && newStatus !== order.invoicing_status) {
        changes.push({ id: order.id, from: order.invoicing_status, to: newStatus });
      }
    }

    return apiSuccess({ total: orders.length, updated: changes.length, changes });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('API /api/purchasing/recalc-invoicing-status error:', msg);
    return apiError(`Falló la reconciliación: ${msg}`, 500);
  }
}
