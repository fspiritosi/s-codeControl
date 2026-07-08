export type VtvAppointmentStatus =
  | 'pendiente'
  | 'orden_solicitada'
  | 'realizada'
  | 'cancelada';

// Estado extendido usado por el listado y el diálogo de gestión: agrega
// 'sin_programar' (VTV con vencimiento pero sin turno programado).
export type VtvStatusKey = VtvAppointmentStatus | 'sin_programar';

export interface VtvCalendarItem {
  appointmentId: string;
  vehicleId: string;
  domain: string | null; // patente
  internNumber: string; // interno
  brand: string | null; // nombre de marca resuelto (brand_vehicles)
  model: string | null; // nombre de modelo resuelto (model_vehicles)
  appointmentDate: string; // YYYY-MM-DD (fecha del TURNO)
  documentValidity: string | null; // validity real del doc VTV (informativo, no editable acá)
  documentEquipmentId: string | null;
  status: VtvAppointmentStatus;
  notes: string | null;
}

export interface ExpiringVtvDoc {
  documentEquipmentId: string;
  vehicleId: string;
  validity: string; // YYYY-MM-DD
}

// Fila del listado (tab "Listado"): un documento VTV + su turno (si existe).
// status 'sin_programar' = VTV con vencimiento pero sin turno activo.
export interface VtvListItem {
  documentEquipmentId: string | null; // null = turno sin documento VTV vinculado
  vehicleId: string;
  domain: string | null;
  internNumber: string;
  brand: string | null;
  model: string | null;
  validity: string | null; // vencimiento del documento YYYY-MM-DD (null si sin documento)
  appointmentId: string | null; // turno activo si existe
  appointmentDate: string | null; // fecha del turno programado YYYY-MM-DD
  status: VtvAppointmentStatus | 'sin_programar';
  isExpired: boolean; // el vencimiento ya pasó
}

// Métricas del resumen (tkt-461).
export interface VtvMetrics {
  sinProgramarMes: number; // VTV que vencen este mes sin turno programado
  solicitadosMes: number; // turnos solicitados con fecha en este mes
  realizadasMes: number; // VTV realizadas este mes
  vencidasSinGestionar: number; // vencimiento pasado y sin turno solicitado/realizado
}

// Opción de vehículo para el alta manual de turno.
export interface VtvVehicleOption {
  vehicleId: string;
  domain: string | null;
  internNumber: string;
  label: string; // "patente · interno N" para el select
  documentEquipmentId: string | null; // documento VTV del vehículo, si existe
  validity: string | null; // vencimiento del documento VTV, si existe
}

export type ActionResult = { error: string | null };

// Objetivo común del diálogo de gestión (tkt-461). Unifica la fila del listado
// y el turno del calendario para que "programar con fecha" sea consistente.
export interface VtvManageTarget {
  appointmentId: string | null;
  vehicleId: string;
  documentEquipmentId: string | null;
  domain: string | null;
  internNumber: string;
  brand: string | null;
  model: string | null;
  status: VtvStatusKey;
  validity: string | null; // vencimiento del documento
  appointmentDate: string | null; // fecha del turno programado
}
