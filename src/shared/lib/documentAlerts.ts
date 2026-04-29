'use server';

/**
 * Generación automática de "alertas" (documentos pendientes) cuando:
 *   - Se crea/actualiza un Empleado o Equipo (reevalúa qué tipos obligatorios
 *     le aplican según conditions y crea las filas pendientes faltantes).
 *   - Se crea o se modifica un document_type Obligatorio (backfill sobre
 *     todos los recursos activos a los que aplica).
 *
 * Patrón "ensure": idempotente. Solo crea filas que faltan y, en el caso de
 * actualización de un recurso, soft-deletea (`is_active=false`) las filas
 * pendientes SIN archivo cuyas condiciones dejaron de aplicar. Documentos con
 * `document_path` poblado o `state ≠ pendiente` jamás se tocan.
 */

import { prisma } from '@/shared/lib/prisma';
import { fetchCurrentUser } from '@/shared/actions/auth';
import {
  checkDocumentAppliesToEmployee,
  checkDocumentAppliesToEquipment,
  type DocumentCondition,
} from './documentConditions';

interface DocumentTypeForAlerts {
  id: string;
  applies: 'Persona' | 'Equipos' | 'Empresa';
  mandatory: boolean;
  special: boolean;
  conditions: any;
  is_active: boolean;
  company_id: string | null;
}

const TYPE_SELECT = {
  id: true,
  applies: true,
  mandatory: true,
  special: true,
  conditions: true,
  is_active: true,
  company_id: true,
} as const;

async function fetchActiveMandatoryTypes(
  companyId: string,
  applies: 'Persona' | 'Equipos' | 'Empresa'
): Promise<DocumentTypeForAlerts[]> {
  const data = await prisma.document_types.findMany({
    where: {
      is_active: true,
      mandatory: true,
      applies,
      OR: [{ company_id: companyId }, { company_id: null }],
    },
    select: TYPE_SELECT,
  });
  return data as DocumentTypeForAlerts[];
}

function normalizeConditions(value: unknown): DocumentCondition[] {
  if (!Array.isArray(value)) return [];
  return value as DocumentCondition[];
}

// ============================================================
// EMPLEADOS
// ============================================================

export async function ensurePendingDocumentsForEmployee(
  employeeId: string
): Promise<{ created: number; deactivated: number }> {
  try {
    const employee = await prisma.employees.findUnique({ where: { id: employeeId } });
    if (!employee || !employee.is_active || !employee.company_id) {
      return { created: 0, deactivated: 0 };
    }

    const types = await fetchActiveMandatoryTypes(employee.company_id, 'Persona');
    const applicableIds = new Set<string>();
    for (const t of types) {
      if (checkDocumentAppliesToEmployee(normalizeConditions(t.conditions), t.special, employee)) {
        applicableIds.add(t.id);
      }
    }

    const existing = await prisma.documents_employees.findMany({
      where: { applies: employeeId },
      select: {
        id: true,
        id_document_types: true,
        document_path: true,
        state: true,
        is_active: true,
      },
    });

    const activeExistingTypeIds = new Set(
      existing
        .filter((e) => e.is_active && e.id_document_types)
        .map((e) => e.id_document_types as string)
    );

    const toCreate = [...applicableIds].filter((typeId) => !activeExistingTypeIds.has(typeId));

    const toDeactivateIds = existing
      .filter(
        (e) =>
          e.is_active &&
          e.id_document_types !== null &&
          !applicableIds.has(e.id_document_types as string) &&
          !e.document_path &&
          e.state === 'pendiente'
      )
      .map((e) => e.id);

    if (toCreate.length === 0 && toDeactivateIds.length === 0) {
      return { created: 0, deactivated: 0 };
    }

    const user = await fetchCurrentUser();
    const userId = user?.id ?? null;

    await prisma.$transaction(async (tx) => {
      if (toCreate.length > 0) {
        await tx.documents_employees.createMany({
          data: toCreate.map((typeId) => ({
            id_document_types: typeId,
            applies: employeeId,
            state: 'pendiente' as const,
            is_active: true,
            user_id: userId,
            document_path: null,
          })),
        });
      }
      if (toDeactivateIds.length > 0) {
        await tx.documents_employees.updateMany({
          where: { id: { in: toDeactivateIds } },
          data: { is_active: false },
        });
      }
    });

    return { created: toCreate.length, deactivated: toDeactivateIds.length };
  } catch (error) {
    console.error('Error in ensurePendingDocumentsForEmployee:', error);
    return { created: 0, deactivated: 0 };
  }
}

