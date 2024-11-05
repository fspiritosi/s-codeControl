// api/daily-report/create.ts
import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// export async function POST(request: NextRequest) {
//   const supabase = supabaseServer();

//   try {
//     const { date, status, company_id, rows } = await request.json();

//     // Validar que todos los campos requeridos están presentes
//     if (!date || !status || !company_id) {
//       throw new Error('Los campos date, status y company_id son requeridos.');
//     }

//     // Validar y formatear la fecha
//     const { data: existingReports, error: existingReportsError } = await supabase
//       .from('dailyreport')
//       .select('id')
//       .eq('date', date)
//       .eq('company_id', company_id);

//     if (existingReportsError) {
//       throw new Error(`Error al validar la fecha: ${existingReportsError.message}`);
//     }

//     let reportId;
//     if (existingReports.length > 0) {
//       // Parte diario ya existe
//       reportId = existingReports[0].id;
//     } else {
//       // Crear el Parte Diario
//       const { data, error } = await supabase
//         .from('dailyreport')
//         .insert([{ date, status, company_id }])
//         .select();

//       if (error || !data || data.length === 0) {
//         throw new Error(`Error creando parte diario: ${error?.message || 'No se pudo crear el parte diario'}`);
//       }

//       reportId = data[0].id;
//     }

//     // Agregar filas a la tabla dailyreportrow
//     if (rows && rows.length > 0) {
//       const rowsToInsert = rows.map((row: any) => ({
//         ...row,
//         dailyreport_id: reportId,
//       }));

//       const { data: rowsData, error: rowsError } = await supabase
//         .from('dailyreportrow')
//         .insert(rowsToInsert)
//         .select();

//       if (rowsError || !rowsData || rowsData.length === 0) {
//         throw new Error(`Error agregando filas: ${rowsError?.message || 'No se pudieron agregar las filas'}`);
//       }
//     }

//     return NextResponse.json({
//       message: 'Parte diario creado o actualizado exitosamente',
//       reportId,
//     }, { status: 201 });

//   } catch (error) {
//     console.error('Error en la creación o actualización del parte diario:', error);
//     return NextResponse.json({ error: (error as any).message }, { status: 500 });
//   }
// }

// src/app/api/daily-report/create.ts

// src/app/api/daily-report/create-or-update.ts

// export async function POST(request: NextRequest) {
//     const supabase = supabaseServer();

//     try {
//       // Datos recibidos del frontend
//       const { date, status, company_id, editingId, rows, employees, equipment } = await request.json();

//       let dailyReportId = editingId;

//       // Si no existe `editingId`, estamos creando un nuevo parte diario
//       if (!editingId) {
//         if (!date) {
//           throw new Error("La fecha es obligatoria para crear el parte diario.");
//         }

//         // Verificar si ya existe un parte diario con esa fecha
//         const { data: existingReports, error: existingReportsError } = await supabase
//           .from('dailyreport')
//           .select('id')
//           .eq('date', date);

//         if (existingReportsError) {
//           throw new Error(`Error al validar la fecha: ${existingReportsError.message}`);
//         }

//         if (existingReports.length > 0) {
//           throw new Error(`Ya existe un parte diario con la fecha ${date}`);
//         }

//         // Crear el Parte Diario
//         const { data, error } = await supabase
//           .from('dailyreport')
//           .insert([{ date, status, company_id }])
//           .select();

//         if (error || !data || data.length === 0) {
//           throw new Error(`Error creando parte diario: ${error?.message || 'No se pudo crear el parte diario'}`);
//         }

//         dailyReportId = data[0].id;
//       } else {
//         // Si `editingId` está presente, actualizar el parte diario existente
//         const { data, error } = await supabase
//           .from('dailyreport')
//           .update({ status, company_id })
//           .eq('id', editingId)
//           .select();

//         if (error || !data ) {
//           throw new Error(`Error editando parte diario: ${error?.message || 'No se pudo editar el parte diario'}`);
//         }

//         dailyReportId = data[0].id;
//       }
//       console.log(dailyReportId);
//       // 2. Insertar filas en la tabla dailyReportRow
//       let dailyReportRowIds: string[] = []; // Inicializar un array para los IDs de las filas
//       console.log(rows);
//       if (rows) {
//         const rowsToInsert = {
//           daily_report_id: dailyReportId,
//           customer_id: rows.customer_id,
//           service_id: rows.service_id,
//           item_id: rows.item_id,
//         //   start_time:rows.start_time,
//         //   end_time: rows.end_time,
//           status: "",
//           description: "",
//         };
//         console.log(rowsToInsert);
//         const { data: rowData, error: rowInsertError } = await supabase
//           .from('dailyreportrow')
//           .insert(rowsToInsert)
//           .select();

//           console.log('rowInsertError:', rowInsertError);

//         if (rowInsertError || !rowData) {
//           throw new Error(`Error insertando filas en dailyreportrow: ${rowInsertError?.message || 'No se pudo insertar filas'}`);
//         }

//         // Obtener todos los IDs de las filas insertadas
//         dailyReportRowIds = rowData.map(row => row.id); // Almacenar todos los IDs
//       }

