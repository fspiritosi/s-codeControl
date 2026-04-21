import { prisma } from '@/shared/lib/prisma';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  try {
    const dailyReports = await prisma.dailyreport.findMany({
      where: { company_id: company_id || '' },
    });

    return apiSuccess({ dailyReports });
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    return apiError('Failed to fetch daily reports', 500);
  }
}

export async function POST(request: NextRequest) {
  const { date, company_id } = await request.json();

  try {
    const data = await prisma.dailyreport.create({
      data: {
        date,
        company_id,
      },
    });

    return apiSuccess({ data: [data] }, 201);
  } catch (error) {
    console.error('Error inserting daily report:', error);
    return apiError('Failed to insert daily report', 500);
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const { date, status } = await request.json();
  const statusPayload = status === 'cerrado' ? false : status;
  try {
    const data = await prisma.dailyreport.update({
      where: { id: id || '' },
      data: { status: statusPayload },
    });

    return apiSuccess({ data });
  } catch (error) {
    console.error('Error updating daily report:', error);
    return apiError('Failed to update daily report', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('actual');
  const { id } = await request.json();

  if (!companyId) {
    return apiError('Company ID is required', 400);
  }

  try {
    const dailyReport = await prisma.dailyreport.findUnique({
      where: { id },
      select: { company_id: true },
    });

    if (!dailyReport) {
      return apiError('Daily report not found', 404);
    }

    if (dailyReport.company_id !== companyId) {
      return apiError('Company ID mismatch', 403);
    }

    const data = await prisma.dailyreport.delete({
      where: { id },
    });

    return apiSuccess({ data });
  } catch (error) {
    return apiError((error as any).message, 500);
  }
}
