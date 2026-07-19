'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { getSession } from '@/shared/lib/session';
import { startOfDay, endOfDay, addDays, differenceInCalendarDays } from 'date-fns';
import {
  checkDocumentAppliesToEmployee,
  checkDocumentAppliesToEquipment,
  type DocumentCondition,
} from '@/shared/lib/documentConditions';

// Niveles de proximidad (tsk-434): vencido / ≤3 días / ≤7 días.
export type AlertLevel = 'expired' | 'critical' | 'warning';

export type CriticalDocAlert = {
  alertKey: string;
  alertType: 'document_employee' | 'document_equipment';
  docType: string;
  holder: string;
  validity: string; // ISO
  daysLeft: number; // negativo = vencido
  level: AlertLevel;
  href: string;
  reviewedBy: string | null;
  reviewedAt: string | null; // ISO
};

export type CriticalAlerts = {
  documents: CriticalDocAlert[];
  totalDocs: number;
  equipmentOutOfService: number;
  pendingRequests: number;
};

const EMPTY_ALERTS: CriticalAlerts = {
  documents: [],
  totalDocs: 0,
  equipmentOutOfService: 0,
  pendingRequests: 0,
};

const MAX_DOCS = 40;

function levelFor(daysLeft: number): AlertLevel {
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 3) return 'critical';
  return 'warning';
}

async function fetchCriticalAlerts(companyId: string): Promise<CriticalAlerts> {
  const today = startOfDay(new Date());
  const in7Days = endOfDay(addDays(new Date(), 7));

  // vencido (< hoy) o por vencer en los próximos 7 días.
  const criticalValidity = { not: null, lte: in7Days.toISOString() };
  const documentTypeFilter = {
    is_active: true,
    NOT: { is_it_montlhy: true } as const,
    name: { not: '' },
  };

  const [empDocs, eqDocs, repairGroups, pendingRequests, acks] = await Promise.all([
    prisma.documents_employees.findMany({
      where: {
        employee: { is: { company_id: companyId, is_active: true } },
        document_type: { is: documentTypeFilter },
        validity: criticalValidity,
      },
      orderBy: { validity: 'asc' },
      take: 120,
      select: {
        id: true,
        validity: true,
        document_type: { select: { name: true, conditions: true, special: true } },
        employee: {
          select: {
            firstname: true,
            lastname: true,
            gender: true,
            type_of_contract: true,
            hierarchical_position: true,
            category_id: true,
            covenants_id: true,
            guild_id: true,
          },
        },
      },
    }),
    prisma.documents_equipment.findMany({
      where: {
        vehicle: { is: { company_id: companyId, is_active: true } },
        document_type: { is: documentTypeFilter },
        validity: criticalValidity,
      },
      orderBy: { validity: 'asc' },
      take: 120,
      select: {
        id: true,
        validity: true,
        document_type: { select: { name: true, conditions: true, special: true } },
        vehicle: { select: { intern_number: true, domain: true, brand: true, type_of_vehicle: true } },
      },
    }),
    prisma.repair_solicitudes.groupBy({
      by: ['equipment_id'],
      where: {
        equipment: { is: { company_id: companyId } },
        state: { in: ['Pendiente', 'En_reparacion', 'Esperando_repuestos'] },
      },
    }),
    prisma.repair_solicitudes.count({
      where: { equipment: { is: { company_id: companyId } }, state: 'Pendiente' },
    }),
    prisma.alert_acknowledgements.findMany({
      where: { company_id: companyId },
      select: {
        alert_key: true,
        reviewed_at: true,
        reviewer: { select: { fullname: true, email: true } },
      },
    }),
  ]);

  const ackByKey = new Map(
    acks.map((a) => [
      a.alert_key,
      {
        reviewedBy: a.reviewer?.fullname ?? a.reviewer?.email ?? 'Usuario',
        reviewedAt: a.reviewed_at.toISOString(),
      },
    ])
  );

  const documents: CriticalDocAlert[] = [];

  for (const doc of empDocs) {
    if (!doc.validity) continue;
    const applies = checkDocumentAppliesToEmployee(
      (doc.document_type?.conditions ?? []) as unknown as DocumentCondition[],
      doc.document_type?.special ?? false,
      doc.employee ?? {}
    );
    if (!applies) continue;
    const daysLeft = differenceInCalendarDays(new Date(doc.validity), today);
    const alertKey = `doc_emp:${doc.id}`;
    const ack = ackByKey.get(alertKey);
    documents.push({
      alertKey,
      alertType: 'document_employee',
      docType: doc.document_type?.name ?? 'Documento',
      holder: `${doc.employee?.lastname ?? ''} ${doc.employee?.firstname ?? ''}`.trim() || 'Empleado',
      validity: doc.validity,
      daysLeft,
      level: levelFor(daysLeft),
      href: `/dashboard/document?tab=employees`,
      reviewedBy: ack?.reviewedBy ?? null,
      reviewedAt: ack?.reviewedAt ?? null,
    });
  }

  for (const doc of eqDocs) {
    if (!doc.validity) continue;
    const applies = checkDocumentAppliesToEquipment(
      (doc.document_type?.conditions ?? []) as unknown as DocumentCondition[],
      doc.document_type?.special ?? false,
      doc.vehicle ?? {}
    );
    if (!applies) continue;
    const daysLeft = differenceInCalendarDays(new Date(doc.validity), today);
    const alertKey = `doc_eq:${doc.id}`;
    const ack = ackByKey.get(alertKey);
    const holder = doc.vehicle?.intern_number
      ? `Interno ${doc.vehicle.intern_number}${doc.vehicle.domain ? ` · ${doc.vehicle.domain}` : ''}`
      : doc.vehicle?.domain ?? 'Equipo';
    documents.push({
      alertKey,
      alertType: 'document_equipment',
      docType: doc.document_type?.name ?? 'Documento',
      holder,
      validity: doc.validity,
      daysLeft,
      level: levelFor(daysLeft),
      href: `/dashboard/document?tab=equipment`,
      reviewedBy: ack?.reviewedBy ?? null,
      reviewedAt: ack?.reviewedAt ?? null,
    });
  }

  // Más críticos primero (menor daysLeft), luego por titular.
  documents.sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    documents: documents.slice(0, MAX_DOCS),
    totalDocs: documents.length,
    equipmentOutOfService: repairGroups.length,
    pendingRequests,
  };
}

