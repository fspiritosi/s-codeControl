import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking daily report date:', error);
    return NextResponse.json({ error: 'Failed to check daily report date' }, { status: 500 });
  }
}
