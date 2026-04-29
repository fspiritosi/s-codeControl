'use server';

/**
 * Re-exports de los actions de auditoría manual de alertas. Vive en el módulo
 * `documents/audit` para mantener la frontera modular: los componentes UI
 * importan desde acá, no directamente desde `shared/lib/documentAlerts`.
 */
export {
  auditPendingDocumentsForEmployees,
  auditPendingDocumentsForEquipment,
  confirmPendingDocumentsForEmployees,
  confirmPendingDocumentsForEquipment,
} from '@/shared/lib/documentAlerts';

export type { PendingAuditEntry, PendingAuditResult } from '@/shared/lib/documentAlerts';
