'use server';

import { prisma } from '@/shared/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function listCompanyGroups() {
  const groups = await prisma.company_groups.findMany({
    orderBy: { name: 'asc' },
    include: {
      companies: {
        select: { id: true, company_name: true, company_cuit: true },
        orderBy: { company_name: 'asc' },
      },
    },
  });
  return groups;
}

export async function listAllCompaniesForGrouping() {
  return prisma.company.findMany({
    select: {
      id: true,
      company_name: true,
      company_cuit: true,
      company_group_id: true,
    },
    orderBy: { company_name: 'asc' },
  });
}

export async function createCompanyGroup(name: string) {
  if (!name?.trim()) return { error: 'El nombre es requerido' };
  try {
    const group = await prisma.company_groups.create({ data: { name: name.trim() } });
    revalidatePath('/dashboard/company/groups');
    return { data: group, error: null };
  } catch (error) {
    console.error('Error creating company group:', error);
    return { data: null, error: String(error) };
  }
}

export async function updateCompanyGroup(id: string, name: string) {
  if (!name?.trim()) return { error: 'El nombre es requerido' };
  try {
    await prisma.company_groups.update({ where: { id }, data: { name: name.trim() } });
    revalidatePath('/dashboard/company/groups');
    return { error: null };
  } catch (error) {
    console.error('Error updating company group:', error);
    return { error: String(error) };
  }
}

export async function deleteCompanyGroup(id: string) {
  try {
    // Detach companies first (FK is SET NULL on delete, but be explicit)
    await prisma.company.updateMany({ where: { company_group_id: id }, data: { company_group_id: null } });
    await prisma.company_groups.delete({ where: { id } });
    revalidatePath('/dashboard/company/groups');
    return { error: null };
  } catch (error) {
    console.error('Error deleting company group:', error);
    return { error: String(error) };
  }
}

export async function setCompanyGroup(companyId: string, groupId: string | null) {
  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { company_group_id: groupId },
    });
    revalidatePath('/dashboard/company/groups');
    return { error: null };
  } catch (error) {
    console.error('Error assigning company to group:', error);
    return { error: String(error) };
  }
}
