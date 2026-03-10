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
