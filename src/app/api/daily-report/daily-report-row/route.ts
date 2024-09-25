import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual'); // ID de la compañía

  try {
    // Obtener todas las filas del parte diario
    let { data: dailyreportrows, error } = await supabase
      .from('dailyreportrows')
      .select(`*`)
      // .or(`employees.company_id.eq.${company_id},vehicles.company_id.eq.${company_id}`);

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return new Response(JSON.stringify({ dailyreportrows }), { status: 200 });
  } catch (error) {
    console.error('Error fetching daily report rows:', error);
    return new Response(JSON.stringify({error: (error as any).message }), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  try {
    const { daily_report_id, customer_id, service_id, item_id, start_time, end_time } = await request.json();
  
    let { data, error } = await supabase
      .from('dailyreportrows')
      .insert([
        {
          daily_report_id,
          customer_id,
          service_id,
          item_id,
          start_time,
          end_time,
        }
      ])
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
  console.log('Update data:', updateData);
  console.log('ID:', id);
  if (!id) {
    return new NextResponse(JSON.stringify({ error: 'ID is required for updating the daily report row.' }), { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('dailyreportrows')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error from Supabase:', error);
      return new NextResponse(JSON.stringify({ 
        error: error.message || 'Error desconocido',
        details: error.details || null,
        hint: error.hint || null
      }), { status: 500 });
    }

    return new NextResponse(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    console.error('Error inesperado al actualizar la fila de reporte diario:', error);
    return new NextResponse(JSON.stringify({ error: (error as any).message || 'Unexpected error occurred.' }), { status: 500 });
  }
}


export async function DELETE(request: NextRequest) {
  const supabase = supabaseServer();
  const { id } = await request.json();
  try {
    let { data, error } = await supabase
      .from('dailyreportrows')
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
