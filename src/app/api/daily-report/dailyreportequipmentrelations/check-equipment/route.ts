import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { rowId, equipment } = await request.json();

  try {
    const dailyreportequipmentrelations = await prisma.dailyreportequipmentrelations.findMany({
      where: {
        daily_report_row_id: rowId,
        equipment_id: { in: equipment },
      },
    });

    const exists = dailyreportequipmentrelations && dailyreportequipmentrelations.length > 0;

    return apiSuccess({ exists });
  } catch (error) {
    console.error('Error checking relation equipment:', error);
    return apiError('Failed to check relation equipment', 500);
  }
}
