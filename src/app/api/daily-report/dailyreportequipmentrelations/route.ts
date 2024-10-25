import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from './../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  try {
    let { data: dailyreportequipmentrelations, error } = await supabase
      .from('dailyreportequipmentrelations')
      .select(`*`);

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ dailyreportequipmentrelations });
  } catch (error) {}
}

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('actual');

  try {
    const body = await request.json();
    //console.log('Cuerpo de la solicitud:', body); // Verificar el cuerpo de la solicitud

    // Asegúrate de que body es un array
    if (!Array.isArray(body)) {
      throw new Error('El cuerpo de la solicitud debe ser un array');
    }

    // Iterar sobre el array y procesar cada objeto
    const insertData = body.map(({ daily_report_row_id, equipment_id }) => ({
      daily_report_row_id,
      equipment_id,
    }));

    //console.log('Datos a insertar:', insertData);

    let { data, error } = await supabase.from('dailyreportequipmentrelations').insert(insertData);

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('actual');
  const { id, ...updateData } = await request.json();

  // Verificar que el ID esté presente
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID is required for updating the daily report equipment relation.' }), {
      status: 400,
    });
  }

  // Verificar que haya datos para actualizar
  if (Object.keys(updateData).length === 0) {
    return new Response(JSON.stringify({ error: 'No data provided for update.' }), { status: 400 });
  }

  try {
    // Intentar actualizar la fila en la base de datos
    const { data, error } = await supabase.from('dailyreportequipmentrelations').update(updateData).eq('id', id);

    // Manejo de errores de Supabase
    if (error) {
      console.error('Error from Supabase:', error);
      return new Response(
        JSON.stringify({
          error: error.message || 'Error desconocido',
          details: error.details || null,
          hint: error.hint || null,
        }),
        { status: 500 }
      );
    }

    // Devolver los datos actualizados
    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    // Manejo de errores inesperados
    console.error('Error inesperado al actualizar la relación de equipo del reporte diario:', error);
    return new Response(JSON.stringify({ error: (error as any).message || 'Unexpected error occurred.' }), {
      status: 500,
    });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = supabaseServer();
  try {
    const body = await request.json();
    const { daily_report_row_id, equipment } = body;

    if (!Array.isArray(equipment)) {
      throw new Error('El cuerpo de la solicitud debe contener un array de equipos');
    }

    const deletePromises = equipment.map(async (equip: any) => {
      const { equipment_id } = equip;
      return supabase
        .from('dailyreportequipmentrelations')
        .delete()
        .eq('daily_report_row_id', daily_report_row_id)
        .eq('equipment_id', equipment_id);
    });

    const results = await Promise.all(deletePromises);

    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      throw new Error(JSON.stringify(errors.map((error) => error.error)));
    }

    return NextResponse.json({ data: 'Relaciones eliminadas correctamente' });
  } catch (error) {
    console.error('Error al eliminar las relaciones:', error);
    return NextResponse.json({ error: 'Error al eliminar las relaciones' }, { status: 500 });
  }
}
