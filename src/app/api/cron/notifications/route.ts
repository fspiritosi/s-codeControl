import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { createNotification, resolveRecipientEmails } from '@/shared/services/notifications';
import { sendEmail } from '@/shared/actions/email';

/** Umbral fijo de urgencia para VTV por vencer (días). */
const VTV_EXPIRING_DAYS = 7;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Endpoint disparado por Supabase pg_cron diariamente. Genera notificaciones
 * agregadas por empresa de:
 *   - documentos vencidos (state = 'vencido' o validity < hoy)
 *   - documentos por vencer en los próximos 5 días
 *   - órdenes de compra en PENDING_APPROVAL
 *   - órdenes de pago en DRAFT
 *
 * Usa dedupe_key por día para que múltiples corridas en el mismo día no
 * generen duplicados (idempotente).
 *
 * Auth: header `x-cron-secret` debe coincidir con env CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  return handleCron(req);
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const provided = req.headers.get('x-cron-secret');
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 });
  }
  if (provided !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const in5Days = new Date(today);
  in5Days.setDate(in5Days.getDate() + 5);
  const in5Str = in5Days.toISOString().slice(0, 10);
  const inVtvDays = new Date(today);
  inVtvDays.setDate(inVtvDays.getDate() + VTV_EXPIRING_DAYS);
  const inVtvStr = inVtvDays.toISOString().slice(0, 10);

  const summary: Record<string, { created: number; skipped: number }> = {};
  const bump = (key: string, skipped: boolean) => {
    if (!summary[key]) summary[key] = { created: 0, skipped: 0 };
    if (skipped) summary[key].skipped += 1;
    else summary[key].created += 1;
  };

  try {
    const companies = await prisma.company.findMany({
      where: { is_active: true },
      select: { id: true },
    });

    for (const c of companies) {
      // 1. Documentos vencidos (employees + equipment + company) por empresa.
      const expiredCount = await countExpiredDocuments(c.id, todayStr);
      if (expiredCount > 0) {
        const r = await createNotification({
          typeCode: 'documents.expired',
          companyId: c.id,
          metadata: { count: expiredCount },
          dedupeKey: `documents.expired:${todayStr}`,
        });
        bump('documents.expired', !!r.skipped);
      }

      // 2. Documentos por vencer en 5 días.
      const expiringSoon = await countExpiringSoonDocuments(c.id, todayStr, in5Str);
      if (expiringSoon > 0) {
        const r = await createNotification({
          typeCode: 'documents.expiring_soon',
          companyId: c.id,
          metadata: { count: expiringSoon },
          dedupeKey: `documents.expiring_soon:${todayStr}`,
        });
        bump('documents.expiring_soon', !!r.skipped);
      }

      // 3. OC pendientes de aprobación (recordatorio).
      const ocPending = await prisma.purchase_orders.findMany({
        where: { company_id: c.id, status: 'PENDING_APPROVAL' },
        select: { id: true, full_number: true, supplier: { select: { business_name: true } } },
      });
      for (const oc of ocPending) {
        const r = await createNotification({
          typeCode: 'purchase_orders.pending_approval',
          companyId: c.id,
          metadata: {
            number: oc.full_number,
            supplier: oc.supplier?.business_name ?? '',
            purchaseOrderId: oc.id,
          },
          dedupeKey: `purchase_orders.pending_approval:${oc.id}:${todayStr}`,
        });
        bump('purchase_orders.pending_approval', !!r.skipped);
      }

      // 4. OP pendientes de confirmación.
      const opPending = await prisma.payment_orders.findMany({
        where: { company_id: c.id, status: 'DRAFT' },
        select: { id: true, full_number: true },
      });
      for (const op of opPending) {
        const r = await createNotification({
          typeCode: 'payment_orders.pending_confirmation',
          companyId: c.id,
          metadata: { number: op.full_number, paymentOrderId: op.id },
          dedupeKey: `payment_orders.pending_confirmation:${op.id}:${todayStr}`,
        });
        bump('payment_orders.pending_confirmation', !!r.skipped);
      }

      // 5. VTV por vencer en los próximos VTV_EXPIRING_DAYS (7) días.
      //    In-app (createNotification, idempotente por dedupeKey diario) + email.
      const vtvExpiring = await countExpiringVtv(c.id, todayStr, inVtvStr);
      if (vtvExpiring > 0) {
        const r = await createNotification({
          typeCode: 'vtv.expiring_soon',
          companyId: c.id,
          metadata: { count: vtvExpiring, days: VTV_EXPIRING_DAYS },
          dedupeKey: `vtv.expiring_soon:${todayStr}`,
        });
        bump('vtv.expiring_soon', !!r.skipped);

        // Email atado a la misma idempotencia del in-app: solo si NO fue skipped.
        if (!r.skipped) {
          const emails = await resolveRecipientEmails(c.id, 'equipos.view');
          if (emails.length) {
            await sendVtvExpiringEmail(emails, vtvExpiring, VTV_EXPIRING_DAYS);
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      date: todayStr,
      companies: companies.length,
      summary,
    });
  } catch (error) {
    console.error('Cron notifications error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

/**
 * Cuenta documentos activos cuya validity es menor que hoy o cuyo state ya
 * está marcado como 'vencido', considerando employees+equipment+company.
 * Nota: validity es String (YYYY-MM-DD) — comparación lexicográfica funciona.
 */
async function countExpiredDocuments(companyId: string, todayStr: string): Promise<number> {
  const [emp, eq, comp] = await Promise.all([
    prisma.documents_employees.count({
      where: {
        is_active: true,
        OR: [
          { state: 'vencido' },
          { AND: [{ validity: { not: null } }, { validity: { lt: todayStr } }] },
        ],
        employee: { company_id: companyId },
      },
    }),
    prisma.documents_equipment.count({
      where: {
        is_active: true,
        OR: [
          { state: 'vencido' },
          { AND: [{ validity: { not: null } }, { validity: { lt: todayStr } }] },
        ],
        vehicle: { company_id: companyId },
      },
    }),
    prisma.documents_company.count({
      where: {
        is_active: true,
        OR: [
          { state: 'vencido' },
          { AND: [{ validity: { not: null } }, { validity: { lt: todayStr } }] },
        ],
        applies: companyId,
      },
    }),
  ]);
  return emp + eq + comp;
}

/**
 * Cuenta documentos cuya validity está entre [todayStr, todayPlus5Str] (ambos inclusive).
 * Incluye empleados, equipos y empresa.
 */
async function countExpiringSoonDocuments(
  companyId: string,
  todayStr: string,
  in5Str: string
): Promise<number> {
  const where = (rel: 'employee' | 'vehicle' | 'company') => ({
    is_active: true,
    state: { notIn: ['vencido' as const, 'rechazado' as const] },
    validity: { gte: todayStr, lte: in5Str },
  });

  const [emp, eq, comp] = await Promise.all([
    prisma.documents_employees.count({
      where: { ...where('employee'), employee: { company_id: companyId } },
    }),
    prisma.documents_equipment.count({
      where: { ...where('vehicle'), vehicle: { company_id: companyId } },
    }),
    prisma.documents_company.count({
      where: { ...where('company'), applies: companyId },
    }),
  ]);
  return emp + eq + comp;
}

/**
 * Cuenta documentos de equipos de tipo VTV (document_type.is_vtv = true) cuya
 * validity está entre [todayStr, inNStr] (ambos inclusive). Scope por empresa
 * vía la relación al vehículo. validity es String (YYYY-MM-DD) → comparación
 * lexicográfica. Excluye estados 'vencido'/'rechazado'.
 */
async function countExpiringVtv(
  companyId: string,
  todayStr: string,
  inNStr: string
): Promise<number> {
  return prisma.documents_equipment.count({
    where: {
      is_active: true,
      state: { notIn: ['vencido' as const, 'rechazado' as const] },
      validity: { gte: todayStr, lte: inNStr },
      vehicle: { company_id: companyId },
      document_type: { is: { is_vtv: true } },
    },
  });
}

/**
 * Envía el email de urgencia de VTV por vencer a los destinatarios resueltos
 * por permiso. Safe-to-fail: un error de email NO debe tumbar el cron (log y
 * seguir), coherente con el patrón de createNotification. nodemailer acepta
 * lista de destinatarios separada por coma.
 */
async function sendVtvExpiringEmail(to: string[], count: number, days: number): Promise<void> {
  try {
    const url = `${process.env.NEXT_PUBLIC_PROJECT_URL ?? ''}/dashboard/vtv`;
    await sendEmail({
      to: to.join(','),
      subject: `CodeControl — ${count} VTV por vencer`,
      html: `<p>Tenés <strong>${count}</strong> VTV que vence(n) en los próximos ${days} días.</p>
             <p><a href="${url}">Ver calendario de VTV</a></p>`,
    });
  } catch (error) {
    console.error('sendVtvExpiringEmail error:', error);
  }
}
