'use server';
import { prisma } from '@/shared/lib/prisma';

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

export const updateDocumentsByAppliesArrayAndType = async (
  tableName: 'documents_employees' | 'documents_equipment',
  appliesIds: string[],
  documentTypeId: string,
  updateData: Record<string, unknown>
) => {
  try {
    if (tableName === 'documents_employees') {
      const data = await prisma.documents_employees.updateMany({
        where: { applies: { in: appliesIds }, id_document_types: documentTypeId },
        data: updateData as any,
      });
      return { data, error: null };
    } else {
      const data = await prisma.documents_equipment.updateMany({
        where: { applies: { in: appliesIds }, id_document_types: documentTypeId },
        data: updateData as any,
      });
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error updating documents by applies array and type:', error);
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