// ============================================================
// EQUIPOS (vehicles)
// ============================================================

export async function ensurePendingDocumentsForEquipment(
  vehicleId: string
): Promise<{ created: number; deactivated: number }> {
  try {
    const vehicle = await prisma.vehicles.findUnique({ where: { id: vehicleId } });
    if (!vehicle || !vehicle.is_active || !vehicle.company_id) {
      return { created: 0, deactivated: 0 };
    }

    const types = await fetchActiveMandatoryTypes(vehicle.company_id, 'Equipos');
    const applicableIds = new Set<string>();
    for (const t of types) {
      if (checkDocumentAppliesToEquipment(normalizeConditions(t.conditions), t.special, vehicle)) {
        applicableIds.add(t.id);
      }
    }

    const existing = await prisma.documents_equipment.findMany({
      where: { applies: vehicleId },
      select: {
        id: true,
        id_document_types: true,
        document_path: true,
        state: true,
        is_active: true,
      },
    });

    const activeExistingTypeIds = new Set(
      existing
        .filter((e) => e.is_active && e.id_document_types)
        .map((e) => e.id_document_types as string)
    );

    const toCreate = [...applicableIds].filter((typeId) => !activeExistingTypeIds.has(typeId));

    const toDeactivateIds = existing
      .filter(
        (e) =>
          e.is_active &&
          e.id_document_types !== null &&
          !applicableIds.has(e.id_document_types as string) &&
          !e.document_path &&
          e.state === 'pendiente'
      )
      .map((e) => e.id);

    if (toCreate.length === 0 && toDeactivateIds.length === 0) {
      return { created: 0, deactivated: 0 };
    }

    const user = await fetchCurrentUser();
    const userId = user?.id ?? null;

    await prisma.$transaction(async (tx) => {
      if (toCreate.length > 0) {
        await tx.documents_equipment.createMany({
          data: toCreate.map((typeId) => ({
            id_document_types: typeId,
            applies: vehicleId,
            state: 'pendiente' as const,
            is_active: true,
            user_id: userId,
            document_path: null,
          })),
        });
      }
      if (toDeactivateIds.length > 0) {
        await tx.documents_equipment.updateMany({
          where: { id: { in: toDeactivateIds } },
          data: { is_active: false },
        });
      }
    });

    return { created: toCreate.length, deactivated: toDeactivateIds.length };
  } catch (error) {
    console.error('Error in ensurePendingDocumentsForEquipment:', error);
    return { created: 0, deactivated: 0 };
  }
}

// ============================================================
// EMPRESA (documents_company)
// ============================================================

