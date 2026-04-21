'use server';
import { prisma } from '@/shared/lib/prisma';
import { storageServer } from '@/shared/lib/storage-server';
import { getActionContext } from '@/shared/lib/server-action-context';

export const fetchSingEmployee = async (employeesId: string) => {
  //Traer el tipo de documento que se llame firma
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const docType = await prisma.document_types.findFirst({
      where: { name: 'Firma', is_active: true },
      select: { id: true },
    });

    const employeeSingDocument = await prisma.documents_employees.findMany({
      where: {
        id_document_types: docType?.id || '',
        applies: employeesId,
        document_path: { not: null },
        is_active: true,
      },
    });

    const publicUrl = await storageServer.getPublicUrl('document_files', employeeSingDocument?.[0]?.document_path || '');


    return publicUrl || null;
  } catch (error) {
    console.error('Error fetching document type:', error);
    return null;
  }
};
