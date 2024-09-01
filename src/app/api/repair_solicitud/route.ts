import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    let { data, error } = await supabase
      .from('repair_solicitudes')
      .select('*,equipment_id(*,type(*),brand(*),model(*)),reparation_type(*),repairlogs(*)')
      .eq('equipment_id.company_id', company_id)
      .not('equipment_id', 'is', null);

    const repair_solicitudes = data ?? [{}];

    console.log('repair_solicitudes', repair_solicitudes);

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ repair_solicitudes });
  } catch (error) {
    console.log(error);
  }
}

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();
  const body = await request.json();

  console.log('repair_solicitudes', body);

  try {
    const { data: repair_solicitudes, error } = await supabase.from('repair_solicitudes').insert(body).select();

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ repair_solicitudes: repair_solicitudes ?? {} });
  } catch (error) {
    console.log(error);
  }
}

export async function PUT(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const body = await request.json();

  try {
    const { data: repair_solicitudes, error } = await supabase.from('repair_solicitudes').update(body).eq('id', id);

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ repair_solicitudes });
  } catch (error) {
    console.log(error);
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = supabaseServer();
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  console.log('keloke', id);

  try {
    const { data: repair_solicitudes, error } = await supabase.from('repair_solicitudes').delete().eq('id', id);

    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return Response.json({ repair_solicitudes });
  } catch (error) {
    console.log(error);
  }
}
