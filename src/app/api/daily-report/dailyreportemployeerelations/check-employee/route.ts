import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking relation employee:', error);
    return NextResponse.json({ error: 'Failed to check relation employee' }, { status: 500 });
  }
}
