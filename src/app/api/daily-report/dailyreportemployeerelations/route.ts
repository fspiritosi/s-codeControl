import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  try {
    let { data: dailyreportemployeerelations, error } = await supabase
      .from('dailyreportemployeerelations' as any)
      .select(`*`);

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ dailyreportemployeerelations });
  } catch (error) {}
}

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  // const companyId = searchParams.get('actual');

  try {
    const body = await request.json();
    //console.log('Cuerpo de la solicitud:', body); // Verificar el cuerpo de la solicitud

    // Asegúrate de que body es un array
    if (!Array.isArray(body)) {
      throw new Error('El cuerpo de la solicitud debe ser un array');
    }

    // Iterar sobre el array y procesar cada objeto
    const insertData = body.map(({ daily_report_row_id, employee_id }) => ({
      daily_report_row_id,
      employee_id,
    }));

    //console.log('Datos a insertar:', insertData);

    let { data, error } = await supabase.from('dailyreportemployeerelations' as any).insert(insertData);

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('actual');
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
    const { data, error } = await supabase
      .from('dailyreportemployeerelations' as any)
      .update(updateData)
      .eq('id', id);

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

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    console.error('Error inesperado al actualizar la fila de reporte diario:', error);
    return new Response(JSON.stringify({ error: (error as any).message || 'Unexpected error occurred.' }), {
      status: 500,
    });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = supabaseServer();
  try {
    const body = await request.json();
    const { daily_report_row_id, employees } = body;

    if (!Array.isArray(employees)) {
      throw new Error('El cuerpo de la solicitud debe contener un array de empleados');
    }

    const deletePromises = employees.map(async (employee: any) => {
      const { id, employee_id } = employee;
      return supabase
        .from('dailyreportemployeerelations' as any)
        .delete()
        .eq('daily_report_row_id', daily_report_row_id)
        .eq('employee_id', employee_id);
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
