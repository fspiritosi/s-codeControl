import { Select } from '@/components/ui/select';
// import { description } from '@/components/Graficos/RepairsChart';
import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual'); // ID de la compañía
  try {
    // Obtener todas las filas del parte diario filtradas por company_id
    let { data: dailyreportrows, error } = await supabase.from('dailyreportrows' as any)
    .select(`*,daily_report_id(date,company_id),customer_id(name), service_id(service_name), item_id(item_name)`)
    // .eq('daily_report_id.company_id', company_id);
    .eq('daily_report_id.company_id', company_id)
    .not('daily_report_id', 'is', null);
    
    
    // .or(`employees.company_id.eq.${company_id},vehicles.company_id.eq.${company_id}`);
    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return new Response(JSON.stringify({ dailyreportrows }), { status: 200 });
  } catch (error) {
    console.error('Error fetching daily report rows:', error);
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
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

    let { data, error } = await supabase
      .from('dailyreportrows' as any)
      .insert([insertData])
      .select();

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return new Response(JSON.stringify({ data }), { status: 201 });
  } catch (error) {
    console.error('Error inserting daily report row:', error);
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
}


export async function PUT(request: NextRequest) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const updateData = await request.json();
  // console.log('Update data:', updateData);
  // console.log('ID:', id);
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

    const { data, error } = await supabase
      .from('dailyreportrows' as any)
      .update(updateFields)
      .eq('id', id);

    if (error) {
      console.error('Error from Supabase:', error);
      return new NextResponse(
        JSON.stringify({
          error: error.message || 'Error desconocido',
          details: error.details || null,
          hint: error.hint || null,
        }),
        { status: 500 }
      );
    }

    return new NextResponse(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    console.error('Error inesperado al actualizar la fila de reporte diario:', error);
    return new NextResponse(JSON.stringify({ error: (error as any).message || 'Unexpected error occurred.' }), {
      status: 500,
    });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = supabaseServer();
  const { id } = await request.json();
  try {
    let { data, error } = await supabase
      .from('dailyreportrows' as any)
      .delete()
      .eq('id', id);
    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    console.error('Error deleting daily report row:', error);
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
}
