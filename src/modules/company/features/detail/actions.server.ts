'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

export const fetchCurrentCompany = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.company.findMany({
      where: { id: companyId },
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching company:', error);
    return [];
  }
};

export const fetchCompanyDocuments = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.documents_company.findMany({
      where: { applies: companyId },
      include: {
        document_type: true,
        user: true,
      },
    });
    return (data || []);
  } catch (error) {
    console.error('Error fetching company documents:', error);
    return [];
  }
};

export async function getCompanyDetails(companyId: string) {
  try {
    const data = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, company_name: true, website: true, contact_email: true, company_logo: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching company details:', error);
    return null;
  }
}

export const resetCompanyDefect = async (ownerId: string) => {
  if (!ownerId) return { error: 'No owner ID' };
  try {
    await prisma.company.updateMany({
      where: { owner_id: ownerId },
      data: { by_defect: false },
    });
    return { error: null };
  } catch (error) {
    console.error('Error resetting default company:', error);
    return { error: String(error) };
  }
};

export const setCompanyAsDefect = async (companyId: string) => {
  if (!companyId) return { error: 'No company ID' };
  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { by_defect: true },
    });
    return { error: null };
  } catch (error) {
    console.error('Error setting default company:', error);
    return { error: String(error) };
  }
};

export const setCompanyByDefect = async (companyId: string) => {
  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { by_defect: true },
    });
    return { error: null };
  } catch (error) {
    console.error('Error setting company by defect:', error);
    return { error: String(error) };
  }
};

export const updateDocumentCompanyByAppliesAndType = async (
  companyId: string,
  documentTypeId: string,
  updateData: Record<string, unknown>
) => {
  try {
    const data = await prisma.documents_company.updateMany({
      where: { applies: companyId, id_document_types: documentTypeId },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating document company:', error);
    return { data: null, error: String(error) };
  }
};

export const updateDocumentTypePrivate = async (id: string, isPrivate: boolean) => {
  try {
    await prisma.document_types.update({
      where: { id },
      data: { private: isPrivate },
    });
    return { error: null };
  } catch (error) {
    console.error('Error updating document type private:', error);
    return { error: String(error) };
  }
};

export const updateCompanyLogoByCuit = async (cuit: string, logoUrl: string) => {
  try {
    await prisma.company.updateMany({
      where: { company_cuit: cuit },
      data: { company_logo: logoUrl },
    });
    return { error: null };
  } catch (error) {
    console.error('Error updating company logo:', error);
    return { error: String(error) };
  }
};

export const updateCompanyById = async (companyId: string, company: Record<string, unknown>) => {
  try {
    const data = await prisma.company.update({ where: { id: companyId }, data: company as any });
    return { data: [data], error: null };
  } catch (error) {
    console.error('Error updating company:', error);
    return { data: null, error: String(error) };
  }
};

export const deleteCompanyById = async (companyId: string) => {
  try {
    await prisma.company.delete({ where: { id: companyId } });
    return { error: null };
  } catch (error) {
    console.error('Error deleting company:', error);
    return { error: String(error) };
  }
};

export const logicDeleteCompanyById = async (companyId: string) => {
  try {
    const data = await prisma.company.update({ where: { id: companyId }, data: { is_active: false } as any });
    return { data: [data], error: null };
  } catch (error) {
    console.error('Error logic deleting company:', error);
    return { data: null, error: String(error) };
  }
};
