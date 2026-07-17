'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import { addMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import type {
  ActionResult,
  ExpiringVtvDoc,
  VtvAppointmentStatus,
  VtvCalendarItem,
  VtvListItem,
  VtvMetrics,
  VtvVehicleOption,
} from './types';

const NO_COMPANY = 'Sin empresa seleccionada';
const NOT_FOUND = 'Turno no encontrado';

// Estados que se muestran en el calendario (los cancelados quedan fuera).
const CALENDAR_STATUSES: VtvAppointmentStatus[] = [
  'pendiente',
  'orden_solicitada',
  'realizada',
];

// Nota: la query NO se cachea. El volumen de VTV por empresa es bajo y
// `ensureVtvAppointments()` corre durante el render del server component, donde
// revalidateTag/revalidatePath no están permitidos en Next 16. Leyendo directo
// de la DB, cada render (y cada router.refresh() del cliente) trae datos frescos.

// ============================================================
// Query principal del calendario
// ============================================================

async function fetchVtvAppointments(
  companyId: string,
  from: Date,
  to: Date
): Promise<VtvCalendarItem[]> {
  const appointments = await prisma.vtv_appointments.findMany({
    where: {
      company_id: companyId,
      is_active: true,
      status: { in: CALENDAR_STATUSES },
      appointment_date: { gte: from, lte: to },
      // Excluir vehículos dados de baja / inactivos.
      vehicle: { is: { is_active: true } },
    },
    select: {
      id: true,
      vehicle_id: true,
      appointment_date: true,
      status: true,
      has_verification_order: true,
      has_verification_appointment: true,
      notes: true,
      document_equipment_id: true,
      vehicle: {
        select: {
          domain: true,
          intern_number: true,
          brand_rel: { select: { name: true } },
          model_rel: { select: { name: true } },
        },
      },
      documents_equipment: { select: { validity: true } },
    },
    orderBy: { appointment_date: 'asc' },
  });

  return appointments.map((a) => ({
    appointmentId: a.id,
    vehicleId: a.vehicle_id,
    domain: a.vehicle?.domain ?? null,
    internNumber: a.vehicle?.intern_number ?? '',
    brand: a.vehicle?.brand_rel?.name ?? null,
    model: a.vehicle?.model_rel?.name ?? null,
    appointmentDate: a.appointment_date.toISOString().slice(0, 10),
    // validity puede venir como 'YYYY-MM-DD' o con timestamp; normalizar a fecha.
    documentValidity: a.documents_equipment?.validity
      ? a.documents_equipment.validity.slice(0, 10)
      : null,
    documentEquipmentId: a.document_equipment_id ?? null,
    status: a.status as VtvAppointmentStatus,
    hasOrder: a.has_verification_order,
    hasAppointment: a.has_verification_appointment,
    notes: a.notes ?? null,
  }));
}

/**
 * Query principal del calendario. Rango opcional; default = mes actual ±2 meses.
 * Sin cache (ver nota arriba): lee directo, siempre fresco.
 */
export async function getVtvAppointments(
  range?: { from: string; to: string }
): Promise<VtvCalendarItem[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const now = new Date();
  const from = range ? new Date(range.from) : startOfMonth(addMonths(now, -2));
  const to = range ? new Date(range.to) : endOfMonth(addMonths(now, 2));

  return fetchVtvAppointments(companyId, from, to);
}

// ============================================================
// VTV próximas a vencer (base de autogeneración y del cron)
// ============================================================

/**
 * Identifica VTV próximas a vencer: documents_equipment activos, join document_types
 * where is_vtv=true, validity en [hoy, hoy+withinDays], vehicle.company_id=companyId,
 * state notIn ['vencido','rechazado'].
 */
export async function getExpiringVtvDocuments(
  withinDays = 30
): Promise<ExpiringVtvDoc[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const untilStr = format(
    new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000),
    'yyyy-MM-dd'
  );

  const docs = await prisma.documents_equipment.findMany({
    where: {
      is_active: true,
      state: { notIn: ['vencido', 'rechazado'] },
      validity: { gte: todayStr, lte: untilStr },
      // Excluir vehículos dados de baja / inactivos.
      vehicle: { is: { company_id: companyId, is_active: true } },
      document_type: { is: { is_vtv: true } },
    },
    select: {
      id: true,
      applies: true, // FK al vehículo
      validity: true,
    },
  });

  return docs
    .filter((d) => d.applies && d.validity)
    .map((d) => ({
      documentEquipmentId: d.id,
      vehicleId: d.applies as string,
      validity: (d.validity as unknown as string).slice(0, 10),
    }));
}

