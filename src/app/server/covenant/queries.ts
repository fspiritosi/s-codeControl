'use server';
import { prisma } from '@/lib/prisma';

export const fetchCovenantsByCompany = async (companyId: string) => {
  try {
    const data = await prisma.covenant.findMany({ where: { company_id: companyId } });
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching covenants:', error);
    return { data: null, error: String(error) };
  }
};

export const fetchCategoriesByCompany = async (companyId: string) => {
  try {
    const data = await prisma.category.findMany({
      where: { covenant: { company_id: companyId } },
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { data: null, error: String(error) };
  }
};

export const fetchGuildsByCompany = async (companyId: string) => {
  try {
    const data = await prisma.guild.findMany({ where: { company_id: companyId } });
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching guilds:', error);
    return { data: null, error: String(error) };
  }
};
