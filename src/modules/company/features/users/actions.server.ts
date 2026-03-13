'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

export const getAllUsers = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.share_company_users.findMany({
      where: { company_id: companyId },
      include: {
        profile: true,
        customer: true,
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const getUsersbyId = async ({ id }: { id: string }) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.share_company_users.findMany({
      where: { company_id: companyId, id: id || '' },
      include: { profile: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const getOwnerUser = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const company = await prisma.company.findMany({
      where: { id: companyId },
    });
    if (!company || company.length === 0) return [];

    const data = await prisma.profile.findMany({
      where: { id: company[0]?.owner_id || '' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching owner user:', error);
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

export const fetchSharedUsersByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.share_company_users.findMany({
      where: { company_id: companyId },
      include: {
        customer: true,
        profile: true,
        company: {
          include: {
            owner: true,
            share_company_users: { include: { profile: true } },
            city_rel: { select: { name: true, id: true } },
            province_rel: { select: { name: true, id: true } },
            employees: {
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
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching shared users:', error);
    return [];
  }
};
