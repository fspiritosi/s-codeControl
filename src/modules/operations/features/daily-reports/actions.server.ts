'use server';
import { prisma } from '@/shared/lib/prisma';

export const fetchDailyReportRowById = async (id: string) => {
  try {
    const data = await prisma.dailyreportrows.findUnique({ where: { id } });
    return data;
  } catch (error) {
    console.error('Error fetching daily report row:', error);
    return null;
  }
};

export const updateDailyReportRow = async (id: string, updateData: Record<string, unknown>) => {
  try {
    const data = await prisma.dailyreportrows.update({
      where: { id },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating daily report row:', error);
    return { data: null, error: String(error) };
  }
};