// ============================================================
// Autogeneración idempotente de turnos
// ============================================================

/**
 * Idempotente. Por cada VTV por vencer que NO tenga ya un turno (de cualquier estado
 * no cancelado, incluida 'realizada') para ESE mismo vencimiento, crea un turno
 * 'pendiente' con appointment_date = validity y document_validity = validity.
 * Vincular el turno al vencimiento (tkt-461) evita que una VTV ya realizada se
 * vuelva a programar: solo se regenera cuando el documento cambia de vencimiento.
 */
export async function ensureVtvAppointments(): Promise<{ created: number }> {
  const { companyId } = await getActionContext();
  if (!companyId) return { created: 0 };

  const expiring = await getExpiringVtvDocuments();
  if (expiring.length === 0) return { created: 0 };

  // Turnos no cancelados existentes para esos documentos, con el vencimiento que cubren.
  const docIds = expiring.map((d) => d.documentEquipmentId);
  const existing = await prisma.vtv_appointments.findMany({
    where: {
      company_id: companyId,
      is_active: true,
      status: { not: 'cancelada' },
      document_equipment_id: { in: docIds },
    },
    select: { document_equipment_id: true, document_validity: true },
  });
  // Clave "documento::vencimiento" ya gestionada (incluye turnos realizados).
  const handled = new Set<string>();
  for (const e of existing) {
    if (!e.document_equipment_id || !e.document_validity) continue;
    handled.add(
      `${e.document_equipment_id}::${e.document_validity.toISOString().slice(0, 10)}`
    );
  }

  let created = 0;
  for (const doc of expiring) {
    if (handled.has(`${doc.documentEquipmentId}::${doc.validity}`)) continue;
    try {
      await prisma.vtv_appointments.create({
        data: {
          company_id: companyId,
          vehicle_id: doc.vehicleId,
          document_equipment_id: doc.documentEquipmentId,
          appointment_date: new Date(doc.validity),
          document_validity: new Date(doc.validity),
          status: 'pendiente',
          created_by: 'system',
        },
      });
      created += 1;
    } catch (error: any) {
      // Ignorar violación del índice único parcial en carreras (P2002).
      if (error?.code !== 'P2002') throw error;
    }
  }

  return { created };
}

// ============================================================
// Alta manual
// ============================================================

/**
 * Alta manual de un turno (botón "Agendar turno"). tkt-480: registrar una fecha de
 * turno implica que el vehículo ya tiene el Turno de Verificación, así que se marca
 * ese indicador por defecto (los indicadores pueden ajustarse luego desde "Gestionar").
 */
export async function createVtvAppointment(input: {
  vehicleId: string;
  documentEquipmentId?: string | null;
  appointmentDate: string; // YYYY-MM-DD
  notes?: string | null;
  hasOrder?: boolean;
  hasAppointment?: boolean;
}): Promise<{ id?: string; error?: string }> {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: NO_COMPANY };

  // Validar que el vehículo pertenezca a la empresa.
  const vehicle = await prisma.vehicles.findFirst({
    where: { id: input.vehicleId, company_id: companyId },
    select: { id: true },
  });
  if (!vehicle) return { error: 'Vehículo no encontrado' };

  const user = await fetchCurrentUser();
  const createdBy = user?.id ?? null;

  // Vincular el turno al vencimiento actual del documento VTV (tkt-461).
  let documentValidity: Date | null = null;
  if (input.documentEquipmentId) {
    const doc = await prisma.documents_equipment.findUnique({
      where: { id: input.documentEquipmentId },
      select: { validity: true },
    });
    if (doc?.validity) {
      documentValidity = new Date((doc.validity as unknown as string).slice(0, 10));
    }
  }

  try {
    const created = await prisma.vtv_appointments.create({
      data: {
        company_id: companyId,
        vehicle_id: input.vehicleId,
        document_equipment_id: input.documentEquipmentId ?? null,
        appointment_date: new Date(input.appointmentDate),
        document_validity: documentValidity,
        // El turno queda "en gestión"; el estado visible sale del semáforo.
        status: 'pendiente',
        has_verification_order: input.hasOrder ?? false,
        // Agendó una fecha de turno => por defecto ya tiene el Turno de Verificación.
        has_verification_appointment: input.hasAppointment ?? true,
        notes: input.notes ?? null,
        created_by: createdBy,
      },
      select: { id: true },
    });
    return { id: created.id };
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return {
        error:
          'Este vehículo ya tiene un turno activo para su VTV. Gestionalo desde el listado.',
      };
    }
    return { error: 'No se pudo crear el turno' };
  }
}

