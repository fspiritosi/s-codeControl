'use server';
import { prisma } from '@/lib/prisma';

export const updateModulesSharedUser = async ({ id, modules }: { id: string; modules: ModulosEnum[] }) => {
  try {
    const data = await prisma.share_company_users.update({
      where: { id },
      data: { modules } as any,
    });
    return [data];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const updateProfileAvatar = async (profileId: string, avatarUrl: string) => {
  try {
    const data = await prisma.profile.update({
      where: { id: profileId },
      data: { avatar: avatarUrl },
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating profile avatar:', error);
    return { data: null, error: String(error) };
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

export const insertGuild = async (name: string, companyId: string) => {
  try {
    const data = await prisma.guild.create({ data: { name, company_id: companyId } });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting guild:', error);
    return { data: null, error: String(error) };
  }
};

export const insertCovenant = async (name: string, companyId?: string, guildId?: string) => {
  try {
    const data = await prisma.covenant.create({ data: { name, company_id: companyId, guild_id: guildId } as any });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting covenant:', error);
    return { data: null, error: String(error) };
  }
};

export const insertCategory = async (name: string, covenantId?: string) => {
  try {
    const data = await prisma.category.create({ data: { name, covenant_id: covenantId } as any });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting category:', error);
    return { data: null, error: String(error) };
  }
};

export const fetchCovenantsByCompany = async (companyId: string) => {
  try {
    const data = await prisma.covenant.findMany({
      where: { is_active: true, company_id: companyId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching covenants by company:', error);
    return [];
  }
};

export const fetchCategoryById = async (id: string) => {
  try {
    const data = await prisma.category.findMany({ where: { id } });
    return data;
  } catch (error) {
    console.error('Error fetching category by id:', error);
    return [];
  }
};

export const fetchCustomerById = async (id: string) => {
  try {
    const data = await prisma.customers.findUnique({ where: { id } });
    return data;
  } catch (error) {
    console.error('Error fetching customer by id:', error);
    return null;
  }
};

export const fetchContactById = async (id: string) => {
  try {
    const data = await prisma.contacts.findMany({ where: { id } });
    return data;
  } catch (error) {
    console.error('Error fetching contact by id:', error);
    return [];
  }
};

export const fetchCustomersByCompany = async (companyId: string) => {
  try {
    const data = await prisma.customers.findMany({
      where: { is_active: true, company_id: companyId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching customers by company:', error);
    return [];
  }
};

export const fetchRoles = async () => {
  try {
    const data = await prisma.roles.findMany({
      where: { intern: false, NOT: { name: 'Invitado' } },
    });
    return data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
};

export const fetchProfileByEmail = async (email: string) => {
  try {
    const data = await prisma.profile.findMany({
      where: { email },
    });
    return data;
  } catch (error) {
    console.error('Error fetching profile by email:', error);
    return [];
  }
};

export const fetchShareCompanyUsersByProfileAndCompany = async (profileId: string, companyId: string) => {
  try {
    const data = await prisma.share_company_users.findMany({
      where: { profile_id: profileId, company_id: companyId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching share company users:', error);
    return [];
  }
};

export const insertShareCompanyUser = async (shareData: Record<string, unknown>) => {
  try {
    const data = await prisma.share_company_users.create({ data: shareData as any });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting share company user:', error);
    return { data: null, error: String(error) };
  }
};

export const insertProfile = async (profileData: Record<string, unknown>) => {
  try {
    const data = await prisma.profile.create({ data: profileData as any });
    return { data: [data], error: null };
  } catch (error) {
    console.error('Error inserting profile:', error);
    return { data: null, error: String(error) };
  }
};

export const deleteShareCompanyUser = async (id: string) => {
  try {
    await prisma.share_company_users.delete({ where: { id } });
    return { error: null };
  } catch (error) {
    console.error('Error deleting share company user:', error);
    return { error: String(error) };
  }
};

export const updateShareCompanyUserRole = async (id: string, role: string) => {
  try {
    const data = await prisma.share_company_users.update({
      where: { id },
      data: { role },
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating share company user role:', error);
    return { data: null, error: String(error) };
  }
};

export const updateContactById = async (id: string, updateData: Record<string, unknown>) => {
  try {
    const data = await prisma.contacts.update({
      where: { id },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating contact:', error);
    return { data: null, error: String(error) };
  }
};

export const updateContactDeactivate = async (id: string, companyId: string, terminationDate: string, reason: string) => {
  try {
    const data = await prisma.contacts.updateMany({
      where: { id, company_id: companyId },
      data: {
        is_active: false,
        termination_date: terminationDate,
        reason_for_termination: reason,
      } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error deactivating contact:', error);
    return { data: null, error: String(error) };
  }
};

export const reactivateContact = async (id: string) => {
  try {
    const data = await prisma.contacts.update({
      where: { id },
      data: {
        is_active: true,
        termination_date: null,
        reason_for_termination: null,
      } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error reactivating contact:', error);
    return { data: null, error: String(error) };
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

export const insertCompany = async (company: Record<string, unknown>) => {
  try {
    const data = await prisma.company.create({ data: company as any });
    return { data: [data], error: null };
  } catch (error) {
    console.error('Error inserting company:', error);
    return { data: null, error: String(error) };
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

export const insertProfileServer = async (profileData: Record<string, unknown>) => {
  try {
    const data = await prisma.profile.create({ data: profileData as any });
    return { data: [data], error: null };
  } catch (error) {
    console.error('Error inserting profile:', error);
    return { data: null, error: String(error) };
  }
};

export const fetchProfileByEmailServer = async (email: string) => {
  try {
    const data = await prisma.profile.findMany({ where: { email } });
    return data;
  } catch (error) {
    console.error('Error fetching profile by email:', error);
    return [];
  }
};

export const logErrorMessage = async (message: string, path: string) => {
  try {
    await prisma.handle_errors.create({ data: { menssage: message, path } as any });
    return { error: null };
  } catch (error) {
    console.error('Error logging error message:', error);
    return { error: String(error) };
  }
};

export const fetchCompanyWithRelationsByOwner = async (ownerId: string) => {
  try {
    const data = await prisma.company.findMany({
      where: { owner_id: ownerId },
      include: {
        owner: true,
        share_company_users: { include: { profile: true } },
        city_rel: { select: { name: true, id: true } },
        province_rel: { select: { name: true, id: true } },
        companies_employees: {
          include: {
            employee: {
              include: {
                city_rel: { select: { name: true } },
                province_rel: { select: { name: true } },
                workflow_diagram_rel: { select: { name: true } },
                hierarchy_rel: { select: { name: true } },
                birthplace_rel: { select: { name: true } },
                contractor_employee: { include: { contractor: true } },
              },
            },
          },
        },
      },
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching company with relations:', error);
    return { data: null, error: String(error) };
  }
};
