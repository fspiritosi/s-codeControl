import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  try {
    const dailyreportrowsRaw = await prisma.dailyreportrows.findMany({
      where: {
        daily_report: {
          is: { company_id: company_id as string },
        },
      },
      include: {
        daily_report: { select: { date: true, company_id: true } },
        customer: { select: { name: true } },
        service: { select: { service_name: true } },
        item: { select: { item_name: true } },
      },
    });

    // Remap to match previous Supabase response shape
    const dailyreportrows = dailyreportrowsRaw.map((row: any) => {
      const { daily_report, customer, service, item, ...rest } = row;
      return {
        ...rest,
        daily_report_id: daily_report,
        customer_id: customer,
        service_id: service,
        item_id: item,
      };
    });

    return new Response(JSON.stringify({ dailyreportrows }), { status: 200 });
  } catch (error) {
    console.error('Error fetching daily report rows:', error);
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { daily_report_id, customer_id, service_id, item_id, working_day, start_time, end_time, description } =
      await request.json();
    // Crear el objeto de inserción, omitiendo start_time y end_time si están vacíos
    const insertData: any = {
      daily_report_id,
      customer_id,
      service_id,
      item_id,
      working_day,
      description,
    };

    if (start_time) {
      insertData.start_time = start_time;
    }

    if (end_time) {
      insertData.end_time = end_time;
    }

    const data = await prisma.dailyreportrows.create({
      data: insertData,
    });

    return new Response(JSON.stringify({ data: [data] }), { status: 201 });
  } catch (error) {
    console.error('Error inserting daily report row:', error);
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const updateData = await request.json();
  if (!id) {
    return new NextResponse(JSON.stringify({ error: 'ID is required for updating the daily report row.' }), {
      status: 400,
    });
  }

  try {
    // Crear el objeto de actualización, asegurando que start_time y end_time sean null si están vacíos
    const updateFields: any = { ...updateData };

    if (updateData.start_time === '') {
      updateFields.start_time = null;
    }

    if (updateData.end_time === '') {
      updateFields.end_time = null;
    }

    const data = await prisma.dailyreportrows.update({
      where: { id },
      data: updateFields,
    });

    return new NextResponse(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    console.error('Error inesperado al actualizar la fila de reporte diario:', error);
    return new NextResponse(JSON.stringify({ error: (error as any).message || 'Unexpected error occurred.' }), {
      status: 500,
    });
  }
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  try {
    const data = await prisma.dailyreportrows.delete({
      where: { id },
    });

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    console.error('Error deleting daily report row:', error);
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
}