//       // 3. Relacionar empleados en dailyReportEmployeeRelations
//       if (employees && employees.length > 0) {
//         const employeeRelations = employees.flatMap((employee: { id: any; }) =>
//           dailyReportRowIds.map(rowId => ({
//             daily_report_row_id: rowId,
//             employee_id: employee.id,
//           }))
//         );

//         const { error: employeeInsertError } = await supabase
//           .from('dailyreportemployeerelations')
//           .insert(employeeRelations);

//         if (employeeInsertError) {
//           throw new Error(`Error insertando relaciones de empleados: ${employeeInsertError.message}`);
//         }
//       }

//       // 4. Relacionar equipos en dailyReportEquipmentRelations
//       if (equipment && equipment.length > 0) {
//         const equipmentRelations = equipment.flatMap((equip: { id: any; }) =>
//           dailyReportRowIds.map(rowId => ({
//             daily_report_row_id: rowId, // Usa el ID de la fila correspondiente
//             equipment_id: equip.id,
//           }))
//         );

//         const { error: equipmentInsertError } = await supabase
//           .from('dailyreportequipmentrelations')
//           .insert(equipmentRelations);

//         if (equipmentInsertError) {
//           throw new Error(`Error insertando relaciones de equipos: ${equipmentInsertError.message}`);
//         }
//       }

//       // Responder con éxito
//       return NextResponse.json({
//         message: editingId ? 'Parte diario editado exitosamente' : 'Parte diario creado exitosamente',
//         report_id: dailyReportId
//       }, { status: 200 });

//     } catch (error) {
//       console.error('Error procesando el parte diario:', error);
//       return NextResponse.json({ error: (error as any).message }, { status: 500 });
//     }
//   }

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();

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
      const { data: existingReports, error: existingReportsError } = await supabase
        .from('dailyreport' as any)
        .select('id')
        .eq('date', date);

      if (existingReportsError) {
        throw new Error(`Error al validar la fecha: ${existingReportsError.message}`);
      }

      if (existingReports.length > 0) {
        throw new Error(`Ya existe un parte diario con la fecha ${date}`);
      }

      // Crear el Parte Diario
      const { data, error } = await supabase
        .from('dailyreport' as any)
        .insert([{ date, status, company_id }])
        .select();

      if (error || !data || data.length === 0) {
        throw new Error(`Error creando parte diario: ${error?.message || 'No se pudo crear el parte diario'}`);
      }

      dailyReportId = data[0].id;
    } else {
      // Si `editingId` está presente, actualizar el parte diario existente
      const { data, error } = await supabase
        .from('dailyreport' as any)
        .update({ status, company_id })
        .eq('id', editingId)
        .select();

      if (error || !data || data.length === 0) {
        throw new Error(`Error editando parte diario: ${error?.message || 'No se pudo editar el parte diario'}`);
      }

      dailyReportId = data[0].id;
    }
    //console.log(dailyReportId);
    // 2. Insertar filas en la tabla dailyReportRow
    let dailyReportRowIds: string[] = []; // Inicializar un array para los IDs de las filas
    //console.log(rows);
    if (rows) {
      const rowsToInsert = {
        daily_report_id: dailyReportId,
        customer_id: rows.customer_id,
        service_id: rows.service_id,
        item_id: rows.item_id,
        start_time: rows.start_time,
        end_time: rows.end_time,
        // status: "pendiente",
        // description: rows.description,
      };
      //console.log(rowsToInsert);
      const { data: rowData, error: rowInsertError } = await supabase
        .from('dailyreportrow' as any)
        .insert(rowsToInsert)
        .select();

      if (rowInsertError || !rowData) {
        throw new Error(
          `Error insertando filas en dailyreportrow: ${rowInsertError?.message || 'No se pudo insertar filas'}`
        );
      }

      // Obtener todos los IDs de las filas insertadas
      dailyReportRowIds = rowData.map((row) => row.id); // Almacenar todos los IDs
    }

    // 3. Relacionar empleados en dailyReportEmployeeRelations
    if (employees && employees.length > 0) {
      const employeeRelations = employees.flatMap((employee: { id: any }) =>
        dailyReportRowIds.map((rowId) => ({
          daily_report_row_id: rowId,
          employee_id: employee.id,
        }))
      );

      const { error: employeeInsertError } = await supabase
        .from('dailyreportemployeerelations' as any)
        .insert(employeeRelations);

      if (employeeInsertError) {
        throw new Error(`Error insertando relaciones de empleados: ${employeeInsertError.message}`);
      }
    }

    // 4. Relacionar equipos en dailyReportEquipmentRelations
    if (equipment && equipment.length > 0) {
      const equipmentRelations = equipment.flatMap((equip: { id: any }) =>
        dailyReportRowIds.map((rowId) => ({
          daily_report_row_id: rowId, // Usa el ID de la fila correspondiente
          equipment_id: equip.id,
        }))
      );

      const { error: equipmentInsertError } = await supabase
        .from('dailyreportequipmentrelations' as any)
        .insert(equipmentRelations);

      if (equipmentInsertError) {
        throw new Error(`Error insertando relaciones de equipos: ${equipmentInsertError.message}`);
      }
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
