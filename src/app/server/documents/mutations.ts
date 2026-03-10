'use server';
import { prisma } from '@/lib/prisma';
import { storageServer } from '@/lib/storage-server';

// -- Document state mutations --

export const updateDocumentEmployeeState = async (
  id: string,
  state: string,
  extra?: Record<string, unknown>
) => {
  try {
    const data = await prisma.documents_employees.update({
      where: { id },
      data: { state, ...extra } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating document employee state:', error);
    return { data: null, error: String(error) };
  }
};

export const updateDocumentEquipmentState = async (
  id: string,
  state: string,
  extra?: Record<string, unknown>
) => {
  try {
    const data = await prisma.documents_equipment.update({
      where: { id },
      data: { state, ...extra } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating document equipment state:', error);
    return { data: null, error: String(error) };
  }
};

export const updateDocumentCompanyByPath = async (
  documentPath: string,
  updateData: Record<string, unknown>
) => {
  try {
    const data = await prisma.documents_company.updateMany({
      where: { document_path: documentPath },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating document company:', error);
    return { data: null, error: String(error) };
  }
};

export const updateDocumentEmployeeByPath = async (
  documentPath: string,
  updateData: Record<string, unknown>
) => {
  try {
    const data = await prisma.documents_employees.updateMany({
      where: { document_path: documentPath },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating document employee by path:', error);
    return { data: null, error: String(error) };
  }
};

export const updateDocumentEquipmentByPath = async (
  documentPath: string,
  updateData: Record<string, unknown>
) => {
  try {
    const data = await prisma.documents_equipment.updateMany({
      where: { document_path: documentPath },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating document equipment by path:', error);
    return { data: null, error: String(error) };
  }
};

export const updateDocumentById = async (
  tableName: 'documents_employees' | 'documents_equipment' | 'documents_company',
  id: string,
  updateData: Record<string, unknown>
) => {
  try {
    if (tableName === 'documents_employees') {
      const data = await prisma.documents_employees.update({ where: { id }, data: updateData as any });
      return { data, error: null };
    } else if (tableName === 'documents_equipment') {
      const data = await prisma.documents_equipment.update({ where: { id }, data: updateData as any });
      return { data, error: null };
    } else {
      const data = await prisma.documents_company.update({ where: { id }, data: updateData as any });
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error updating document by id:', error);
    return { data: null, error: String(error) };
  }
};

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

export const insertDocumentType = async (formattedValues: any) => {
  try {
    const data = await prisma.document_types.create({ data: formattedValues });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting document type:', error);
    return { data: null, error: String(error) };
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

export const updateDocumentByAppliesAndType = async (
  tableName: 'documents_employees' | 'documents_equipment',
  appliesId: string,
  documentTypeId: string,
  updateData: Record<string, unknown>
) => {
  try {
    if (tableName === 'documents_employees') {
      const data = await prisma.documents_employees.updateMany({
        where: { applies: appliesId, id_document_types: documentTypeId },
        data: updateData as any,
      });
      return { data, error: null };
    } else {
      const data = await prisma.documents_equipment.updateMany({
        where: { applies: appliesId, id_document_types: documentTypeId },
        data: updateData as any,
      });
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error updating document by applies and type:', error);
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

export const deleteDocumentEmployeeById = async (id: string) => {
  try {
    await prisma.documents_employees.delete({ where: { id } });
    return { error: null };
  } catch (error) {
    console.error('Error deleting document employee:', error);
    return { error: String(error) };
  }
};

export const deleteDocumentEquipmentById = async (id: string) => {
  try {
    await prisma.documents_equipment.delete({ where: { id } });
    return { error: null };
  } catch (error) {
    console.error('Error deleting document equipment:', error);
    return { error: String(error) };
  }
};

export const updateDocumentTypeActive = async (id: string, isActive: boolean) => {
  try {
    await prisma.document_types.update({
      where: { id },
      data: { is_active: isActive },
    });
    return { error: null };
  } catch (error) {
    console.error('Error updating document type active state:', error);
    return { error: String(error) };
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
