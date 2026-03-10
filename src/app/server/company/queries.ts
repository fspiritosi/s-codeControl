'use server';
import { prisma } from '@/lib/prisma';
import { supabaseServer } from '@/lib/supabase/server';
import { getActionContext } from '@/lib/server-action-context';

// Company-related queries

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

export const fetchCustomers = async () => {
  const { companyId } = await getActionContext();

  try {
    const data = await prisma.customers.findMany({
      where: { is_active: true, company_id: companyId || '' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching customers:', error);
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
    return (data || []) as any[];
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

export const fetchCompaniesByOwner = async (ownerId: string) => {
  if (!ownerId) return [];
  try {
    const data = await prisma.company.findMany({
      where: { owner_id: ownerId },
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
    });
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching companies by owner:', error);
    return [];
  }
};

export const fetchSharedCompaniesByProfile = async (profileId: string) => {
  if (!profileId) return [];
  try {
    const data = await prisma.share_company_users.findMany({
      where: { profile_id: profileId },
      include: {
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
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching shared companies:', error);
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
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching shared users:', error);
    return [];
  }
};

export const fetchNotificationsByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.notifications.findMany({
      where: { company_id: companyId },
    });
    return (data ?? []) as any[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const deleteNotificationsByCompany = async (companyId: string) => {
  if (!companyId) return { error: 'No company ID' };
  try {
    await prisma.notifications.deleteMany({
      where: { company_id: companyId },
    });
    return { error: null };
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return { error: String(error) };
  }
};

export const fetchCountries = async () => {
  try {
    const data = await prisma.countries.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
};

export const fetchCitiesByProvince = async (provinceId: number) => {
  try {
    const data = await prisma.cities.findMany({
      where: { province_id: provinceId },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};

export const fetchProvinces = async () => {
  try {
    const data = await prisma.provinces.findMany({
      select: { id: true, name: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
};

export const fetchContactsWithCustomers = async () => {
  try {
    const data = await prisma.contacts.findMany({
      include: { customer: { select: { id: true, name: true } } },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
};

export const fetchProfileByCredentialId = async (credentialId: string) => {
  if (!credentialId) return [];
  try {
    const data = await prisma.profile.findMany({
      where: { credential_id: credentialId },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching profile:', error);
    return [];
  }
};

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

export const fetchCurrentUser = async () => {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

export const getCurrentProfile = async () => {
  const user = await fetchCurrentUser();

  if (!user) return [];

  try {
    const data = await prisma.profile.findMany({
      where: { id: user?.id || '' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching current profile:', error);
    return [];
  }
};

export const verifyUserRoleInCompany = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return '';

  const user = await fetchCurrentUser();

  try {
    const data = await prisma.share_company_users.findMany({
      where: { profile_id: user?.id || '', company_id: companyId },
    });

    return { rol: data[0]?.role || '', modulos: data[0]?.modules || [] };
  } catch (error) {
    console.error('Error verifying user role:', error);
    return '';
  }
};

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
    return data as any[];
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
    return data as any[];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const getOwnerUser = async () => {
  const curretUser = await fetchCurrentCompany();
  if (!curretUser) return [];

  try {
    const data = await prisma.profile.findMany({
      where: { id: (curretUser as any)[0]?.owner_id || '' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching owner user:', error);
    return [];
  }
};
