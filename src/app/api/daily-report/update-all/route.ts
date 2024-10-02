import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// export async function PUT(request: NextRequest) {
//   const supabase = supabaseServer();
//   const { rows, daily_report_id } = await request.json(); // Recibe las filas y el daily_report_id

//   if (!rows || rows.length === 0) {
//     return new Response(JSON.stringify({ error: 'No se enviaron filas de reporte.' }), { status: 400 });
//   }

//   if (!daily_report_id) {
//     return new Response(JSON.stringify({ error: 'daily_report_id es requerido.' }), { status: 400 });
//   }

//   try {
//     // Proceso de actualización de todas las filas y relaciones
//     const rowsPromises = rows.map(async (row: any) => {
//       const { id, customer, services, item, start_time, end_time, status, description, employees, equipment } = row;

//       // Si no hay id, se está insertando una nueva fila
//       let rowId = id;
//       if (!id) {
//         const { data, error } = await supabase
//           .from('dailyreportrows')
//           .insert({
//             daily_report_id, // Usa el daily_report_id para la nueva fila
//             customer_id: customer,
//             service_id: services,
//             item_id: item,
//             start_time,
//             end_time,
//             status,
//             description,
//           })
//           .select(); // Usamos select para obtener el id generado

//         if (error) {
//           throw new Error('Error al insertar nueva fila del reporte diario: ' + JSON.stringify(error));
//         }

//         rowId = data[0].id; // Capturamos el id de la nueva fila
//       } else {
//         // Actualizar la fila existente
//         const { data, error } = await supabase
//           .from('dailyreportrows')
//           .upsert({
//             id,
//             daily_report_id, // Asegúrate de que el daily_report_id se mantenga al actualizar también
//             customer_id: customer,
//             service_id: services,
//             item_id: item,
//             start_time,
//             end_time,
//             status,
//             description,
//           })
//           .eq('id', id);

//         if (error) {
//           throw new Error('Error al actualizar la fila del reporte diario: ' + JSON.stringify(error));
//         }
//       }

//       // Actualizar relaciones con empleados (borrar y luego insertar de nuevo)
//       await supabase
//         .from('dailyreportemployeerelations')
//         .delete()
//         .eq('daily_report_row_id', rowId); // Usamos el nuevo id generado o el existente

//       const employeeData = employees.map((employee_id: string) => ({
//         daily_report_row_id: rowId,
//         employee_id
//       }));

//       if (employeeData.length > 0) {
//         const { error: employeeError } = await supabase
//           .from('dailyreportemployeerelations')
//           .insert(employeeData);

//         if (employeeError) {
//           throw new Error('Error al insertar relaciones con empleados: ' + JSON.stringify(employeeError));
//         }
//       }

//       // Actualizar relaciones con equipos (borrar y luego insertar de nuevo)
//       await supabase
//         .from('dailyreportequipmentrelations')
//         .delete()
//         .eq('daily_report_row_id', rowId);

//       const equipmentData = equipment.map((equipment_id: string) => ({
//         daily_report_row_id: rowId,
//         equipment_id
//       }));

//       if (equipmentData.length > 0) {
//         const { error: equipmentError } = await supabase
//           .from('dailyreportequipmentrelations')
//           .insert(equipmentData);

//         if (equipmentError) {
//           throw new Error('Error al insertar relaciones con equipos: ' + JSON.stringify(equipmentError));
//         }
//       }

//       return rowId; // Retorna el id de la fila procesada (nueva o actualizada)
//     });

//     // Ejecutar todas las actualizaciones en paralelo
//     await Promise.all(rowsPromises);

//     return new Response(JSON.stringify({ message: 'Reporte diario actualizado exitosamente.' }), { status: 200 });
//   } catch (error) {
//     console.error('Error en la transacción:', error);
//     return new Response(JSON.stringify({ error: 'Error al actualizar el reporte diario.' }), { status: 500 });
//   }
// }




// export async function PUT(request: NextRequest) {
//   const supabase = supabaseServer();
//   const { rows, daily_report_id } = await request.json(); // Nos aseguramos de recibir el daily_report_id

//   if (!rows || rows.length === 0) {
//     return new Response(JSON.stringify({ error: 'No se enviaron filas de reporte.' }), { status: 400 });
//   }

//   if (!daily_report_id) {
//     return new Response(JSON.stringify({ error: 'daily_report_id es requerido.' }), { status: 400 });
//   }

//   try {
//     // Proceso de actualización o inserción de todas las filas y relaciones
//     const rowsPromises = rows.map(async (row: any) => {
//       const { id, customer, services, item, start_time, end_time, status, description, employees, equipment } = row;

//       let data, error;

//       // Si el id está vacío, hacemos un insert, si no, hacemos un update
//       if (!id) {
//         // Inserta una nueva fila con el daily_report_id
//         ({ data, error } = await supabase
//           .from('dailyreportrows')
//           .insert({
//             daily_report_id, // Aquí pasamos el daily_report_id para la nueva fila
//             customer_id: customer,
//             service_id: services,
//             item_id: item,
//             start_time,
//             end_time,
//             status,
//             description,
//           })
//           .select()); // Seleccionamos los datos insertados para obtener el nuevo id

//         if (error) {
//           throw new Error('Error al insertar la nueva fila del reporte diario: ' + JSON.stringify(error));
//         }

//         const newRowId = data?.[0]?.id; // Obtenemos el id de la nueva fila insertada

//         // Insertar relaciones con empleados y equipos para la nueva fila
//         await insertEmployeeAndEquipmentRelations(supabase, newRowId, employees, equipment);
//       } else {
//         // Actualizamos la fila existente
//         ({ data, error } = await supabase
//           .from('dailyreportrows')
//           .upsert({
//             id,
//             customer_id: customer,
//             service_id: services,
//             item_id: item,
//             start_time,
//             end_time,
//             status,
//             description,
//           }));

