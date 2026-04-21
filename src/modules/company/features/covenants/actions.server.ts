'use server';
import { prisma } from '@/shared/lib/prisma';

// --- Queries ---

export const fetchCovenantsByCompanyAll = async (companyId: string) => {
  try {
    const data = await prisma.covenant.findMany({ where: { company_id: companyId } });
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching covenants:', error);
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

export const fetchCategoryById = async (id: string) => {
  try {
    const data = await prisma.category.findMany({ where: { id } });
    return data;
  } catch (error) {
    console.error('Error fetching category by id:', error);
    return [];
  }
};

// --- Mutations ---

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

export const updateCovenantById = async (id: string, data: Record<string, unknown>) => {
  try {
    const result = await prisma.covenant.update({ where: { id }, data: data as any });
    return { data: result, error: null };
  } catch (error) {
    console.error('Error updating covenant:', error);
    return { data: null, error: String(error) };
  }
};

export const deactivateCovenantAndCategories = async (
  covenantId: string,
  companyId: string
) => {
  try {
    await prisma.covenant.update({
      where: { id: covenantId },
      data: { is_active: false },
    });
    await prisma.category.updateMany({
      where: { covenant_id: covenantId },
      data: { is_active: false },
    });
    return { error: null };
  } catch (error) {
    console.error('Error deactivating covenant:', error);
    return { error: String(error) };
  }
};

export const reactivateCovenant = async (id: string) => {
  try {
    await prisma.covenant.update({ where: { id }, data: { is_active: true } });
    return { error: null };
  } catch (error) {
    console.error('Error reactivating covenant:', error);
    return { error: String(error) };
  }
};

export const updateCategoryById = async (id: string, data: Record<string, unknown>) => {
  try {
    const result = await prisma.category.update({ where: { id }, data: data as any });
    return { data: result, error: null };
  } catch (error) {
    console.error('Error updating category:', error);
    return { data: null, error: String(error) };
  }
};

export const reactivateCategory = async (id: string) => {
  try {
    await prisma.category.update({ where: { id }, data: { is_active: true } });
    return { error: null };
  } catch (error) {
    console.error('Error reactivating category:', error);
    return { error: String(error) };
  }
};

export const deactivateCategory = async (id: string) => {
  try {
    await prisma.category.update({ where: { id }, data: { is_active: false } });
    return { error: null };
  } catch (error) {
    console.error('Error deactivating category:', error);
    return { error: String(error) };
  }
};

export const updateGuildById = async (id: string, data: Record<string, unknown>) => {
  try {
    const result = await prisma.guild.update({ where: { id }, data: data as any });
    return { data: result, error: null };
  } catch (error) {
    console.error('Error updating guild:', error);
    return { data: null, error: String(error) };
  }
};

export const reactivateGuild = async (id: string) => {
  try {
    await prisma.guild.update({ where: { id }, data: { is_active: true } });
    return { error: null };
  } catch (error) {
    console.error('Error reactivating guild:', error);
    return { error: String(error) };
  }
};

export const deactivateGuild = async (id: string) => {
  try {
    await prisma.guild.update({ where: { id }, data: { is_active: false } });
    return { error: null };
  } catch (error) {
    console.error('Error deactivating guild:', error);
    return { error: String(error) };
  }
};

export const deactivateGuildCascade = async (guildId: string) => {
  try {
    await prisma.guild.update({ where: { id: guildId }, data: { is_active: false } });

    const covenants = await prisma.covenant.findMany({
      where: { guild_id: guildId },
      select: { id: true },
    });
    const covenantIds = covenants.map((c) => c.id);

    await prisma.covenant.updateMany({
      where: { guild_id: guildId },
      data: { is_active: false },
    });

    if (covenantIds.length > 0) {
      await prisma.category.updateMany({
        where: { covenant_id: { in: covenantIds } },
        data: { is_active: false },
      });
    }

    return { error: null };
  } catch (error) {
    console.error('Error deactivating guild cascade:', error);
    return { error: String(error) };
  }
};
