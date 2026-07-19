'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { startOfMonth, endOfMonth, addMonths, differenceInCalendarDays, startOfDay } from 'date-fns';
import type { CalendarEvent, CalendarEventSeverity } from './types';

function severityForDoc(daysLeft: number): CalendarEventSeverity {
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 7) return 'soon';
  return 'upcoming';
}

function normalizeDate(value: string): string | null {
  // validity/scheduled se guardan como String ('YYYY-MM-DD' o ISO). Normalizamos.
  if (!value) return null;
  const iso = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function fetchExpirationEvents(
  companyId: string,
  from: Date,
  to: Date
): Promise<CalendarEvent[]> {
  const today = startOfDay(new Date());
  const fromStr = from.toISOString();
  const toStr = to.toISOString();

  const documentTypeFilter = {
    is_active: true,
    NOT: { is_it_montlhy: true } as const,
    name: { not: '' },
  };

  const [empDocs, eqDocs, maintenance] = await Promise.all([
    prisma.documents_employees.findMany({
      where: {
        employee: { is: { company_id: companyId, is_active: true } },
        document_type: { is: documentTypeFilter },
        validity: { not: null, gte: fromStr, lte: toStr },
      },
      select: {
        id: true,
        validity: true,
        document_type: { select: { name: true } },
        employee: { select: { firstname: true, lastname: true } },
      },
    }),
    prisma.documents_equipment.findMany({
      where: {
        vehicle: { is: { company_id: companyId, is_active: true } },
        document_type: { is: documentTypeFilter },
        validity: { not: null, gte: fromStr, lte: toStr },
      },
      select: {
        id: true,
        validity: true,
        document_type: { select: { name: true } },
        vehicle: { select: { intern_number: true, domain: true } },
      },
    }),
    prisma.repair_solicitudes.findMany({
      where: {
        equipment: { is: { company_id: companyId } },
        state: 'Programado',
        scheduled: { not: null },
      },
      select: {
        id: true,
        scheduled: true,
        user_description: true,
        equipment: { select: { intern_number: true, domain: true } },
      },
    }),
  ]);

  const events: CalendarEvent[] = [];

  for (const doc of empDocs) {
    const date = normalizeDate(doc.validity as unknown as string);
    if (!date) continue;
    const daysLeft = differenceInCalendarDays(new Date(date), today);
    events.push({
      id: `doc_emp:${doc.id}`,
      type: 'doc_employee',
      date,
      title: doc.document_type?.name ?? 'Documento',
      subtitle:
        `${doc.employee?.lastname ?? ''} ${doc.employee?.firstname ?? ''}`.trim() || 'Empleado',
      severity: severityForDoc(daysLeft),
      href: `/dashboard/document?tab=employees`,
    });
  }

  for (const doc of eqDocs) {
    const date = normalizeDate(doc.validity as unknown as string);
    if (!date) continue;
    const daysLeft = differenceInCalendarDays(new Date(date), today);
    const holder = doc.vehicle?.intern_number
      ? `Interno ${doc.vehicle.intern_number}${doc.vehicle.domain ? ` · ${doc.vehicle.domain}` : ''}`
      : doc.vehicle?.domain ?? 'Equipo';
    events.push({
      id: `doc_eq:${doc.id}`,
      type: 'doc_equipment',
      date,
      title: doc.document_type?.name ?? 'Documento',
      subtitle: holder,
      severity: severityForDoc(daysLeft),
      href: `/dashboard/document?tab=equipment`,
    });
  }

  for (const m of maintenance) {
    const date = normalizeDate(m.scheduled as string);
    if (!date || date < from.toISOString().slice(0, 10) || date > to.toISOString().slice(0, 10)) {
      continue;
    }
    const holder = m.equipment?.intern_number
      ? `Interno ${m.equipment.intern_number}${m.equipment.domain ? ` · ${m.equipment.domain}` : ''}`
      : m.equipment?.domain ?? 'Equipo';
    events.push({
      id: `maint:${m.id}`,
      type: 'maintenance',
      date,
      title: 'Mantenimiento programado',
      subtitle: holder,
      severity: 'maintenance',
      href: `/dashboard/maintenance?state=Programado`,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getExpirationEvents(range?: {
  from: string;
  to: string;
}): Promise<CalendarEvent[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const now = new Date();
  const from = range ? new Date(range.from) : startOfMonth(addMonths(now, -1));
  const to = range ? new Date(range.to) : endOfMonth(addMonths(now, 6));

  return fetchExpirationEvents(companyId, from, to);
}
