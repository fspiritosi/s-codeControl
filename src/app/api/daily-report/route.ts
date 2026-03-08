import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  try {
    const dailyReports = await prisma.dailyreport.findMany({
      where: { company_id: company_id || '' },
    });

    return NextResponse.json({ dailyReports });
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    return NextResponse.json({ error: 'Failed to fetch daily reports' }, { status: 500 });
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

    return NextResponse.json({ data: [data] });
  } catch (error) {
    console.error('Error inserting daily report:', error);
    return NextResponse.json({ error: 'Failed to insert daily report' }, { status: 500 });
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

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating daily report:', error);
    return NextResponse.json({ error: 'Failed to update daily report' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('actual');
  const { id } = await request.json();

  if (!companyId) {
    return new Response(JSON.stringify({ error: 'Company ID is required' }), { status: 400 });
  }

  try {
    const dailyReport = await prisma.dailyreport.findUnique({
      where: { id },
      select: { company_id: true },
    });

    if (!dailyReport) {
      return new Response(JSON.stringify({ error: 'Daily report not found' }), { status: 404 });
    }

    if (dailyReport.company_id !== companyId) {
      return new Response(JSON.stringify({ error: 'Company ID mismatch' }), { status: 403 });
    }

    const data = await prisma.dailyreport.delete({
      where: { id },
    });

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
}