// ============================================================
// Transiciones de estado
// ============================================================

const FINAL_STATUSES: VtvAppointmentStatus[] = ['realizada', 'cancelada'];

async function transition(
  appointmentId: string,
  allowedFrom: VtvAppointmentStatus[],
  data: Record<string, unknown>
): Promise<ActionResult> {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: NO_COMPANY };

  const appointment = await prisma.vtv_appointments.findFirst({
    where: { id: appointmentId, company_id: companyId },
    select: { id: true, status: true },
  });
  if (!appointment) return { error: NOT_FOUND };

  if (!allowedFrom.includes(appointment.status as VtvAppointmentStatus)) {
    return { error: 'Transición no permitida' };
  }

  await prisma.vtv_appointments.update({
    where: { id: appointmentId },
    data: { ...data, updated_at: new Date() },
  });

  return { error: null };
}

/**
 * Setea los dos indicadores independientes de la VTV (tkt-480): Orden de Verificación
 * y Turno de Verificación. El semáforo (rojo/amarillo/verde) se deriva de ambos.
 * - Si el turno ya existe (placeholder 'pendiente' u otro activo) actualiza los flags.
 * - Si no existe, crea el turno en estado 'pendiente' con los flags indicados.
 * No aplica sobre turnos terminales (realizada/cancelada).
 */
export async function setVtvIndicators(input: {
  appointmentId?: string | null;
  vehicleId: string;
  documentEquipmentId?: string | null;
  hasOrder: boolean;
  hasAppointment: boolean;
  appointmentDate?: string | null; // YYYY-MM-DD (fecha del turno, opcional)
}): Promise<ActionResult> {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: NO_COMPANY };

  // Turno existente: actualizar flags (y fecha si vino).
  if (input.appointmentId) {
    const appointment = await prisma.vtv_appointments.findFirst({
      where: { id: input.appointmentId, company_id: companyId },
      select: { id: true, status: true },
    });
    if (!appointment) return { error: NOT_FOUND };
    if (FINAL_STATUSES.includes(appointment.status as VtvAppointmentStatus)) {
      return { error: 'La VTV ya está realizada o cancelada' };
    }

    await prisma.vtv_appointments.update({
      where: { id: input.appointmentId },
      data: {
        has_verification_order: input.hasOrder,
        has_verification_appointment: input.hasAppointment,
        ...(input.appointmentDate
          ? { appointment_date: new Date(input.appointmentDate) }
          : {}),
        updated_at: new Date(),
      },
    });
    return { error: null };
  }

  // Sin turno todavía: crearlo con los indicadores. La fecha del turno es opcional;
  // si no vino se usa el vencimiento del documento (o hoy) como placeholder.
  const vehicle = await prisma.vehicles.findFirst({
    where: { id: input.vehicleId, company_id: companyId },
    select: { id: true },
  });
  if (!vehicle) return { error: 'Vehículo no encontrado' };

  const user = await fetchCurrentUser();
  const createdBy = user?.id ?? null;

  let documentValidity: Date | null = null;
  if (input.documentEquipmentId) {
    const doc = await prisma.documents_equipment.findUnique({
      where: { id: input.documentEquipmentId },
      select: { validity: true },
    });
    if (doc?.validity) {
      documentValidity = new Date((doc.validity as unknown as string).slice(0, 10));
    }
  }

  const appointmentDate = input.appointmentDate
    ? new Date(input.appointmentDate)
    : (documentValidity ?? new Date());

  try {
    await prisma.vtv_appointments.create({
      data: {
        company_id: companyId,
        vehicle_id: input.vehicleId,
        document_equipment_id: input.documentEquipmentId ?? null,
        appointment_date: appointmentDate,
        document_validity: documentValidity,
        status: 'pendiente',
        has_verification_order: input.hasOrder,
        has_verification_appointment: input.hasAppointment,
        created_by: createdBy,
      },
    });
    return { error: null };
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return {
        error:
          'Este vehículo ya tiene un turno activo para su VTV. Actualizá desde el listado.',
      };
    }
    return { error: 'No se pudieron guardar los indicadores' };
  }
}

/** pendiente | orden_solicitada → realizada (NO toca documents_equipment) */
export async function markCompleted(
  appointmentId: string
): Promise<ActionResult> {
  return transition(appointmentId, ['pendiente', 'orden_solicitada'], {
    status: 'realizada',
  });
}