export async function ensurePendingDocumentsForCompany(
  companyId: string
): Promise<{ created: number; deactivated: number }> {
  try {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company || !company.is_active) return { created: 0, deactivated: 0 };

    // Para empresa: las conditions normalmente no aplican (son flags por industry,
    // pero el helper checkDocumentAppliesToEmployee es genérico — uso el resource
    // company directamente. Si no hay conditions o special=false, aplica.)
    const types = await fetchActiveMandatoryTypes(companyId, 'Empresa');
    const applicableIds = new Set<string>();
    for (const t of types) {
      // company solo evalúa por industry/contact_email/etc si llegasen a tener
      // conditions; si special=false (sin condiciones), aplica directo.
      if (!t.special) {
        applicableIds.add(t.id);
      } else if (
        checkDocumentAppliesToEmployee(
          normalizeConditions(t.conditions),
          t.special,
          company as unknown as Record<string, unknown>
        )
      ) {
        applicableIds.add(t.id);
      }
    }

    const existing = await prisma.documents_company.findMany({
      where: { applies: companyId },
      select: {
        id: true,
        id_document_types: true,
        document_path: true,
        state: true,
        is_active: true,
      },
    });

    const activeExistingTypeIds = new Set(
      existing
        .filter((e) => e.is_active && e.id_document_types)
        .map((e) => e.id_document_types as string)
    );

    const toCreate = [...applicableIds].filter((typeId) => !activeExistingTypeIds.has(typeId));
    const toDeactivateIds = existing
      .filter(
        (e) =>
          e.is_active &&
          e.id_document_types !== null &&
          !applicableIds.has(e.id_document_types as string) &&
          !e.document_path &&
          e.state === 'pendiente'
      )
      .map((e) => e.id);

    if (toCreate.length === 0 && toDeactivateIds.length === 0) {
      return { created: 0, deactivated: 0 };
    }

    const user = await fetchCurrentUser();
    const userId = user?.id ?? null;

    await prisma.$transaction(async (tx) => {
      if (toCreate.length > 0) {
        await tx.documents_company.createMany({
          data: toCreate.map((typeId) => ({
            id_document_types: typeId,
            applies: companyId,
            state: 'pendiente' as const,
            is_active: true,
            user_id: userId,
            document_path: null,
          })),
        });
      }
      if (toDeactivateIds.length > 0) {
        await tx.documents_company.updateMany({
          where: { id: { in: toDeactivateIds } },
          data: { is_active: false },
        });
      }
    });

    return { created: toCreate.length, deactivated: toDeactivateIds.length };
  } catch (error) {
    console.error('Error in ensurePendingDocumentsForCompany:', error);
    return { created: 0, deactivated: 0 };
  }
}

// ============================================================
// TIPO DE DOCUMENTO (backfill al crear/editar tipo Obligatorio)
// ============================================================

/**
 * Backfilea pendings sobre todos los recursos activos a los que aplica el tipo.
 * - Si el tipo es company-specific → solo recursos de esa company.
 * - Si el tipo es global (company_id=null) → recursos de TODAS las empresas.
 *
 * Si el tipo es no-mandatory o is_active=false, no hace nada (los pendings
 * existentes los maneja la lógica de update en cada empleado/equipo).
 */
