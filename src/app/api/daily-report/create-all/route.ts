import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Datos recibidos del frontend
    const { date, status, company_id, editingId, rows, employees, equipment } = await request.json();

    let dailyReportId = editingId;

    // Si no existe `editingId`, estamos creando un nuevo parte diario
    if (!editingId) {
      if (!date) {
        throw new Error('La fecha es obligatoria para crear el parte diario.');
      }

      // Verificar si ya existe un parte diario con esa fecha
      const existingReports = await prisma.dailyreport.findMany({
        where: { date },
        select: { id: true },
      });

      if (existingReports.length > 0) {
        throw new Error(`Ya existe un parte diario con la fecha ${date}`);
      }

      // Crear el Parte Diario
      const created = await prisma.dailyreport.create({
        data: { date, status, company_id },
      });

      dailyReportId = created.id;
    } else {
      // Si `editingId` está presente, actualizar el parte diario existente
      const updated = await prisma.dailyreport.update({
        where: { id: editingId },
        data: { status, company_id },
      });

      dailyReportId = updated.id;
    }

    // 2. Insertar filas en la tabla dailyReportRow
    let dailyReportRowIds: string[] = [];
    if (rows) {
      const insertData: any = {
        daily_report_id: dailyReportId,
        customer_id: rows.customer_id,
        service_id: rows.service_id,
        item_id: rows.item_id,
        start_time: rows.start_time,
        end_time: rows.end_time,
      };

      const rowData = await prisma.dailyreportrows.create({
        data: insertData,
      });

      dailyReportRowIds = [rowData.id];
    }

    // 3. Relacionar empleados en dailyReportEmployeeRelations
    if (employees && employees.length > 0) {
      const employeeRelations = employees.flatMap((employee: { id: any }) =>
        dailyReportRowIds.map((rowId) => ({
          daily_report_row_id: rowId,
          employee_id: employee.id,
        }))
      );

      await prisma.dailyreportemployeerelations.createMany({
        data: employeeRelations,
      });
    }

    // 4. Relacionar equipos en dailyReportEquipmentRelations
    if (equipment && equipment.length > 0) {
      const equipmentRelations = equipment.flatMap((equip: { id: any }) =>
        dailyReportRowIds.map((rowId) => ({
          daily_report_row_id: rowId,
          equipment_id: equip.id,
        }))
      );

      await prisma.dailyreportequipmentrelations.createMany({
        data: equipmentRelations,
      });
    }

    // Responder con éxito
    return NextResponse.json(
      {
        message: editingId ? 'Parte diario editado exitosamente' : 'Parte diario creado exitosamente',
        report_id: dailyReportId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error procesando el parte diario:', error);
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
