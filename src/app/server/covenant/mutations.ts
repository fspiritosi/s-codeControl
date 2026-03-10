'use server';
import { prisma } from '@/lib/prisma';

// -- Covenant mutations --

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

// -- Category mutations --

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

// -- Guild mutations --

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

// Deactivate guild + all its covenants + all categories under those covenants
export const deactivateGuildCascade = async (guildId: string) => {
  try {
    // Deactivate the guild
    await prisma.guild.update({ where: { id: guildId }, data: { is_active: false } });

    // Find covenants under this guild
    const covenants = await prisma.covenant.findMany({
      where: { guild_id: guildId },
      select: { id: true },
    });
    const covenantIds = covenants.map((c) => c.id);

    // Deactivate covenants
    await prisma.covenant.updateMany({
      where: { guild_id: guildId },
      data: { is_active: false },
    });

    // Deactivate categories under those covenants
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
