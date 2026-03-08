import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const dailyreportemployeerelations = await prisma.dailyreportemployeerelations.findMany();

    return Response.json({ dailyreportemployeerelations });
  } catch (error) {}
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Asegúrate de que body es un array
    if (!Array.isArray(body)) {
      throw new Error('El cuerpo de la solicitud debe ser un array');
    }

    // Iterar sobre el array y procesar cada objeto
    const insertData = body.map(({ daily_report_row_id, employee_id }: any) => ({
      daily_report_row_id,
      employee_id,
    }));

    await prisma.dailyreportemployeerelations.createMany({
      data: insertData,
    });

    return NextResponse.json({ data: null });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { id, ...updateData } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID is required for updating the daily report row.' }), {
      status: 400,
    });
  }

  if (Object.keys(updateData).length === 0) {
    return new Response(JSON.stringify({ error: 'No data provided for update.' }), { status: 400 });
  }

  try {
    const data = await prisma.dailyreportemployeerelations.update({
      where: { id },
      data: updateData,
    });

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    console.error('Error inesperado al actualizar la fila de reporte diario:', error);
    return new Response(JSON.stringify({ error: (error as any).message || 'Unexpected error occurred.' }), {
      status: 500,
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { daily_report_row_id, employees } = body;

    if (!Array.isArray(employees)) {
      throw new Error('El cuerpo de la solicitud debe contener un array de empleados');
    }

    const deletePromises = employees.map(async (employee: any) => {
      const { employee_id } = employee;
      return prisma.dailyreportemployeerelations.deleteMany({
        where: {
          daily_report_row_id,
          employee_id,
        },
      });
    });

    await Promise.all(deletePromises);

    return NextResponse.json({ data: 'Relaciones eliminadas correctamente' });
  } catch (error) {
    console.error('Error al eliminar las relaciones:', error);
    return NextResponse.json({ error: 'Error al eliminar las relaciones' }, { status: 500 });
  }
}