export async function ensurePendingDocumentsForType(
  documentTypeId: string
): Promise<{ created: number }> {
  try {
    const docType = await prisma.document_types.findUnique({
      where: { id: documentTypeId },
      select: TYPE_SELECT,
    });

    if (!docType || !docType.is_active || !docType.mandatory) {
      return { created: 0 };
    }

    const conditions = normalizeConditions(docType.conditions);
    let totalCreated = 0;

    const companyFilter = docType.company_id
      ? { id: docType.company_id }
      : {}; // global → todas las empresas

    if (docType.applies === 'Persona') {
      const employees = await prisma.employees.findMany({
        where: {
          is_active: true,
          company_id: docType.company_id ? docType.company_id : { not: null },
        },
      });
      const applicableEmployees = employees.filter((e) =>
        checkDocumentAppliesToEmployee(conditions, docType.special, e)
      );
      if (applicableEmployees.length === 0) return { created: 0 };

      const employeeIds = applicableEmployees.map((e) => e.id);
      const existing = await prisma.documents_employees.findMany({
        where: { id_document_types: documentTypeId, applies: { in: employeeIds }, is_active: true },
        select: { applies: true },
      });
      const alreadyHave = new Set(existing.map((e) => e.applies as string));
      const missing = employeeIds.filter((id) => !alreadyHave.has(id));
      if (missing.length === 0) return { created: 0 };

      const user = await fetchCurrentUser();
      const userId = user?.id ?? null;

      await prisma.documents_employees.createMany({
        data: missing.map((empId) => ({
          id_document_types: documentTypeId,
          applies: empId,
          state: 'pendiente' as const,
          is_active: true,
          user_id: userId,
          document_path: null,
        })),
      });
      totalCreated = missing.length;
    } else if (docType.applies === 'Equipos') {
      const vehicles = await prisma.vehicles.findMany({
        where: {
          is_active: true,
          company_id: docType.company_id ? docType.company_id : { not: null },
        },
      });
      const applicable = vehicles.filter((v) =>
        checkDocumentAppliesToEquipment(conditions, docType.special, v)
      );
      if (applicable.length === 0) return { created: 0 };

      const vehicleIds = applicable.map((v) => v.id);
      const existing = await prisma.documents_equipment.findMany({
        where: { id_document_types: documentTypeId, applies: { in: vehicleIds }, is_active: true },
        select: { applies: true },
      });
      const alreadyHave = new Set(existing.map((e) => e.applies as string));
      const missing = vehicleIds.filter((id) => !alreadyHave.has(id));
      if (missing.length === 0) return { created: 0 };

      const user = await fetchCurrentUser();
      const userId = user?.id ?? null;

      await prisma.documents_equipment.createMany({
        data: missing.map((vId) => ({
          id_document_types: documentTypeId,
          applies: vId,
          state: 'pendiente' as const,
          is_active: true,
          user_id: userId,
          document_path: null,
        })),
      });
      totalCreated = missing.length;
    } else if (docType.applies === 'Empresa') {
      const companies = await prisma.company.findMany({
        where: { is_active: true, ...companyFilter },
        select: { id: true },
      });
      if (companies.length === 0) return { created: 0 };

      const companyIds = companies.map((c) => c.id);
      const existing = await prisma.documents_company.findMany({
        where: { id_document_types: documentTypeId, applies: { in: companyIds }, is_active: true },
        select: { applies: true },
      });
      const alreadyHave = new Set(existing.map((e) => e.applies));
      const missing = companyIds.filter((id) => !alreadyHave.has(id));
      if (missing.length === 0) return { created: 0 };

      const user = await fetchCurrentUser();
      const userId = user?.id ?? null;

      await prisma.documents_company.createMany({
        data: missing.map((cId) => ({
          id_document_types: documentTypeId,
          applies: cId,
          state: 'pendiente' as const,
          is_active: true,
          user_id: userId,
          document_path: null,
        })),
      });
      totalCreated = missing.length;
    }

    return { created: totalCreated };
  } catch (error) {
    console.error('Error in ensurePendingDocumentsForType:', error);
    return { created: 0 };
  }
}

// ============================================================
// AUDITORÍA MANUAL (dry-run + confirm)
// ============================================================

export type PendingAuditEntry = {
  resourceId: string;
  resourceLabel: string;
  missingDocumentTypes: { id: string; name: string }[];
};

export type PendingAuditResult = {
  totalMissing: number;
  affectedResources: number;
  entries: PendingAuditEntry[];
};

export async function auditPendingDocumentsForEmployees(): Promise<PendingAuditResult> {
  const { getActionContext } = await import('@/shared/lib/server-action-context');
  const { companyId } = await getActionContext();
  if (!companyId) return { totalMissing: 0, affectedResources: 0, entries: [] };

  try {
    const types = await prisma.document_types.findMany({
      where: {
        is_active: true,
        mandatory: true,
        applies: 'Persona',
        OR: [{ company_id: companyId }, { company_id: null }],
      },
      select: { ...TYPE_SELECT, name: true },
    });
    if (types.length === 0) return { totalMissing: 0, affectedResources: 0, entries: [] };

    const employees = await prisma.employees.findMany({
      where: { is_active: true, company_id: companyId },
    });
    if (employees.length === 0) return { totalMissing: 0, affectedResources: 0, entries: [] };

    const empIds = employees.map((e) => e.id);
    const existingDocs = await prisma.documents_employees.findMany({
      where: { applies: { in: empIds }, is_active: true },
      select: { applies: true, id_document_types: true },
    });

    const existingByEmployee = new Map<string, Set<string>>();
    for (const d of existingDocs) {
      if (!d.applies || !d.id_document_types) continue;
      if (!existingByEmployee.has(d.applies)) existingByEmployee.set(d.applies, new Set());
      existingByEmployee.get(d.applies)!.add(d.id_document_types);
    }

    const entries: PendingAuditEntry[] = [];
    let totalMissing = 0;

    for (const employee of employees) {
      const missing: { id: string; name: string }[] = [];
      const existing = existingByEmployee.get(employee.id) ?? new Set();

      for (const t of types) {
        if (!checkDocumentAppliesToEmployee(normalizeConditions(t.conditions), t.special, employee)) continue;
        if (existing.has(t.id)) continue;
        missing.push({ id: t.id, name: t.name });
      }

      if (missing.length > 0) {
        entries.push({
          resourceId: employee.id,
          resourceLabel: `${employee.firstname ?? ''} ${employee.lastname ?? ''}`.trim() +
            (employee.document_number ? ` (DNI ${employee.document_number})` : ''),
          missingDocumentTypes: missing,
        });
        totalMissing += missing.length;
      }
    }

    entries.sort((a, b) => a.resourceLabel.localeCompare(b.resourceLabel));

    return { totalMissing, affectedResources: entries.length, entries };
  } catch (error) {
    console.error('Error in auditPendingDocumentsForEmployees:', error);
    return { totalMissing: 0, affectedResources: 0, entries: [] };
  }
}

