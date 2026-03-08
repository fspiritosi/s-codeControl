import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  let { rows, daily_report_id } = await request.json();

  if (!rows || rows.length === 0) {
    return new Response(JSON.stringify({ error: 'No se enviaron filas de reporte.' }), { status: 400 });
  }

  if (!daily_report_id) {
    return new Response(JSON.stringify({ error: 'daily_report_id es requerido.' }), { status: 400 });
  }

  try {
    const rowsPromises = rows.map(async (row: any) => {
      const { id, customer, services, item, start_time, end_time, status, description, employees, equipment } = row;

      if (!id || id === '') {
        // Insertar nueva fila
        const newRow = await prisma.dailyreportrows.create({
          data: {
            daily_report_id,
            customer_id: customer,
            service_id: services,
            item_id: item,
            start_time,
            end_time,
            status,
            description,
          },
        });

        const newRowId = newRow.id;
        await insertEmployeeAndEquipmentRelations(newRowId, employees, equipment);
      } else {
        // Actualizar fila existente
        await prisma.dailyreportrows.update({
          where: { id },
          data: {
            customer_id: customer,
            service_id: services,
            item_id: item,
            start_time,
            end_time,
            status,
            description,
          },
        });

        await insertEmployeeAndEquipmentRelations(id, employees, equipment);
      }
    });

    await Promise.all(rowsPromises);

    return new Response(JSON.stringify({ message: 'Reporte diario actualizado exitosamente.' }), { status: 200 });
  } catch (error) {
    console.error('Error en la transacción:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: `Error al actualizar el reporte diario: ${errorMessage}` }), { status: 500 });
  }
}

async function insertEmployeeAndEquipmentRelations(rowId: string, employees: string[], equipment: string[]) {
  try {
    // Actualizar relaciones con empleados
    await prisma.dailyreportemployeerelations.deleteMany({
      where: { daily_report_row_id: rowId },
    });

    if (employees && employees.length > 0) {
      const employeeData = employees.map((employee_id: string) => ({
        daily_report_row_id: rowId,
        employee_id,
      }));

      await prisma.dailyreportemployeerelations.createMany({
        data: employeeData,
      });
    }

    // Actualizar relaciones con equipos
    await prisma.dailyreportequipmentrelations.deleteMany({
      where: { daily_report_row_id: rowId },
    });

    if (equipment && equipment.length > 0) {
      const equipmentData = equipment.map((equipment_id: string) => ({
        daily_report_row_id: rowId,
        equipment_id,
      }));

      await prisma.dailyreportequipmentrelations.createMany({
        data: equipmentData,
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error en la inserción de relaciones: ${error.message}`);
    } else {
      throw new Error(`Error en la inserción de relaciones: ${JSON.stringify(error)}`);
    }
  }
}