export async function getCriticalAlerts(): Promise<CriticalAlerts> {
  const { companyId } = await getActionContext();
  if (!companyId) return EMPTY_ALERTS;
  // Sin unstable_cache: depende de los acks del usuario y debe reflejar el
  // "Revisada" al instante. Las queries están acotadas (take + índices).
  return fetchCriticalAlerts(companyId);
}

export type AcknowledgeResult =
  | { ok: true; reviewedBy: string; reviewedAt: string }
  | { ok: false; error: string };

export async function acknowledgeAlert(input: {
  alertKey: string;
  alertType: string;
  label?: string;
}): Promise<AcknowledgeResult> {
  const session = await getSession();
  const { companyId } = await getActionContext();
  if (!session.user || !companyId) return { ok: false, error: 'No autorizado' };

  const now = new Date();
  await prisma.alert_acknowledgements.upsert({
    where: {
      company_id_alert_key: { company_id: companyId, alert_key: input.alertKey },
    },
    update: {
      reviewed_by: session.user.id,
      reviewed_at: now,
      alert_type: input.alertType,
      label: input.label ?? null,
    },
    create: {
      company_id: companyId,
      alert_key: input.alertKey,
      alert_type: input.alertType,
      label: input.label ?? null,
      reviewed_by: session.user.id,
    },
  });

  return {
    ok: true,
    reviewedBy: session.profile?.fullname ?? session.user.email ?? 'Vos',
    reviewedAt: now.toISOString(),
  };
}
