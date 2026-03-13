'use server';
import { prisma } from '@/shared/lib/prisma';
import { storageServer } from '@/shared/lib/storage-server';

export const insertDocumentsEmployees = async (docs: any[]) => {
  try {
    const data = await prisma.documents_employees.createMany({ data: docs });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting documents employees:', error);
    return { data: null, error: String(error) };
  }
};

export const insertDocumentsEquipment = async (docs: any[]) => {
  try {
    const data = await prisma.documents_equipment.createMany({ data: docs });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting documents equipment:', error);
    return { data: null, error: String(error) };
  }
};

export const insertSingleDocumentEmployee = async (doc: Record<string, unknown>) => {
  try {
    const data = await prisma.documents_employees.create({ data: doc as any });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting single document employee:', error);
    return { data: null, error: String(error) };
  }
};

export const insertSingleDocumentEquipment = async (doc: Record<string, unknown>) => {
  try {
    const data = await prisma.documents_equipment.create({ data: doc as any });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting single document equipment:', error);
    return { data: null, error: String(error) };
  }
};

export const insertMultipleDocuments = async (
  tableName: 'documents_employees' | 'documents_equipment',
  docs: Record<string, unknown>[]
) => {
  try {
    if (tableName === 'documents_employees') {
      const data = await prisma.documents_employees.createMany({ data: docs as any });
      return { data, error: null };
    } else {
      const data = await prisma.documents_equipment.createMany({ data: docs as any });
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error inserting multiple documents:', error);
    return { data: null, error: String(error) };
  }
};

export const insertDocumentAlerts = async (
  tableName: 'documents_employees' | 'documents_equipment',
  alerts: Record<string, unknown>[]
) => {
  try {
    if (tableName === 'documents_employees') {
      const data = await prisma.documents_employees.createMany({ data: alerts as any });
      return { data, error: null };
    } else {
      const data = await prisma.documents_equipment.createMany({ data: alerts as any });
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error inserting document alerts:', error);
    return { data: null, error: String(error) };
  }
};

// Insert document alerts (supports documents_company too)
export const insertDocumentAlertsGeneric = async (
  tableName: 'documents_employees' | 'documents_equipment' | 'documents_company',
  alerts: Record<string, unknown>[]
) => {
  try {
    if (tableName === 'documents_employees') {
      const data = await prisma.documents_employees.createMany({ data: alerts as any });
      return { data, error: null };
    } else if (tableName === 'documents_equipment') {
      const data = await prisma.documents_equipment.createMany({ data: alerts as any });
      return { data, error: null };
    } else {
      const data = await prisma.documents_company.createMany({ data: alerts as any });
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error inserting document alerts:', error);
    return { data: null, error: String(error) };
  }
};

// Fetch document alerts (pending, with null document_path) by type and applies list
export const fetchDocumentAlertsByTypeAndApplies = async (
  tableName: 'documents_employees' | 'documents_equipment' | 'documents_company',
  documentTypeId: string,
  appliesIds: string[]
) => {
  try {
    const where = {
      id_document_types: documentTypeId,
      applies: { in: appliesIds },
    };
    if (tableName === 'documents_employees') {
      const data = await prisma.documents_employees.findMany({ where, select: { id: true, applies: true } });
      return { data, error: null };
    } else if (tableName === 'documents_equipment') {
      const data = await prisma.documents_equipment.findMany({ where, select: { id: true, applies: true } });
      return { data, error: null };
    } else {
      const data = await prisma.documents_company.findMany({ where, select: { id: true, applies: true } });
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error fetching document alerts:', error);
    return { data: null, error: String(error) };
  }
};

// Fetch pending alerts (document_path is null) by type and applies list
export const fetchPendingAlertsByTypeAndApplies = async (
  tableName: 'documents_employees' | 'documents_equipment' | 'documents_company',
  documentTypeId: string,
  appliesIds: string[]
) => {
  try {
    const where = {
      id_document_types: documentTypeId,
      applies: { in: appliesIds },
      document_path: null as any,
    };
    if (tableName === 'documents_employees') {
      const data = await prisma.documents_employees.findMany({ where, select: { id: true } });
      return { data, error: null };
    } else if (tableName === 'documents_equipment') {
      const data = await prisma.documents_equipment.findMany({ where, select: { id: true } });
      return { data, error: null };
    } else {
      const data = await prisma.documents_company.findMany({ where, select: { id: true } });
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error fetching pending alerts:', error);
    return { data: null, error: String(error) };
  }
};

// Delete document alerts by IDs
export const deleteDocumentAlertsByIds = async (
  tableName: 'documents_employees' | 'documents_equipment' | 'documents_company',
  ids: string[]
) => {
  try {
    if (tableName === 'documents_employees') {
      await prisma.documents_employees.deleteMany({ where: { id: { in: ids } } });
    } else if (tableName === 'documents_equipment') {
      await prisma.documents_equipment.deleteMany({ where: { id: { in: ids } } });
    } else {
      await prisma.documents_company.deleteMany({ where: { id: { in: ids } } });
    }
    return { error: null };
  } catch (error) {
    console.error('Error deleting document alerts:', error);
    return { error: String(error) };
  }
};

// Delete all pending alerts (document_path is null) by document type
export const deleteAllPendingAlertsByType = async (
  tableName: 'documents_employees' | 'documents_equipment' | 'documents_company',
  documentTypeId: string
) => {
  try {
    const where = { id_document_types: documentTypeId, document_path: null as any };
    if (tableName === 'documents_employees') {
      await prisma.documents_employees.deleteMany({ where });
    } else if (tableName === 'documents_equipment') {
      await prisma.documents_equipment.deleteMany({ where });
    } else {
      await prisma.documents_company.deleteMany({ where });
    }
    return { error: null };
  } catch (error) {
    console.error('Error deleting pending alerts:', error);
    return { error: String(error) };
  }
};

// Delete pending alerts by IDs (only those with null document_path)
export const deletePendingAlertsByIds = async (
  tableName: 'documents_employees' | 'documents_equipment' | 'documents_company',
  ids: string[]
) => {
  try {
    const where = { id: { in: ids }, document_path: null as any };
    if (tableName === 'documents_employees') {
      await prisma.documents_employees.deleteMany({ where });
    } else if (tableName === 'documents_equipment') {
      await prisma.documents_equipment.deleteMany({ where });
    } else {
      await prisma.documents_company.deleteMany({ where });
    }
    return { error: null };
  } catch (error) {
    console.error('Error deleting pending alerts by ids:', error);
    return { error: String(error) };
  }
};

export const removeDocumentFile = async (bucket: string, paths: string[]) => {
  try {
    await storageServer.remove(bucket as any, paths);
    return { error: null };
  } catch (error) {
    console.error('Error removing document file:', error);
    return { error: String(error) };
  }
};

export const fetchDocumentTypesByAppliesForClient = async (
  applies: string,
  companyId: string,
  multiresource?: boolean
) => {
  try {
    const where: any = {
      applies,
      is_active: true,
      OR: [{ company_id: companyId }, { company_id: null }],
    };
    if (multiresource !== undefined) {
      where.multiresource = multiresource;
    }
    const data = await prisma.document_types.findMany({ where });
    return data;
  } catch (error) {
    console.error('Error fetching document types by applies:', error);
    return [];
  }
};

export const selectDocumentsByPath = async (
  tableName: 'documents_employees' | 'documents_equipment' | 'documents_company',
  documentPath: string
) => {
  try {
    if (tableName === 'documents_employees') {
      return await prisma.documents_employees.findMany({ where: { document_path: documentPath } });
    } else if (tableName === 'documents_equipment') {
      return await prisma.documents_equipment.findMany({ where: { document_path: documentPath } });
    } else {
      return await prisma.documents_company.findMany({ where: { document_path: documentPath } });
    }
  } catch (error) {
    console.error('Error selecting documents by path:', error);
    return [];
  }
};

export const fetchRepairSolicitudesByArrayAndType = async (
  vehiclesIds: string[],
  repairTypeId: string,
  states: string[]
) => {
  try {
    const data = await prisma.repair_solicitudes.findMany({
      where: {
        equipment_id: { in: vehiclesIds },
        reparation_type: repairTypeId,
        state: { in: states as any },
      },
      include: { equipment: true },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching repair solicitudes:', error);
    return [];
  }
};
