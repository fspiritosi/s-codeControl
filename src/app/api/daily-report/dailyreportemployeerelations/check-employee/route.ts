import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { rowId, employees } = await request.json();

  try {
    const dailyreportemployeerelations = await prisma.dailyreportemployeerelations.findMany({
      where: {
        daily_report_row_id: rowId,
        employee_id: { in: employees },
      },
    });

    const exists = dailyreportemployeerelations && dailyreportemployeerelations.length > 0;

    return apiSuccess({ exists });
  } catch (error) {
    console.error('Error checking relation employee:', error);
    return apiError('Failed to check relation employee', 500);
  }
}
