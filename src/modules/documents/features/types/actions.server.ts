'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import type { Prisma } from '@/generated/prisma/client';

export const updateDocumentType = async (id: string, data: Prisma.document_typesUpdateInput | Record<string, unknown>): Promise<{ message: string } | null> => {
  const { companyId } = await getActionContext();
  if (!companyId) return { message: 'No company context' };

  try {
    await prisma.document_types.update({
      where: { id },
      data: data as Prisma.document_typesUpdateInput,
    });
    return null;
  } catch (error) {
    return { message: error instanceof Error ? error.message : String(error) };
  }
};

export const fettchExistingEntries = async (applies: string, id_document_types: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    if (applies === 'Equipos') {
      const data = await prisma.documents_equipment.findMany({
        where: {
          id_document_types,
          vehicle: {
            is: { company_id: companyId, is_active: true },
          },
        },
        include: { vehicle: true },
        // Return id and applies (vehicle)
      });
      return data.map((d) => ({ id: d.id, applies: d.vehicle }));
    } else if (applies === 'Persona') {
      const data = await prisma.documents_employees.findMany({
        where: {
          id_document_types,
          employee: {
            is: { company_id: companyId, is_active: true },
          },
        },
        include: { employee: true },
      });
      return data.map((d) => ({ id: d.id, applies: d.employee }));
    }
    return [];
  } catch (error) {
    console.error('Error al obtener los recursos con documentos:', error);
    return;
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
