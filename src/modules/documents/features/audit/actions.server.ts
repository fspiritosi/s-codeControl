'use server';

/**
 * Wrappers locales sobre los helpers de `shared/lib/documentAlerts`. Los
 * archivos `'use server'` no permiten re-exports — Next.js solo expone
 * funciones declaradas en el propio archivo como server actions.
 */

import {
  auditPendingDocumentsForEmployees as _auditEmployees,
  auditPendingDocumentsForEquipment as _auditEquipment,
  confirmPendingDocumentsForEmployees as _confirmEmployees,
  confirmPendingDocumentsForEquipment as _confirmEquipment,
} from '@/shared/lib/documentAlerts';

export async function auditPendingDocumentsForEmployees() {
  return _auditEmployees();
}

export async function auditPendingDocumentsForEquipment() {
  return _auditEquipment();
}

export async function confirmPendingDocumentsForEmployees(employeeIds: string[]) {
  return _confirmEmployees(employeeIds);
}

export async function confirmPendingDocumentsForEquipment(vehicleIds: string[]) {
  return _confirmEquipment(vehicleIds);
}