/** no-final → cancelada */
export async function cancelAppointment(
  appointmentId: string
): Promise<ActionResult> {
  const allowedFrom = (['pendiente', 'orden_solicitada'] as VtvAppointmentStatus[]).filter(
    (s) => !FINAL_STATUSES.includes(s)
  );
  return transition(appointmentId, allowedFrom, { status: 'cancelada' });
}

/**
 * Mover/reasignar: solo cambia appointment_date del turno, nunca el validity del doc.
 * Solo desde estados no finales.
 */
export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string // YYYY-MM-DD
): Promise<ActionResult> {
  return transition(appointmentId, ['pendiente', 'orden_solicitada'], {
    appointment_date: new Date(newDate),
  });
}

// ============================================================
// Listado (tab "Listado") + métricas (tkt-461)
// ============================================================

/**
 * Trae todos los documentos VTV de la empresa (con vencimiento) y les asocia su
 * turno más relevante. Base compartida por getVtvList y getVtvMetrics.
 * - 'pendiente' = turno placeholder autogenerado → se muestra como "sin_programar".
 * - 'orden_solicitada' = turno ya programado (con fecha).
 * - 'realizada' = VTV realizada.
 */
async function fetchVtvListRaw(companyId: string): Promise<VtvListItem[]> {
  const docs = await prisma.documents_equipment.findMany({
    where: {
      is_active: true,
      validity: { not: null },
      state: { notIn: ['rechazado'] },
      vehicle: { is: { company_id: companyId, is_active: true } },
      document_type: { is: { is_vtv: true } },
    },
    select: {
      id: true,
      applies: true, // FK al vehículo
      validity: true,
      vehicle: {
        select: {
          domain: true,
          intern_number: true,
          brand_rel: { select: { name: true } },
          model_rel: { select: { name: true } },
        },
      },
    },
  });

  const docIdsSet = new Set(docs.map((d) => d.id));

  // TODOS los turnos no cancelados de la empresa (con datos del vehículo), para
  // poder listar también los turnos sin documento VTV vinculado (alta manual sobre
  // un vehículo sin doc). Sin esto quedarían solo en el calendario, no en el listado.
  const appts = await prisma.vtv_appointments.findMany({
    where: {
      company_id: companyId,
      is_active: true,
      status: { not: 'cancelada' },
      // Excluir turnos de vehículos dados de baja / inactivos (incluye huérfanos).
      vehicle: { is: { is_active: true } },
    },
    select: {
      id: true,
      document_equipment_id: true,
      vehicle_id: true,
      appointment_date: true,
      status: true,
      has_verification_order: true,
      has_verification_appointment: true,
      notes: true,
      vehicle: {
        select: {
          domain: true,
          intern_number: true,
          brand_rel: { select: { name: true } },
          model_rel: { select: { name: true } },
        },
      },
    },
    orderBy: { updated_at: 'desc' },
  });

  // Por documento: turno activo (pendiente|orden_solicitada) o la última realizada.
  const activeByDoc = new Map<string, (typeof appts)[number]>();
  const doneByDoc = new Map<string, (typeof appts)[number]>();
  for (const a of appts) {
    if (!a.document_equipment_id || !docIdsSet.has(a.document_equipment_id)) continue;
    if (a.status === 'realizada') {
      if (!doneByDoc.has(a.document_equipment_id))
        doneByDoc.set(a.document_equipment_id, a);
    } else if (!activeByDoc.has(a.document_equipment_id)) {
      activeByDoc.set(a.document_equipment_id, a);
    }
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const items: VtvListItem[] = docs.map((d) => {
    const validity = (d.validity as unknown as string).slice(0, 10);
    const active = activeByDoc.get(d.id);
    const done = doneByDoc.get(d.id);

    let status: VtvListItem['status'];
    let appointmentId: string | null = null;
    let appointmentDate: string | null = null;
    let hasOrder = false;
    let hasAppointment = false;

    if (active) {
      appointmentId = active.id;
      appointmentDate = active.appointment_date.toISOString().slice(0, 10);
      // Turno en gestión: el estado visible sale del semáforo (flags), no del enum.
      status = active.status;
      hasOrder = active.has_verification_order;
      hasAppointment = active.has_verification_appointment;
    } else if (done) {
      appointmentId = done.id;
      appointmentDate = done.appointment_date.toISOString().slice(0, 10);
      status = 'realizada';
      hasOrder = done.has_verification_order;
      hasAppointment = done.has_verification_appointment;
    } else {
      status = 'sin_programar';
    }

    return {
      documentEquipmentId: d.id,
      vehicleId: d.applies as string,
      domain: d.vehicle?.domain ?? null,
      internNumber: d.vehicle?.intern_number ?? '',
      brand: d.vehicle?.brand_rel?.name ?? null,
      model: d.vehicle?.model_rel?.name ?? null,
      validity,
      appointmentId,
      appointmentDate,
      status,
      hasOrder,
      hasAppointment,
      isExpired: validity < todayStr,
    };
  });

  // Filas huérfanas: turnos sin documento VTV (o con doc fuera de la lista), que no
  // quedan representados por ninguna fila de documento. Alta manual sin doc.
  for (const a of appts) {
    if (a.document_equipment_id && docIdsSet.has(a.document_equipment_id)) continue;
    items.push({
      documentEquipmentId: a.document_equipment_id ?? null,
      vehicleId: a.vehicle_id,
      domain: a.vehicle?.domain ?? null,
      internNumber: a.vehicle?.intern_number ?? '',
      brand: a.vehicle?.brand_rel?.name ?? null,
      model: a.vehicle?.model_rel?.name ?? null,
      validity: null, // sin documento vinculado → sin vencimiento
      appointmentId: a.id,
      appointmentDate: a.appointment_date.toISOString().slice(0, 10),
      status: a.status === 'realizada' ? 'realizada' : a.status,
      hasOrder: a.has_verification_order,
      hasAppointment: a.has_verification_appointment,
      isExpired: false,
    });
  }

  // Orden: por vencimiento asc; los sin vencimiento (huérfanos) al final.
  return items.sort((a, b) =>
    (a.validity ?? '9999-99-99').localeCompare(b.validity ?? '9999-99-99')
  );
}

/** Listado completo de VTV (documentos) con su estado de turno. */
export async function getVtvList(): Promise<VtvListItem[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];
  return fetchVtvListRaw(companyId);
}

