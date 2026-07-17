export type CalendarEventType = 'doc_employee' | 'doc_equipment' | 'maintenance';

// Severidad para el color del evento/día. Los documentos se gradúan por
// proximidad al vencimiento; los mantenimientos programados usan su propio color.
export type CalendarEventSeverity = 'expired' | 'soon' | 'upcoming' | 'maintenance';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  date: string; // YYYY-MM-DD (fecha del vencimiento o del mantenimiento)
  title: string; // ej. nombre del documento o "Mantenimiento programado"
  subtitle: string; // titular: empleado o Interno·Patente
  severity: CalendarEventSeverity;
  href: string;
}
