import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const dailyreportequipmentrelations = await prisma.dailyreportequipmentrelations.findMany();

    return apiSuccess({ dailyreportequipmentrelations });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch equipment relations', 500);
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
    const insertData = body.map(({ daily_report_row_id, equipment_id }: any) => ({
      daily_report_row_id,
      equipment_id,
    }));

    await prisma.dailyreportequipmentrelations.createMany({
      data: insertData,
    });

    return apiSuccess(null, 201);
  } catch (error) {
    console.error('Error:', error);
    return apiError((error as Error).message, 500);
  }
}

export async function PUT(request: NextRequest) {
  const { id, ...updateData } = await request.json();

  // Verificar que el ID esté presente
  if (!id) {
    return apiError('ID is required for updating the daily report equipment relation.', 400);
  }

  // Verificar que haya datos para actualizar
  if (Object.keys(updateData).length === 0) {
    return apiError('No data provided for update.', 400);
  }

  try {
    const data = await prisma.dailyreportequipmentrelations.update({
      where: { id },
      data: updateData,
    });

    return apiSuccess({ data });
  } catch (error) {
    console.error('Error inesperado al actualizar la relación de equipo del reporte diario:', error);
    return apiError((error as any).message || 'Unexpected error occurred.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { daily_report_row_id, equipment } = body;

    if (!Array.isArray(equipment)) {
      return apiError('El cuerpo de la solicitud debe contener un array de equipos', 400);
    }

    const deletePromises = equipment.map(async (equip: any) => {
      const { equipment_id } = equip;
      return prisma.dailyreportequipmentrelations.deleteMany({
        where: {
          daily_report_row_id,
          equipment_id,
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