/** Métricas del resumen (tkt-480: basadas en el semáforo de dos indicadores). */
export async function getVtvMetrics(): Promise<VtvMetrics> {
  const { companyId } = await getActionContext();
  if (!companyId)
    return {
      sinGestionarMes: 0,
      incompletasMes: 0,
      completasMes: 0,
      vencidasSinCompletar: 0,
    };

  const list = await fetchVtvListRaw(companyId);
  const monthPrefix = format(new Date(), 'yyyy-MM');

  let sinGestionarMes = 0;
  let incompletasMes = 0;
  let completasMes = 0;
  let vencidasSinCompletar = 0;

  for (const it of list) {
    if (it.status === 'cancelada') continue;
    const venceEsteMes = it.validity?.startsWith(monthPrefix) ?? false;
    // 'Completa' = ambos indicadores o VTV ya realizada.
    const completa = it.status === 'realizada' || (it.hasOrder && it.hasAppointment);
    const incompleta = !completa && (it.hasOrder || it.hasAppointment);
    const sinGestionar = !completa && !incompleta;

    if (venceEsteMes) {
      if (completa) completasMes += 1;
      else if (incompleta) incompletasMes += 1;
      else sinGestionarMes += 1;
    }
    // Vencidas sin completar: ya pasó el vencimiento y no está completa.
    if (it.isExpired && !completa) vencidasSinCompletar += 1;
  }

  return { sinGestionarMes, incompletasMes, completasMes, vencidasSinCompletar };
}

/** Vehículos de la empresa (con su documento VTV, si existe) para el alta manual. */
export async function getVehiclesWithVtv(): Promise<VtvVehicleOption[]> {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const [vehicles, vtvDocs] = await Promise.all([
    prisma.vehicles.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true, domain: true, intern_number: true },
      orderBy: { intern_number: 'asc' },
    }),
    prisma.documents_equipment.findMany({
      where: {
        is_active: true,
        validity: { not: null },
        vehicle: { is: { company_id: companyId } },
        document_type: { is: { is_vtv: true } },
      },
      select: { id: true, applies: true, validity: true },
    }),
  ]);

  const docByVehicle = new Map<string, { id: string; validity: string }>();
  for (const doc of vtvDocs) {
    if (doc.applies && !docByVehicle.has(doc.applies)) {
      docByVehicle.set(doc.applies, {
        id: doc.id,
        validity: (doc.validity as unknown as string).slice(0, 10),
      });
    }
  }

  return vehicles.map((v) => {
    const doc = docByVehicle.get(v.id);
    const label = [v.domain, v.intern_number ? `Interno ${v.intern_number}` : null]
      .filter(Boolean)
      .join(' · ');
    return {
      vehicleId: v.id,
      domain: v.domain ?? null,
      internNumber: v.intern_number ?? '',
      label: label || v.id,
      documentEquipmentId: doc?.id ?? null,
      validity: doc?.validity ?? null,
    };
  });
}
