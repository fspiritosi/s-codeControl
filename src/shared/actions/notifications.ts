'use server';
import { prisma } from '@/shared/lib/prisma';

// --- From company/queries.ts ---

export const fetchNotificationsByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.notifications.findMany({
      where: { company_id: companyId },
    });
    return (data ?? []);
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