//         if (error) {
//           throw new Error('Error al actualizar la fila del reporte diario: ' + JSON.stringify(error));
//         }

//         // Actualizamos las relaciones con empleados y equipos para la fila existente
//         await insertEmployeeAndEquipmentRelations(supabase, id, employees, equipment);
//       }

//       return data;
//     });

//     // Ejecutar todas las inserciones/actualizaciones en paralelo
//     await Promise.all(rowsPromises);

//     return new Response(JSON.stringify({ message: 'Reporte diario actualizado exitosamente.' }), { status: 200 });
//   } catch (error) {
//     console.error('Error en la transacción:', error);
//     return new Response(JSON.stringify({ error: 'Error al actualizar el reporte diario.' }), { status: 500 });
//   }
// }

// Función auxiliar para manejar la inserción de relaciones de empleados y equipos
// async function insertEmployeeAndEquipmentRelations(supabase: any, rowId: string, employees: string[], equipment: string[]) {
//   try {
//     // Actualizar relaciones con empleados (borrar y luego insertar de nuevo)
//     await supabase
//       .from('dailyreportemployeerelations')
//       .delete()
//       .eq('daily_report_row_id', rowId);

//     const employeeData = employees.map((employee_id: string) => ({
//       daily_report_row_id: rowId,
//       employee_id
//     }));

//     if (employeeData.length > 0) {
//       const { error: employeeError } = await supabase
//         .from('dailyreportemployeerelations')
//         .insert(employeeData);

//       if (employeeError) {
//         throw new Error('Error al insertar relaciones con empleados: ' + JSON.stringify(employeeError));
//       }
//     }

//     // Actualizar relaciones con equipos (borrar y luego insertar de nuevo)
//     await supabase
//       .from('dailyreportequipmentrelations')
//       .delete()
//       .eq('daily_report_row_id', rowId);

//     const equipmentData = equipment.map((equipment_id: string) => ({
//       daily_report_row_id: rowId,
//       equipment_id
//     }));

//     if (equipmentData.length > 0) {
//       const { error: equipmentError } = await supabase
//         .from('dailyreportequipmentrelations')
//         .insert(equipmentData);

//       if (equipmentError) {
//         throw new Error('Error al insertar relaciones con equipos: ' + JSON.stringify(equipmentError));
//       }
//     }
//   } catch (error) {
//     if (error instanceof Error) {
//       throw new Error('Error en la inserción de relaciones: ' + error.message);
//     } else {
//       throw new Error('Error en la inserción de relaciones: ' + JSON.stringify(error));
//     }
//   }
// }

export async function PUT(request: NextRequest) {
  const supabase = supabaseServer();
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

      let data, error;

      if (!id || id === '') {
        // Insertar nueva fila
        ({ data, error } = await supabase
          .from('dailyreportrows')
          .insert({
            daily_report_id,
            customer_id: customer,
            service_id: services,
            item_id: item,
            start_time,
            end_time,
            status,
            description,
          })
          .select());

        if (error) throw new Error(`Error al insertar nueva fila: ${JSON.stringify(error)}`);

        if (!data || data.length === 0) {
          throw new Error('Error al insertar nueva fila: No se recibieron datos.');
        }
        const newRowId = data[0].id;
        await insertEmployeeAndEquipmentRelations(supabase, newRowId, employees, equipment);
      } else {
        // Actualizar fila existente
        ({ data, error } = await supabase
          .from('dailyreportrows')
          .update({
            customer_id: customer,
            service_id: services,
            item_id: item,
            start_time,
            end_time,
            status,
            description,
          })
          .eq('id', id));

        if (error) throw new Error(`Error al actualizar fila: ${JSON.stringify(error)}`);

        await insertEmployeeAndEquipmentRelations(supabase, id, employees, equipment);
      }

      return data;
    });

    await Promise.all(rowsPromises);

    return new Response(JSON.stringify({ message: 'Reporte diario actualizado exitosamente.' }), { status: 200 });
  } catch (error) {
    console.error('Error en la transacción:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: `Error al actualizar el reporte diario: ${errorMessage}` }), { status: 500 });
  }
}

async function insertEmployeeAndEquipmentRelations(supabase: any, rowId: string, employees: string[], equipment: string[]) {
  try {
    // Actualizar relaciones con empleados
    await supabase
      .from('dailyreportemployeerelations')
      .delete()
      .eq('daily_report_row_id', rowId);

    if (employees && employees.length > 0) {
      const employeeData = employees.map((employee_id: string) => ({
        daily_report_row_id: rowId,
        employee_id
      }));

      const { error: employeeError } = await supabase
        .from('dailyreportemployeerelations')
        .insert(employeeData);

      if (employeeError) throw new Error(`Error al insertar relaciones con empleados: ${JSON.stringify(employeeError)}`);
    }

    // Actualizar relaciones con equipos
    await supabase
      .from('dailyreportequipmentrelations')
      .delete()
      .eq('daily_report_row_id', rowId);

    if (equipment && equipment.length > 0) {
      const equipmentData = equipment.map((equipment_id: string) => ({
        daily_report_row_id: rowId,
        equipment_id
      }));

      const { error: equipmentError } = await supabase
        .from('dailyreportequipmentrelations')
        .insert(equipmentData);

      if (equipmentError) throw new Error(`Error al insertar relaciones con equipos: ${JSON.stringify(equipmentError)}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error en la inserción de relaciones: ${error.message}`);
    } else {
      throw new Error(`Error en la inserción de relaciones: ${JSON.stringify(error)}`);
    }
  }
}

  

  
  
  
  