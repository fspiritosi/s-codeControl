import { supabaseServer } from './../../../../lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../supabase/supabase';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  try {
    let { data: dailyreportequipmentrelations, error } = await supabase
      .from('dailyreportequipmentrelations')
      .select(`*`)
      
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
    console.log('Cuerpo de la solicitud:', body); // Verificar el cuerpo de la solicitud

    // Asegúrate de que body es un array
    if (!Array.isArray(body)) {
      throw new Error('El cuerpo de la solicitud debe ser un array');
    }

    // Iterar sobre el array y procesar cada objeto
    const insertData = body.map(({ daily_report_row_id, equipment_id }) => ({
      daily_report_row_id,
      equipment_id
    }));

    console.log('Datos a insertar:', insertData);

    let { data, error } = await supabase
      .from('dailyreportequipmentrelations')
      .insert(insertData);

    if (error) {
      throw new Error(JSON.stringify(error));
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest){
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('actual');
    const { id, ...updateData } = await request.json(); 
  
    try {
      let { data, error } = await supabase
        .from('dailyreportequipmentrelations')
        .update(updateData)
        .eq('id', id);
      if (error) {
        throw new Error(JSON.stringify(error));
      }
      return Response.json({ data });
    } catch (error) {}
  }

export async function DELETE(request: NextRequest) {
    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('actual');
    const { id } = await request.json();
    try {
      let { data, error } = await supabase
        .from('dailyreportequipmentrelations')
        .delete()
        .eq('id', id);
      if (error) {
        throw new Error(JSON.stringify(error));
      }
      return Response.json({ data });
    } catch (error) {}
}