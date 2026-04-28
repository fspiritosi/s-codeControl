'use server';
import { prisma } from '@/shared/lib/prisma';

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
      },
    });
    return (data ?? []);
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
          },
        },
      },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching shared companies:', error);
    return [];
  }
};

export const fetchAllCompaniesWithRelations = async () => {
  try {
    const data = await prisma.company.findMany({
      include: {
        province_rel: { select: { id: true, name: true } },
        city_rel: { select: { id: true, name: true } },
        companies_employees: true,
        share_company_users: true,
      },
    });
    return data as any ?? [];
  } catch (error) {
    console.error('Error fetching all companies:', error);
    return [];
  }
};

export const fetchCompaniesByOwnerId = async (ownerId: string) => {
  try {
    const data = await prisma.company.findMany({
      where: { owner_id: ownerId },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching companies by owner:', error);
    return [];
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