export async function auditPendingDocumentsForEquipment(): Promise<PendingAuditResult> {
  const { getActionContext } = await import('@/shared/lib/server-action-context');
  const { companyId } = await getActionContext();
  if (!companyId) return { totalMissing: 0, affectedResources: 0, entries: [] };

  try {
    const types = await prisma.document_types.findMany({
      where: {
        is_active: true,
        mandatory: true,
        applies: 'Equipos',
        OR: [{ company_id: companyId }, { company_id: null }],
      },
      select: { ...TYPE_SELECT, name: true },
    });
    if (types.length === 0) return { totalMissing: 0, affectedResources: 0, entries: [] };

    const vehicles = await prisma.vehicles.findMany({
      where: { is_active: true, company_id: companyId },
    });
    if (vehicles.length === 0) return { totalMissing: 0, affectedResources: 0, entries: [] };

    const vIds = vehicles.map((v) => v.id);
    const existingDocs = await prisma.documents_equipment.findMany({
      where: { applies: { in: vIds }, is_active: true },
      select: { applies: true, id_document_types: true },
    });

    const existingByVehicle = new Map<string, Set<string>>();
    for (const d of existingDocs) {
      if (!d.applies || !d.id_document_types) continue;
      if (!existingByVehicle.has(d.applies)) existingByVehicle.set(d.applies, new Set());
      existingByVehicle.get(d.applies)!.add(d.id_document_types);
    }

    const entries: PendingAuditEntry[] = [];
    let totalMissing = 0;

    for (const vehicle of vehicles) {
      const missing: { id: string; name: string }[] = [];
      const existing = existingByVehicle.get(vehicle.id) ?? new Set();

      for (const t of types) {
        if (!checkDocumentAppliesToEquipment(normalizeConditions(t.conditions), t.special, vehicle)) continue;
        if (existing.has(t.id)) continue;
        missing.push({ id: t.id, name: t.name });
      }

      if (missing.length > 0) {
        const label = vehicle.domain
          ? `${vehicle.domain}${vehicle.intern_number ? ` - ${vehicle.intern_number}` : ''}`
          : vehicle.serie ?? vehicle.id;
        entries.push({
          resourceId: vehicle.id,
          resourceLabel: label,
          missingDocumentTypes: missing,
        });
        totalMissing += missing.length;
      }
    }

    entries.sort((a, b) => a.resourceLabel.localeCompare(b.resourceLabel));

    return { totalMissing, affectedResources: entries.length, entries };
  } catch (error) {
    console.error('Error in auditPendingDocumentsForEquipment:', error);
    return { totalMissing: 0, affectedResources: 0, entries: [] };
  }
}

export async function confirmPendingDocumentsForEmployees(
  employeeIds: string[]
): Promise<{ created: number }> {
  let total = 0;
  for (const id of employeeIds) {
    const r = await ensurePendingDocumentsForEmployee(id);
    total += r.created;
  }
  return { created: total };
}

export async function confirmPendingDocumentsForEquipment(
  vehicleIds: string[]
): Promise<{ created: number }> {
  let total = 0;
  for (const id of vehicleIds) {
    const r = await ensurePendingDocumentsForEquipment(id);
    total += r.created;
  }
  return { created: total };
}
