import { prisma } from '@/shared/lib/prisma';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  const company_id = searchParams.get('company_id');

  try {
    const existingReport = await prisma.dailyreport.findFirst({
      where: {
        date: date || '',
        company_id: company_id || '',
      },
    });

    const exists = !!existingReport;

    return apiSuccess({ exists });
  } catch (error) {
    console.error('Error checking daily report date:', error);
    return apiError('Failed to check daily report date', 500);
  }
}
