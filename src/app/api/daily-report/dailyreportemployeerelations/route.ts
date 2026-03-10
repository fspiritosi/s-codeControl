import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const dailyreportemployeerelations = await prisma.dailyreportemployeerelations.findMany();

    return apiSuccess({ dailyreportemployeerelations });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch employee relations', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Asegúrate de que body es un array
    if (!Array.isArray(body)) {
      return apiError('El cuerpo de la solicitud debe ser un array', 400);
    }

    // Iterar sobre el array y procesar cada objeto
    const insertData = body.map(({ daily_report_row_id, employee_id }: any) => ({
      daily_report_row_id,
      employee_id,
    }));

    await prisma.dailyreportemployeerelations.createMany({
      data: insertData,
    });

    return apiSuccess(null, 201);
  } catch (error: any) {
    console.error('Error:', error);
    return apiError(error.message, 500);
  }
}

export async function PUT(request: NextRequest) {
  const { id, ...updateData } = await request.json();

  if (!id) {
    return apiError('ID is required for updating the daily report row.', 400);
  }

  if (Object.keys(updateData).length === 0) {
    return apiError('No data provided for update.', 400);
  }

  try {
    const data = await prisma.dailyreportemployeerelations.update({
      where: { id },
      data: updateData,
    });

    return apiSuccess({ data });
  } catch (error) {
    console.error('Error inesperado al actualizar la fila de reporte diario:', error);
    return apiError((error as any).message || 'Unexpected error occurred.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { daily_report_row_id, employees } = body;

    if (!Array.isArray(employees)) {
      return apiError('El cuerpo de la solicitud debe contener un array de empleados', 400);
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

    return apiSuccess({ data: 'Relaciones eliminadas correctamente' });
  } catch (error) {
    console.error('Error al eliminar las relaciones:', error);
    return apiError('Error al eliminar las relaciones', 500);
  }
}
